import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { sampleAnalysis } from './analyze';
import { toRoast, type RawRoast } from './scoring';
import type { Analysis } from './types';
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
  script: { lines: ['Three photos, zero sentences. Your second photo is a fish.', 'And your bio is empty.'], fixes: 'Show people. Write a bio.' },
};

function analysis(): Analysis {
  return { ...sampleAnalysis('abc123', { mode: 'roast', app: 'Hinge', looking: 'A relationship', heat: 'nochill', voice: true }), roast: toRoast('nochill', raw) };
}

// Each part comes back as a clip whose length depends on what was said.
const FRAMES: Record<string, number> = { [raw.script!.lines[0]]: 100, [raw.script!.lines[1]]: 50, [raw.script!.fixes]: 75 };
const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
  const body = JSON.parse(String(init.body)) as { input: string };
  return new Response(clip(FRAMES[body.input]), { headers: { 'Content-Type': 'audio/mpeg' } });
});

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
  it('reads each part of the script aloud in the heat’s voice', async () => {
    await voiceOver(analysis());
    const bodies = fetchMock.mock.calls.map(([, init]) => JSON.parse(String(init.body)));
    expect(bodies.map((b) => b.input)).toEqual([...raw.script!.lines, raw.script!.fixes]);
    expect(new Set(bodies.map((b) => b.voice))).toEqual(new Set(['onyx']));
    expect(bodies.at(-1).instructions).not.toBe(bodies[0].instructions);
    expect(fetchMock.mock.calls[0][1].headers).toMatchObject({ Authorization: 'Bearer test-key' });
  });

  it('times the note from the audio and serves it from the site', async () => {
    const { analysis: voiced, voiceNote } = await voiceOver(analysis());
    const voice = voiced.roast!.voice;
    expect(voice.audioUrl).toBe('/api/voice/abc123');
    expect(voice.durationSec).toBe(5.4);
    expect(voice.segments.map((s) => [s.label, s.startSec])).toEqual([
      ['Photo 2', 0],
      ['Bio', 2.4],
      ['The real fixes', 3.6],
    ]);
    expect(voiceNote).toHaveLength(225 * 96);
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
