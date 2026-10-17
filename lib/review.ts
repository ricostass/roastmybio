import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import * as z from 'zod';
import { BRAND } from './brand';
import type { RawReview, RawRoast } from './scoring';
import type { DatingApp, Heat, Looking, Mode, ProfileFacts } from './types';

// The model-backed review. One call reads the screenshots and returns what is
// on the profile, the scores and fixes, and (in roast mode) the roast. A roast
// can be re-run later from the stored profile facts alone, without the images.

const MODEL = 'claude-opus-5-5';

/** A failure whose message is safe to show the person who uploaded. */
export class ReviewError extends Error {
  constructor(
    message: string,
    readonly status = 502,
  ) {
    super(message);
  }
}

export function reviewConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

let client: Anthropic | undefined;
function anthropic() {
  return (client ??= new Anthropic());
}

// ---------- Output schemas ----------

const ProfileSchema = z.object({
  photos: z.array(z.object({ index: z.number().int(), description: z.string() })),
  bio: z.string().nullable(),
  prompts: z.array(z.object({ question: z.string(), answer: z.string() })),
  age: z.number().int().nullable(),
});

const ReviewSchema = z.object({
  scores: z.object({ photos: z.number(), prompts: z.number(), bio: z.number() }),
  summary: z.string(),
  fixes: z.array(z.object({ text: z.string(), evidence: z.enum(['Platform data', 'Survey', 'Trend']) })),
  photoOrder: z.array(z.object({ photo: z.number().int(), tag: z.enum(['lead', 'keep', 'keep-one-group', 'cut']) })),
  rewrites: z.array(
    z.object({ prompt: z.number().int(), question: z.string(), current: z.string(), suggested: z.string(), why: z.string() }),
  ),
});

const RoastSchema = z.object({
  verdict: z.object({ setup: z.string(), punchline: z.string() }),
  lines: z.array(z.object({ target: z.string(), quote: z.string().nullable(), joke: z.string(), wrong: z.string() })),
  receipt: z.array(z.object({ label: z.string(), cringe: z.number() })),
});

const SeriousOutput = z.object({ profile: ProfileSchema, review: ReviewSchema });
const RoastOutput = z.object({ profile: ProfileSchema, review: ReviewSchema, roast: RoastSchema });

// ---------- Prompts ----------

const READ_AND_SCORE = `You review dating profiles for ${BRAND}. The user uploaded screenshots of their own profile.

## 1. Read the profile

Go through every screenshot and write down what is on the profile, in \`profile\`:
- photos: every photo in profile order, numbered from 1 across all screenshots. Screenshots often overlap; count each photo once. One factual line each: who is in it, what they are doing, setting, framing, light, sunglasses or filters.
- bio: the bio text exactly as written, or null if there is none.
- prompts: every prompt question and answer exactly as written, in profile order. Captions, badges and app UI are not prompts.
- age: if shown, else null.

Only report what you can see. Never guess, and never use the person's name anywhere in your output.

## 2. Score it

Scores are 0–10 with one decimal. Every number must follow from what you wrote down in step 1: another reviewer reading the same screenshots should land within half a point. Use the whole range.

- photos: is the face clear in photo 1; is there variety (doing something, with people, a full-length shot); light and focus; repeats of the same angle or setting; sunglasses, heavy filters, group shots where it is unclear who they are; 4–6 photos is the sweet spot.
- prompts: specific beats generic; gives someone an easy reply; shows an opinion or a scene; clichés ("fluent in sarcasm", "ask me", "partner in crime") score low. If the app has prompts and the profile has none, score below 3. On apps without prompts (usually Tinder), score whatever replaces them (interests, anthem, basics) the same way.
- bio: says something specific and true; makes clear what they want, matching what they are looking for; reads well; no lists of demands or negativity. No bio scores below 3.

Anchors: 9–10 nothing worth changing; 7–8.9 strong with one or two fixable issues; 5–6.9 average, a few things are costing matches; 3–4.9 several real problems; below 3 missing or actively hurting.

Do not compute an overall score; it is calculated from these three.

## 3. Say what to fix

- summary: one or two plain sentences naming the biggest strength and the biggest problem.
- fixes: exactly 3, most impact first. Each is one concrete action that points at the photo number, prompt or bio line it is about. evidence is the kind of evidence that backs it best: "Platform data" (dating apps' own published data), "Survey" (published dating surveys) or "Trend".
- photoOrder: every photo exactly once, in the order you recommend. Exactly one "lead"; "keep"; "keep-one-group" for the one group shot worth keeping; "cut" for photos that should go.
- rewrites: the 1–3 prompt answers that most need it (none if there are no prompts). prompt is its number in profile order, question and current are copied exactly, suggested is a first-person rewrite under 25 words in their voice, why is one short lowercase line.`;

