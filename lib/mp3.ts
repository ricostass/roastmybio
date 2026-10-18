// Just enough MPEG audio parsing to join voice-note clips into one MP3 and
// time them from the audio itself. Each clip comes back from text-to-speech as
// its own file; its frames are copied over, and the tags and the VBR header
// frame (which would describe only the first clip) are left out.

const SAMPLE_RATES: Record<number, number[]> = {
  3: [44100, 48000, 32000], // MPEG 1
  2: [22050, 24000, 16000], // MPEG 2
  0: [11025, 12000, 8000], // MPEG 2.5
};

// kbps by bitrate index, for [MPEG 1, MPEG 2/2.5] × layer.
const BITRATES = {
  1: {
    1: [0, 32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448],
    2: [0, 32, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 384],
    3: [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320],
  },
  2: {
    1: [0, 32, 48, 56, 64, 80, 96, 112, 128, 144, 160, 176, 192, 224, 256],
    2: [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],
    3: [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],
  },
} as const;

interface FrameHeader {
  length: number;
  samples: number;
  sampleRate: number;
}

/** Reads the frame header at `at`, or null if there isn't a valid one there. */
function frameHeader(buf: Uint8Array, at: number): FrameHeader | null {
  if (at + 4 > buf.length || buf[at] !== 0xff || (buf[at + 1] & 0xe0) !== 0xe0) return null;
  const version = (buf[at + 1] >> 3) & 3;
  const layerBits = (buf[at + 1] >> 1) & 3;
  const bitrateIndex = buf[at + 2] >> 4;
  const rateIndex = (buf[at + 2] >> 2) & 3;
  if (version === 1 || layerBits === 0 || bitrateIndex === 0 || bitrateIndex === 15 || rateIndex === 3) return null;

  const layer = (4 - layerBits) as 1 | 2 | 3;
  const mpeg1 = version === 3;
  const bitrate = BITRATES[mpeg1 ? 1 : 2][layer][bitrateIndex] * 1000;
  const sampleRate = SAMPLE_RATES[version][rateIndex];
  const padding = (buf[at + 2] >> 1) & 1;
  const samples = layer === 1 ? 384 : layer === 3 && !mpeg1 ? 576 : 1152;
  const length =
    layer === 1 ? (Math.floor((12 * bitrate) / sampleRate) + padding) * 4 : Math.floor(((samples / 8) * bitrate) / sampleRate) + padding;
  return { length, samples, sampleRate };
}

/** Whether the frame at `at` is a Xing/Info or VBRI header rather than audio. */
function isVbrHeader(buf: Uint8Array, at: number) {
  const mpeg1 = ((buf[at + 1] >> 3) & 3) === 3;
  const mono = buf[at + 3] >> 6 === 3;
  const sideInfo = mpeg1 ? (mono ? 17 : 32) : mono ? 9 : 17;
  const tag = (offset: number) => String.fromCharCode(...buf.subarray(at + offset, at + offset + 4));
  const xing = tag(4 + sideInfo);
  return xing === 'Xing' || xing === 'Info' || tag(36) === 'VBRI';
}

/** Skips a leading ID3v2 tag. */
function audioStart(buf: Uint8Array) {
  if (buf.length < 10 || buf[0] !== 0x49 || buf[1] !== 0x44 || buf[2] !== 0x33) return 0;
  const size = ((buf[6] & 0x7f) << 21) | ((buf[7] & 0x7f) << 14) | ((buf[8] & 0x7f) << 7) | (buf[9] & 0x7f);
  const footer = buf[5] & 0x10 ? 10 : 0;
  return 10 + size + footer;
}

/** The audio frames of one MP3 file, and how long they play for. */
export function mp3Frames(buf: Uint8Array): { frames: Uint8Array[]; durationSec: number } {
  const frames: Uint8Array[] = [];
  let durationSec = 0;
  let at = audioStart(buf);
  while (at < buf.length) {
    const header = frameHeader(buf, at);
    // Anything that isn't a frame (a trailing ID3v1 tag, junk) is skipped a byte at a time.
    if (!header || at + header.length > buf.length) {
      at++;
      continue;
    }
    if (!(frames.length === 0 && isVbrHeader(buf, at))) {
      frames.push(buf.subarray(at, at + header.length));
      durationSec += header.samples / header.sampleRate;
    }
    at += header.length;
  }
  return { frames, durationSec };
}

/** Joins MP3 clips (same encoder settings) into one file, with each clip's length. */
export function joinMp3(clips: Uint8Array[]): { mp3: Uint8Array<ArrayBuffer>; durations: number[] } {
  const parsed = clips.map(mp3Frames);
  const frames = parsed.flatMap((p) => p.frames);
  const mp3 = new Uint8Array(frames.reduce((n, f) => n + f.length, 0));
  let at = 0;
  for (const frame of frames) {
    mp3.set(frame, at);
    at += frame.length;
  }
  return { mp3, durations: parsed.map((p) => p.durationSec) };
}
