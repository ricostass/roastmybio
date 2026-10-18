import { describe, expect, it } from 'vitest';
import { joinMp3, mp3Frames } from './mp3';

// MPEG 2 Layer III, 32 kbps, 24 kHz, mono: 96-byte frames of 576 samples (24 ms).
const HEADER = [0xff, 0xf3, 0x44, 0xc0];
const FRAME_SEC = 576 / 24000;

function frame(fill = 0, tag?: string) {
  const f = new Uint8Array(96).fill(fill);
  f.set(HEADER);
  // Xing/Info sits after the side info: 9 bytes for MPEG 2 mono.
  if (tag) f.set([...tag].map((c) => c.charCodeAt(0)), 4 + 9);
  return f;
}

function clip(frames: number, { id3 = false, xing = false, fill = 0 } = {}) {
  const parts: number[] = [];
  if (id3) parts.push(0x49, 0x44, 0x33, 4, 0, 0, 0, 0, 0, 5, 1, 2, 3, 4, 5);
  if (xing) parts.push(...frame(0, 'Info'));
  for (let i = 0; i < frames; i++) parts.push(...frame(fill));
  return new Uint8Array(parts);
}

describe('mp3Frames', () => {
  it('counts audio frames, skipping the ID3 tag and the VBR header frame', () => {
    const { frames, durationSec } = mp3Frames(clip(10, { id3: true, xing: true }));
    expect(frames).toHaveLength(10);
    expect(durationSec).toBeCloseTo(10 * FRAME_SEC);
  });

  it('ignores bytes that are not frames', () => {
    const withJunk = new Uint8Array([1, 2, 3, ...clip(3), ...new TextEncoder().encode('TAG trailing')]);
    expect(mp3Frames(withJunk).frames).toHaveLength(3);
  });
});

describe('joinMp3', () => {
  it('joins the clips and times each one', () => {
    const { mp3, durations } = joinMp3([clip(5, { xing: true, fill: 1 }), clip(8, { id3: true, xing: true, fill: 2 })]);
    expect(durations[0]).toBeCloseTo(5 * FRAME_SEC);
    expect(durations[1]).toBeCloseTo(8 * FRAME_SEC);
    expect(mp3.length).toBe(13 * 96);
    // Only audio frames, in order: no tags or VBR header from the second clip.
    expect(mp3Frames(mp3).frames.map((f) => f[50])).toEqual([...Array(5).fill(1), ...Array(8).fill(2)]);
  });
});
