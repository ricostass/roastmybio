import sharp from 'sharp';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { analyzeProfile, softenRoast } from './analyze';
import type { ReviewResult } from './review';
import { overallScore } from './scoring';

const result: ReviewResult = {
  profile: {
    photos: [1, 2, 3].map((index) => ({ index, description: `photo ${index}` })),
    bio: null,
    prompts: [{ question: 'Together we could', answer: 'Ask me' }],
    age: 31,
  },
  review: {
    scores: { photos: 5.5, prompts: 3.2, bio: 1.5 },
    summary: 'Clear photos, nothing to reply to.',
    fixes: [{ text: 'Write a bio.', evidence: 'Survey' }],
    photoOrder: [{ photo: 2, tag: 'lead' }],
    rewrites: [],
  },
  roast: {
    verdict: { setup: 'Three photos.', punchline: 'Zero sentences.' },
    lines: [{ target: 'BIO', quote: null, joke: 'There is no bio.', wrong: 'Write one.' }],
    receipt: [{ label: 'BIO · missing', cringe: 2 }],
  },
};

const reviewScreenshots = vi.fn(async (images: string[], input: unknown) => {
  void images;
  void input;
  return result;
});
const roastProfile = vi.fn(async () => ({ ...result.roast!, verdict: { setup: 'Gentler.', punchline: 'Still true.' } }));

vi.mock('./review', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./review')>()),
  reviewConfigured: () => true,
  reviewScreenshots: (images: string[], input: unknown) => reviewScreenshots(images, input),
  roastProfile: () => roastProfile(),
}));

afterEach(() => vi.clearAllMocks());

async function png(name: string) {
  const buf = await sharp({ create: { width: 2340, height: 5064, channels: 3, background: '#c0ffee' } }).png().toBuffer();
  return new File([new Uint8Array(buf)], name, { type: 'image/png' });
}

describe('analyzeProfile', () => {
  it('scores what was read off the screenshots', async () => {
    const analysis = await analyzeProfile(
      { mode: 'roast', app: 'Hinge', looking: 'A relationship', heat: 'nochill', voice: true },
      [await png('a.png'), await png('b.png')],
    );
    expect(analysis.meta).toEqual({ photos: 3, prompts: 1 });
    expect(analysis.serious.overall).toBe(overallScore({ photos: 5.5, prompts: 3.2, bio: 1.5 }));
    expect(analysis.serious.photoOrder.map((p) => p.photo)).toEqual([2, 1, 3]);
    expect(analysis.roast?.cringe).toBe(2);
    expect(analysis.demo).toBeUndefined();

    const [images] = reviewScreenshots.mock.calls[0];
    expect(images).toHaveLength(2);
    const meta = await sharp(Buffer.from(images[0], 'base64')).metadata();
    expect(meta.format).toBe('jpeg');
    expect(Math.max(meta.width!, meta.height!)).toBe(1568);
  });

  it('keeps the serious review when the roast is softened', async () => {
    const original = await analyzeProfile(
      { mode: 'roast', app: 'Hinge', looking: 'A relationship', heat: 'nochill', voice: true },
      [await png('a.png')],
    );
    const softer = await softenRoast(original);
    expect(softer.id).not.toBe(original.id);
    expect(softer.serious).toEqual(original.serious);
    expect(softer.roast?.heat).toBe('easy');
    expect(softer.roast?.verdict.setup).toBe('Gentler.');
  });
});
