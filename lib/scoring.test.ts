import { describe, expect, it } from 'vitest';
import { buildCard } from './cards';
import { SAMPLE_SERIOUS } from './sample';
import { overallScore, sanitizePhotoOrder, toRoast, toSeriousReview, type RawReview, type RawRoast } from './scoring';
import type { Analysis, ProfileFacts } from './types';

const profile: ProfileFacts = {
  photos: [1, 2, 3, 4].map((index) => ({ index, description: `photo ${index}` })),
  bio: 'Recently moved back to the city.',
  prompts: [
    { question: "I'm weirdly attracted to", answer: 'People who are fluent in sarcasm' },
    { question: 'Together we could', answer: 'Ask me' },
  ],
  age: null,
};

const rawReview: RawReview = {
  scores: { photos: 6.4, prompts: 5.06, bio: 12 },
  summary: 'Good photos, generic prompts.',
  fixes: [1, 2, 3, 4].map((n) => ({ text: `fix ${n}`, evidence: 'Survey' as const })),
  photoOrder: [
    { photo: 3, tag: 'lead' },
    { photo: 3, tag: 'cut' },
    { photo: 9, tag: 'keep' },
    { photo: 1, tag: 'lead' },
  ],
  rewrites: [{ prompt: 2, question: 'Together we could', current: 'Ask me', suggested: 'Settle the pineapple question.', why: 'gives a hook.' }],
};

const rawRoast: RawRoast = {
  verdict: { setup: 'Great profile.', punchline: 'In 2019.' },
  lines: [
    { target: 'photo 4', quote: null, joke: 'Four photos, one angle.', wrong: 'Show other angles.' },
    { target: 'PROMPT 2', quote: 'Ask me', joke: 'We did. Nothing.', wrong: 'Give an opinion.' },
  ],
  receipt: [
    { label: 'PHOTO 4 · same angle', cringe: 1.24 },
    { label: 'PROMPT 2 · “ask me”', cringe: 9 },
    { label: 'BIO · moved back', cringe: 0.9 },
  ],
};

describe('overallScore', () => {
  it('weights photos, prompts and bio', () => {
    expect(overallScore({ photos: 8, prompts: 6, bio: 5 })).toBe(6.8);
    expect(overallScore({ photos: 10, prompts: 10, bio: 10 })).toBe(10);
  });
});

describe('toSeriousReview', () => {
  const review = toSeriousReview(rawReview, profile, SAMPLE_SERIOUS.trend);

  it('clamps sub-scores and derives the overall from them', () => {
    expect(review.sub).toEqual({ photos: 6.4, prompts: 5.1, bio: 10 });
    expect(review.overall).toBe(overallScore(review.sub));
  });

  it('keeps three fixes and labels rewrites by prompt number', () => {
    expect(review.fixes.map((f) => f.text)).toEqual(['fix 1', 'fix 2', 'fix 3']);
    expect(review.rewrites[0].label).toBe('PROMPT 2 · “Together we could”');
  });
});

describe('sanitizePhotoOrder', () => {
  it('lists every uploaded photo once with a single lead', () => {
    expect(sanitizePhotoOrder(rawReview.photoOrder, 4)).toEqual([
      { photo: 3, tag: 'lead' },
      { photo: 1, tag: 'keep' },
      { photo: 2, tag: 'keep' },
      { photo: 4, tag: 'keep' },
    ]);
  });

  it('promotes the first photo when nothing leads', () => {
    expect(sanitizePhotoOrder([{ photo: 2, tag: 'cut' }], 2)).toEqual([
      { photo: 2, tag: 'lead' },
      { photo: 1, tag: 'keep' },
    ]);
    expect(sanitizePhotoOrder([], 0)).toEqual([]);
  });
});

describe('toRoast', () => {
  const roast = toRoast('nochill', rawRoast);

  it('makes the Cringe-o-meter the sum of its receipt', () => {
    expect(roast.receipt.map((r) => r.cringe)).toEqual([1.2, 2.5, 0.9]);
    expect(roast.cringe).toBe(4.6);
  });

  it('times one voice-note segment per line, ending on the real fixes only going easy', () => {
    expect(roast.lines.map((l) => l.target)).toEqual(['PHOTO 4', 'PROMPT 2']);
    expect(roast.lines[0]).not.toHaveProperty('quote');
    expect(roast.voice.segments.map((s) => s.label)).toEqual(['Photo 4', 'Prompt 2']);
    expect(toRoast('easy', rawRoast).voice.segments.map((s) => s.label)).toEqual(['Photo 4', 'Prompt 2', 'The real fixes']);
    expect(roast.voice.segments[0].startSec).toBe(0);
    expect(roast.voice.segments.at(-1)!.startSec).toBeLessThan(roast.voice.durationSec);
  });

  it('makes the spoken script its own roast in the voice-note segments', () => {
    const voiced = toRoast('easy', {
      ...rawRoast,
      script: {
        parts: [
          { target: 'BIO', text: 'Your bio. I read your bio.' },
          { target: 'profile', text: 'The whole thing!' },
          { target: 'PHOTO 1', text: ' ' },
        ],
        fixes: 'Show another angle. Give an opinion.',
      },
    });
    // Its parts and labels come from the script, not the roast's lines; empty parts are dropped.
    expect(voiced.voice.segments.map((s) => [s.label, s.text])).toEqual([
      ['Bio', 'Your bio. I read your bio.'],
      ['Profile', 'The whole thing!'],
      ['The real fixes', 'Show another angle. Give an opinion.'],
    ]);
    expect(roast.voice.segments.every((s) => s.text === undefined)).toBe(true);
  });

  it('reads the roast’s lines when the script has no parts', () => {
    const voiced = toRoast('nochill', { ...rawRoast, script: { parts: [] } });
    expect(voiced.voice.segments.map((s) => s.text)).toEqual(['Four photos, one angle.', 'We did. Nothing.']);
  });

  it('feeds the share cards', () => {
    const analysis = { id: 'x', meta: { photos: 4, prompts: 2 }, roast } as Analysis;
    expect(buildCard(analysis, { kind: 'verdict', format: '1:1' })?.cringe).toBe(4.6);
    expect(buildCard(analysis, { kind: 'line', line: 1, format: '9:16' })?.line?.quote).toBe('Ask me');
  });
});
