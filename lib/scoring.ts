import type { Evidence, Heat, PhotoPick, ProfileFacts, ReceiptItem, Roast, SeriousReview, Source } from './types';

// Turns the model's raw review into the numbers the result pages show. The
// arithmetic lives here, not in the model, so the overall score always follows
// from the sub-scores and the Cringe-o-meter always adds up to its receipt.

export const PLACEHOLDER_SOURCE: Source = {
  publisher: '[Publisher]',
  year: '[Year]',
  sample: 'n=[sample size]',
  finding: '[One-line finding this fix is based on]',
};

/** How much each part counts toward the overall score. Photos decide most swipes. */
export const WEIGHTS = { photos: 0.5, prompts: 0.3, bio: 0.2 } as const;

/** The most a single receipt line can add to the Cringe-o-meter. */
export const MAX_ITEM_CRINGE = 2.5;

export function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Number.isFinite(n) ? n : min));
}

/** 0–10, one decimal. */
export function clampScore(n: number) {
  return round1(clamp(n, 0, 10));
}

export function overallScore(sub: SeriousReview['sub']) {
  return clampScore(sub.photos * WEIGHTS.photos + sub.prompts * WEIGHTS.prompts + sub.bio * WEIGHTS.bio);
}

/** Every uploaded photo exactly once, in the suggested order, with exactly one lead. */
export function sanitizePhotoOrder(order: PhotoPick[], photoCount: number): PhotoPick[] {
  const seen = new Set<number>();
  const out: PhotoPick[] = [];
  for (const pick of order) {
    if (!Number.isInteger(pick.photo) || pick.photo < 1 || pick.photo > photoCount || seen.has(pick.photo)) continue;
    seen.add(pick.photo);
    out.push({ ...pick });
  }
  for (let photo = 1; photo <= photoCount; photo++) if (!seen.has(photo)) out.push({ photo, tag: 'keep' });
  let lead = false;
  for (const pick of out) {
    if (pick.tag !== 'lead') continue;
    if (lead) pick.tag = 'keep';
    lead = true;
  }
  if (!lead && out.length) out[0] = { ...out[0], tag: 'lead' };
  return out;
}

export interface RawReview {
  scores: { photos: number; prompts: number; bio: number };
  summary: string;
  fixes: { text: string; evidence: Evidence }[];
  photoOrder: PhotoPick[];
  rewrites: { prompt: number; question: string; current: string; suggested: string; why: string }[];
}

export function toSeriousReview(raw: RawReview, profile: ProfileFacts, trend: SeriousReview['trend']): SeriousReview {
  const sub = {
    photos: clampScore(raw.scores.photos),
    prompts: clampScore(raw.scores.prompts),
    bio: clampScore(raw.scores.bio),
  };
  return {
    overall: overallScore(sub),
    sub,
    summary: raw.summary,
    fixes: raw.fixes.slice(0, 3).map((f) => ({ text: f.text, evidence: f.evidence, source: PLACEHOLDER_SOURCE })),
    photoOrder: sanitizePhotoOrder(raw.photoOrder, profile.photos.length),
    trend,
    rewrites: raw.rewrites.slice(0, 3).map((r) => ({
      label: `PROMPT ${r.prompt} · “${r.question}”`,
      current: r.current,
      suggested: r.suggested,
      why: r.why,
    })),
  };
}

export interface RawRoast {
  verdict: { setup: string; punchline: string };
  lines: { target: string; quote: string | null; joke: string; wrong: string }[];
  receipt: ReceiptItem[];
  /** The voice note, to be read aloud: one part per line, then the real fixes. */
  script?: { lines: string[]; fixes: string };
}

/** "PHOTO 5" → "Photo 5", for "Now roasting: Photo 5". */
function segmentLabel(target: string) {
  const t = target.trim().toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function wordCount(s: string) {
  return s.split(/\s+/).filter(Boolean).length;
}

export function toRoast(heat: Heat, raw: RawRoast): Roast {
  const lines = raw.lines.slice(0, 5).map((l) => ({
    target: l.target.trim().toUpperCase(),
    ...(l.quote ? { quote: l.quote } : {}),
    joke: l.joke,
    wrong: l.wrong,
  }));
  const receipt = raw.receipt.slice(0, 6).map((r) => ({ label: r.label, cringe: round1(clamp(r.cringe, 0, MAX_ITEM_CRINGE)) }));
  const cringe = clampScore(receipt.reduce((sum, r) => sum + r.cringe, 0));

  // One part of the note per line, and it always ends on the real fixes. With a
  // script, each part has the words that get read aloud; anything the script
  // left empty is read as written in the roast.
  const script = raw.script;
  const fixes = lines.map((l) => l.wrong).join(' ');
  const parts = [
    ...lines.map((l, i) => ({ label: segmentLabel(l.target), text: script?.lines[i]?.trim() || l.joke })),
    { label: 'The real fixes', text: script?.fixes.trim() || fixes },
  ].map((p) => ({ label: p.label, text: script ? p.text : undefined, words: wordCount(p.text) }));

  // Until there's audio to time it from, assume roughly 2.6 spoken words a second.
  const words = Math.max(1, parts.reduce((n, p) => n + p.words, 0));
  const durationSec = Math.round(clamp(words / 2.6 + 4, 20, 90));
  let said = 0;
  const segments = parts.map((p) => {
    const startSec = Math.round((durationSec * said) / words);
    said += p.words;
    return { label: p.label, startSec, ...(p.text ? { text: p.text } : {}) };
  });

  return {
    heat,
    verdict: raw.verdict,
    cringe,
    lines,
    receipt,
    voice: { durationSec, frameSec: Math.round(durationSec * 0.3), segments },
  };
}
