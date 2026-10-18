import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { sampleAnalysis } from './analyze';
import { toRoast, type RawRoast } from './scoring';
import type { Analysis, Heat } from './types';
import { voiceOver } from './voice';

// 24 ms MPEG 2 Layer III frames, as in mp3.test.ts.
function clip(frames: number) {
  const out = new Uint8Array(frames * 96);
  for (let i = 0; i < frames; i++) out.set([0xff, 0xf3, 0x44, 0xc0], i * 96);
  return out;
}

const raw: RawRoast = {
  verdict: { setup: 'Three photos.', punchline: 'Zero sentences.' },
  lines: [
    { target: 'PHOTO 2', quote: null, joke: 'A fish.', wrong: 'Show people.' },
    { target: 'BIO', quote: null, joke: 'No bio.', wrong: 'Write one.' },
  ],
  receipt: [{ label: 'BIO · missing', cringe: 2 }],
  script: "ok so three photos and zero sentences, not the fish, i'm done—",
};

function analysis(heat: Heat = 'genz'): Analysis {
  return { ...sampleAnalysis('abc123', { mode: 'roast', app: 'Hinge', looking: 'A relationship', heat, voice: true }), roast: toRoast(heat, raw) };
}

const rant = raw.script!;
const fetchMock = vi.fn(async () => new Response(clip(150), { headers: { 'Content-Type': 'audio/mpeg' } }));

beforeEach(() => {
  vi.stubEnv('OPENAI_API_KEY', 'test-key');
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('voiceOver', () => {
  it('reads the script aloud in one go, in each roaster’s own voice', async () => {
    await voiceOver(analysis('genz'));
    await voiceOver(analysis('nochill'));
    const bodies = fetchMock.mock.calls.map((call) => JSON.parse(String((call as unknown as [string, RequestInit])[1].body)));
    expect(bodies.map((b) => [b.input, b.voice])).toEqual([
      [rant, 'nova'],
      [rant, 'ash'],
    ]);
    expect(bodies[0].instructions).not.toBe(bodies[1].instructions);
    expect((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].headers).toMatchObject({ Authorization: 'Bearer test-key' });
  });

  it('times the note from the audio and serves it from the site', async () => {
    const { analysis: voiced, voiceNote } = await voiceOver(analysis());
    const voice = voiced.roast!.voice;
    expect(voice.audioUrl).toBe('/api/voice/abc123');
    expect(voice).toMatchObject({ durationSec: 3.6, script: rant });
    expect(voiceNote).toHaveLength(150 * 96);
  });

  it('keeps the roast on its estimate when text-to-speech fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    fetchMock.mockResolvedValueOnce(new Response('rate limited', { status: 429 }));
    const before = analysis();
    const { analysis: after, voiceNote } = await voiceOver(before);
    expect(after).toEqual(before);
    expect(voiceNote).toBeUndefined();
  });

  it('does nothing without a key, a voice note or a script', async () => {
    vi.stubEnv('OPENAI_API_KEY', '');
    expect((await voiceOver(analysis())).voiceNote).toBeUndefined();
    vi.stubEnv('OPENAI_API_KEY', 'test-key');
    expect((await voiceOver({ ...analysis(), voice: false })).voiceNote).toBeUndefined();
    const noScript = { ...analysis(), roast: toRoast('nochill', { ...raw, script: undefined }) };
    expect((await voiceOver(noScript)).voiceNote).toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
