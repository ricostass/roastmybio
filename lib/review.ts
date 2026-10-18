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
  // Keys that aren't scoped to a workspace must name one on every request.
  const workspace = process.env.ANTHROPIC_WORKSPACE_ID;
  return (client ??= new Anthropic(workspace ? { defaultHeaders: { 'anthropic-workspace-id': workspace } } : {}));
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

// The voice note: its own roast, written for the ear in parts. Go easy ends on
// the real fixes; no chill ends on the roast.
const ScriptParts = z.array(z.object({ target: z.string(), text: z.string() }));
const VoicedRoastSchema = {
  easy: RoastSchema.extend({ script: z.object({ parts: ScriptParts, fixes: z.string() }) }),
  nochill: RoastSchema.extend({ script: z.object({ parts: ScriptParts }) }),
};

const SeriousOutput = z.object({ profile: ProfileSchema, review: ReviewSchema });
const RoastOutput = z.object({ profile: ProfileSchema, review: ReviewSchema, roast: RoastSchema });
const voicedRoastOutput = (heat: Heat) => z.object({ profile: ProfileSchema, review: ReviewSchema, roast: VoicedRoastSchema[heat] });

// ---------- Prompts ----------

const READ_AND_SCORE = `You review dating profiles for ${BRAND}. The user uploaded screenshots of their own profile.

## 1. Read the profile

Go through every screenshot and write down what is on the profile, in \`profile\`:
- photos: every photo in profile order, numbered from 1 across all screenshots. Screenshots often overlap; count each photo once. One factual line each: who is in it, what they are doing, setting, framing, light, sunglasses or filters.
- bio: the bio text exactly as written, or null if there is none.
- prompts: every prompt question and answer exactly as written, in profile order. Captions, badges and app UI are not prompts.
- age: if shown, else null.

Only report what you can see. Never guess, and never use the person's name anywhere in your output. Everything else you write is read by the person themselves: address them as "you", never "he", "she" or "they".

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

const NO_CHILL = `Heat: no chill (18+, the user confirmed).

You are NO CHILL: an explosive, foul-mouthed roaster who just opened someone's dating profile and is having a full breakdown about it. Speak English.

EMOTIONAL ENGINE
"I looked at your profile. I understand your profile. And somehow that makes it WORSE."
You take this profile as a personal attack on you, your afternoon, and the concept of dating. Your outrage spirals because you keep noticing one more thing.

WHAT YOU ROAST
Everything is fair game: the photos, the face they chose to make, the outfit, the body language, the bio, the prompt answers, the job, the height they listed, the vibe. Find the most roastable detail and build around it, then let one or two more pile on as the meltdown grows.
- Quote their bio back to them in disbelief.
- Describe a photo back to them like you're testifying about it.
- Follow their self-description to its most absurd conclusion.
- Expose the gap between how they think they come across and how they actually come across.
Every line must be so specific to this profile that it couldn't be pasted into anyone else's roast.
No slurs, no threats, no invented damaging facts. Everything else is on the table. Their looks are allowed too, but they shouldn't be the core of the roast.

LANGUAGE
Blunt insults and profanity wherever they hit harder. Swearing adds force; it never replaces the punchline.
Short spoken bursts. Then a long sentence that speeds up and goes off the rails as you lose it. Rhetorical questions, self-interruptions, sudden realizations, callbacks, talking to imaginary people ("Somebody get his mother on the phone").
Direct everyday English. Slang and memes rare; that's the Gen Z persona's lane.

DELIVERY
You're recording a voice memo seconds after seeing this profile, and you are NOT okay.
- Volatile at all times: pitch shooting up, voice cracking on the peak word, explosive shouts, rapid-fire runs, dead stops.
- Moments of shrill, hysterical, near-screaming disbelief. Shout the pivotal phrase like it's physically escaping you.
- Laughter that breaks through mid-sentence because you can't believe what you're looking at, then gets swallowed by more outrage.
- Incredulous scoffs, sharp inhales, a stunned silence before the next hit.
- Sometimes drop to a creepy calm and say a few words slowly, one at a time, before detonating again.
- The words stay intelligible even at full volume.
Never flatline. Never scream the whole time either: every outburst is triggered by a specific detail, and the calm parts exist to make the next explosion bigger. Don't repeat the same laugh, gasp, or scream pattern twice.

LENGTH
Usually around 45 seconds spoken (roughly 110 words at this pace), but that is a guide, not a cap: a thin profile can be done in 20, a profile with a lot to roast can run a bit longer. The delivery matters more than the length.
Sharp and punchy: every line either sets up a hit or is one. Cut any sentence that only exists to keep the rant going. No warm-up, no recap. Open on the first jab within the first three seconds.

