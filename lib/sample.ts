import { PLACEHOLDER_SOURCE } from './scoring';
import type { Heat, Roast, SeriousReview } from './types';

// Sample copy from the design handoff, used verbatim. Bracketed values are
// placeholders that stay in place until real sources are wired up.

export const SAMPLE_SERIOUS: SeriousReview = {
  overall: 7.4,
  sub: { photos: 6.8, prompts: 7.9, bio: 7.1 },
  summary: "Strong prompts, weak photo order. Your first two photos don't show what you actually do.",
  fixes: [
    {
      evidence: 'Platform data',
      text: 'Move the climbing photo (4) to first. Lead with something you do, not a selfie.',
      source: PLACEHOLDER_SOURCE,
    },
    {
      evidence: 'Survey',
      text: 'Say what you want. “Not sure yet” in the bio reads as not available.',
      source: PLACEHOLDER_SOURCE,
    },
    {
      evidence: 'Trend',
      text: 'Cut photo 1 (mirror) and photo 6 (gym). Two of the same angle is one too many.',
      source: PLACEHOLDER_SOURCE,
    },
  ],
  photoOrder: [
    { photo: 4, tag: 'lead' },
    { photo: 2, tag: 'keep' },
    { photo: 5, tag: 'keep' },
    { photo: 3, tag: 'keep-one-group' },
    { photo: 1, tag: 'cut' },
    { photo: 6, tag: 'cut' },
  ],
  trend: {
    title: 'Clear-coding beats mystery.',
    body: 'Profiles that say what they want get more replies than ones that stay vague. Hot takes beat neutral prompt answers — a real opinion gives people something to reply to.',
    source: 'Trend · source: [Publisher], [Year]',
  },
  rewrites: [
    {
      label: 'PROMPT 1 · “I\'m weirdly attracted to…”',
      current: 'People who are fluent in sarcasm',
      suggested: "People who order for the table without asking. Confidence, or chaos — I'll find out.",
      why: 'a specific scene gives a reply hook; “sarcasm” is on every third profile.',
    },
    {
      label: 'PROMPT 3 · “Together we could…”',
      current: 'Ask me',
      suggested: 'Finally settle whether the 6am swim is a personality or a cry for help.',
      why: '“Ask me” puts the work on them. An opinion gives them a reason to.',
    },
  ],
};

const SAMPLE_LINES = [
  {
    target: 'PHOTO 5',
    joke: "Holding that fish like it's your firstborn. Only thing in this profile you've ever actually caught.",
    wrong: 'Four of six photos are solo, same angle. None show you with people.',
  },
  {
    target: 'PROMPT 2',
    quote: "I'd never cheat",
    joke: "The good news: you'd never cheat. The bad news: that's not loyalty. That's market conditions.",
    wrong: "The answer says what you won't do, not what you want.",
  },
  {
    target: 'BIO',
    joke: 'Three emoji and a vibe. Nobody has ever messaged a vibe.',
    wrong: 'No sentence anyone can reply to. One specific line beats three symbols.',
  },
];

function segments(durationSec: number) {
  // Each roast line gets a slice of the note; it always ends on the real fixes.
  const at = (f: number) => Math.round(durationSec * f);
  return [
    { label: 'Photo 5', startSec: 0 },
    { label: 'Prompt 2', startSec: at(0.42) },
    { label: 'Bio', startSec: at(0.7) },
    { label: 'The real fixes', startSec: at(0.86) },
  ];
}

export const SAMPLE_ROAST: Record<Heat, Roast> = {
  easy: {
    heat: 'easy',
    verdict: { setup: 'Great profile.', punchline: 'In 2019.' },
    cringe: 6.2,
    lines: SAMPLE_LINES,
    receipt: [
      { label: 'PHOTO 1 · bathroom mirror, flash on', cringe: 1.4 },
      { label: 'PHOTO 5 · the fish, held like a firstborn', cringe: 1.6 },
      { label: 'PROMPT 1 · “fluent in sarcasm”', cringe: 1.2 },
      { label: 'PROMPT 3 · “ask me” (we did. nothing.)', cringe: 1.1 },
      { label: 'BIO · 3 emoji, 0 sentences', cringe: 0.9 },
    ],
    voice: { durationSec: 41, frameSec: 12, segments: segments(41) },
  },
  nochill: {
    heat: 'nochill',
    verdict: { setup: 'Not a red flag.', punchline: 'A beige one.' },
    cringe: 8.4,
    lines: SAMPLE_LINES,
    receipt: [
      { label: 'PHOTOS 1–4 · same angle, four times', cringe: 1.9 },
      { label: 'PHOTO 5 · fish, firstborn grip', cringe: 2.1 },
      { label: 'PROMPT 2 · “I\'d never cheat” (market conditions)', cringe: 1.8 },
      { label: 'PROMPT 3 · “ask me” (we did. nothing.)', cringe: 1.3 },
      { label: 'BIO · 3 emoji, 0 sentences', cringe: 1.3 },
    ],
    voice: { durationSec: 52, frameSec: 31, segments: segments(52) },
  },
};