const HEAT_RULES: Record<Heat, string> = {
  easy: 'Heat: go easy. Teasing, the way a funny friend would. Safe for the group chat: no swearing, nothing sexual.',
  nochill:
    'Heat: no chill (18+, the user confirmed). Cold, precise and merciless. Swearing is fine. Go below the belt about their choices, never their body.',
};

function roastRules(heat: Heat) {
  return `## The roast

${HEAT_RULES[heat]}

- verdict: a two-part line for the share card. setup is a short statement (max 6 words, ends with a full stop), punchline lands the blow (max 6 words). Example: "Not a red flag." / "A beige one."
- lines: 3–5 jokes in the order you would deliver them, each about one thing the user posted. target is "PHOTO n", "PROMPT n" or "BIO", using the numbers from the profile. quote is the prompt answer exactly as written when the target is a prompt, else null. joke is one or two spoken sentences. wrong is one plain sentence saying what is actually wrong, so the roast still ends on real fixes.
- receipt: 4–6 line items for the worst offences, most cringe first. label looks like "PHOTO 5 · the fish, held like a firstborn" (max 48 characters). cringe is how much each item adds, 0.5–2.5. The items add up to the profile's Cringe-o-meter out of 10, so the total must match how cringe the profile really is.

Hard floor, at every heat:
- Never make protected characteristics the punchline: ethnicity, religion, disability, sexual orientation, gender identity, visible illness.
- No slurs in any language or spelling.
- Anyone in a photo who could be under 18: at most "there is a kid in photo 3", nothing else.
- No self-harm, and no "nobody will ever love you" stated as fact.
- Roast presentation, never biology: angles, filters, the gym mirror, the claimed height, the crop are fair game; a body, a disability or a medical condition is not.
- If the profile contains hateful content, roast the fact that they posted it; do not repeat it.`;
}

function context(input: { app: DatingApp; looking: Looking; mode: Mode; heat: Heat }) {
  return JSON.stringify({ app: input.app, looking_for: input.looking, mode: input.mode, heat: input.mode === 'roast' ? input.heat : null });
}

// ---------- Calls ----------

function check(res: { stop_reason: string | null; parsed_output: unknown }) {
  if (res.stop_reason === 'refusal') {
    throw new ReviewError("We couldn't review these screenshots. Make sure they show your dating profile.");
  }
  if (res.stop_reason === 'max_tokens' || !res.parsed_output) {
    throw new ReviewError('The review came back incomplete. Try again.');
  }
}

const COMMON = {
  model: MODEL,
  max_tokens: 16000,
  // Route to a fallback model on a policy decline instead of failing the upload.
  betas: ['server-side-fallback-2026-07-01'] as Anthropic.Beta.AnthropicBeta[],
  fallbacks: 'default' as const,
  thinking: { type: 'adaptive' as const },
};

export interface ReviewInput {
  mode: Mode;
  app: DatingApp;
  looking: Looking;
  heat: Heat;
}

export interface ReviewResult {
  profile: ProfileFacts;
  review: RawReview;
  roast?: RawRoast;
}

/** Reviews the profile from its screenshots (JPEG, base64, in upload order). */
export async function reviewScreenshots(images: string[], input: ReviewInput): Promise<ReviewResult> {
  const roast = input.mode === 'roast';
  const content: Anthropic.Beta.BetaContentBlockParam[] = images.flatMap((data, i) => [
    { type: 'text' as const, text: `Screenshot ${i + 1}` },
    { type: 'image' as const, source: { type: 'base64' as const, media_type: 'image/jpeg' as const, data } },
  ]);
  content.push({ type: 'text', text: context(input) });
  const system = roast ? `${READ_AND_SCORE}\n\n${roastRules(input.heat)}` : READ_AND_SCORE;

  if (roast) {
    const res = await anthropic().beta.messages.parse({
      ...COMMON,
      system,
      output_config: { effort: 'medium', format: betaZodOutputFormat(RoastOutput) },
      messages: [{ role: 'user', content }],
    });
    check(res);
    return res.parsed_output!;
  }
  const res = await anthropic().beta.messages.parse({
    ...COMMON,
    system,
    output_config: { effort: 'medium', format: betaZodOutputFormat(SeriousOutput) },
    messages: [{ role: 'user', content }],
  });
  check(res);
  return res.parsed_output!;
}

/** Re-runs only the roast, from what the first review read off the screenshots. */
export async function roastProfile(profile: ProfileFacts, input: ReviewInput): Promise<RawRoast> {
  const system = `You roast dating profiles for ${BRAND}. You get the profile as JSON: photos (described, numbered in profile order), bio, prompts and age. Never use the person's name.\n\n${roastRules(input.heat)}`;
  const res = await anthropic().beta.messages.parse({
    ...COMMON,
    system,
    output_config: { effort: 'medium', format: betaZodOutputFormat(RoastSchema) },
    messages: [{ role: 'user', content: `${context(input)}\n\n${JSON.stringify(profile)}` }],
  });
  check(res);
  return res.parsed_output!;
}