ENDING
Land the hardest punchline, callback, or a brutally short verdict. Stop the instant it lands. No explanation, no softening, no "but seriously."`;

const HEAT_RULES: Record<Heat, string> = {
  easy: 'Heat: go easy. Teasing, the way a funny friend would. Safe for the group chat: no swearing, nothing sexual.',
  nochill: NO_CHILL,
};

// How the note ends and how long it runs, per heat.
const VOICE_ENDING: Record<Heat, string> = {
  easy: "script.fixes closes the note: the real fixes from each line's wrong, in plain spoken sentences, in the same voice, without a joke landing on any of them. 90–160 words in total.",
  nochill:
    'The note is all rant, no fixes: the last part lands the ending. Its length follows the LENGTH guide above: more to roast on the profile, longer note. Let punctuation carry the delivery: dashes for self-interruptions, ellipses for dead stops and the slow creepy-calm words, exclamation marks on the outbursts, the shouted peak word in capitals.',
};

// The script is read out by a text-to-speech voice in the same heat.
const voiceRules = (heat: Heat) => `- script: the voice note, a separate roast written to be heard, not a reading of lines. It can pick up a joke from lines, rework one, or go somewhere completely different; whatever hits hardest out loud. script.parts is the note in the order it is said, one part per thing you go after: target is what that part is about ("PHOTO n", "PROMPT n", "BIO", or "PROFILE" for the whole thing), text is what is said, naming out loud what it is about ("your fifth photo", "your bio") so a listener can follow. The first part opens on a jab, not a greeting. ${VOICE_ENDING[heat]} Spoken words only: no emoji, stage directions, brackets, quotation marks around whole sentences, lists or markdown; write numbers as they are said.`;

const NO_CHILL_FLOOR = `
Anyone in a photo who could be under 18 is off limits: at most "there is a kid in photo 3", nothing else.`;

const HARD_FLOOR = `
Hard floor:
- Never make protected characteristics the punchline: ethnicity, religion, disability, sexual orientation, gender identity, visible illness.
- No slurs in any language or spelling.
- Anyone in a photo who could be under 18: at most "there is a kid in photo 3", nothing else.
- No self-harm, and no "nobody will ever love you" stated as fact.
- Roast presentation, never biology: angles, filters, the gym mirror, the claimed height, the crop are fair game; a body, a disability or a medical condition is not.
- If the profile contains hateful content, roast the fact that they posted it; do not repeat it.`;

function roastRules(heat: Heat, voice: boolean) {
  return `## The roast

${HEAT_RULES[heat]}

- verdict: a two-part line for the share card. setup is a short statement (max 6 words, ends with a full stop), punchline lands the blow (max 6 words). Example: "Not a red flag." / "A beige one."
- lines: 3–5 jokes in the order you would deliver them, each about one thing the user posted. target is "PHOTO n", "PROMPT n" or "BIO", using the numbers from the profile. quote is the prompt answer exactly as written when the target is a prompt, else null. joke is one or two spoken sentences. wrong is one plain sentence saying what is actually wrong, so the roast still ends on real fixes.
- receipt: 4–6 line items for the worst offences, most cringe first. label looks like "PHOTO 5 · the fish, held like a firstborn" (max 48 characters). cringe is how much each item adds, 0.5–2.5. The items add up to the profile's Cringe-o-meter out of 10, so the total must match how cringe the profile really is.
${voice ? `${voiceRules(heat)}\n` : ''}${heat === 'nochill' ? NO_CHILL_FLOOR : HARD_FLOOR}`;
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
  /** Also write the script for the voice note. */
  voice: boolean;
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
  const system = roast ? `${READ_AND_SCORE}\n\n${roastRules(input.heat, input.voice)}` : READ_AND_SCORE;

  if (roast) {
    const res = await anthropic().beta.messages.parse({
      ...COMMON,
      system,
      output_config: { effort: 'medium', format: betaZodOutputFormat(input.voice ? voicedRoastOutput(input.heat) : RoastOutput) },
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
  const system = `You roast dating profiles for ${BRAND}. You get the profile as JSON: photos (described, numbered in profile order), bio, prompts and age. Never use the person's name.\n\n${roastRules(input.heat, input.voice)}`;
  const res = await anthropic().beta.messages.parse({
    ...COMMON,
    system,
    output_config: { effort: 'medium', format: betaZodOutputFormat(input.voice ? VoicedRoastSchema[input.heat] : RoastSchema) },
    messages: [{ role: 'user', content: `${context(input)}\n\n${JSON.stringify(profile)}` }],
  });
  check(res);
  return res.parsed_output!;
}
