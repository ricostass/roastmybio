import { CARD_FORMATS, type Analysis, type CardFormat, type CardKind, type RoastCard } from './types';

export interface CardRequest {
  kind: CardKind;
  /** Index into roast.lines when kind is 'line'. */
  line?: number;
  format: CardFormat;
}

/** Builds the shared card model from a roast result. Returns null if there's nothing to draw. */
export function buildCard(analysis: Analysis, req: CardRequest): RoastCard | null {
  const roast = analysis.roast;
  if (!roast) return null;
  const base = {
    heat: roast.heat,
    meta: analysis.meta,
    format: req.format,
    cringe: roast.cringe,
    receipt: roast.receipt,
    voice: { elapsedSec: roast.voice.frameSec, durationSec: roast.voice.durationSec },
  };
  if (req.kind === 'verdict') {
    return { ...base, kind: 'verdict', verdict: roast.verdict };
  }
  const index = req.line ?? 0;
  const line = roast.lines[index];
  if (!line) return null;
  // Freeze the frame halfway through the part of the voice note that roasts this line.
  const { segments, durationSec } = roast.voice;
  const at = segments.findIndex((s) => s.label.toUpperCase() === line.target);
  const elapsedSec =
    at === -1 ? roast.voice.frameSec : (segments[at].startSec + (segments[at + 1]?.startSec ?? durationSec)) / 2;
  return { ...base, kind: 'line', line, voice: { elapsedSec, durationSec } };
}

export function parseFormat(value: string | null): CardFormat {
  return CARD_FORMATS.includes(value as CardFormat) ? (value as CardFormat) : '9:16';
}

export const FORMAT_SIZE: Record<CardFormat, { width: number; height: number }> = {
  '9:16': { width: 1080, height: 1920 },
  '4:5': { width: 1080, height: 1350 },
  '1:1': { width: 1080, height: 1080 },
};

export function cardImageUrl(id: string, req: CardRequest & { template?: string }) {
  const q = new URLSearchParams({ kind: req.kind, format: req.format });
  if (req.kind === 'line') q.set('line', String(req.line ?? 0));
  if (req.template) q.set('t', req.template);
  return `/api/card/${encodeURIComponent(id)}?${q}`;
}

/** Splits a joke so its last sentence can carry the accent colour. */
export function splitLastSentence(text: string): [string, string] {
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g);
  if (!sentences || sentences.length < 2) return ['', text];
  const last = sentences[sentences.length - 1];
  return [text.slice(0, text.length - last.length).trim(), last.trim()];
}

/**
 * Which caption word is "being spoken" on a still frame: the second-to-last
 * word of a verdict, or the last word of a line's first sentence.
 */
export function currentCaptionWord(words: string[], kind: CardKind) {
  if (kind === 'verdict') return Math.max(0, words.length - 2);
  const end = words.findIndex((w) => /[.!?]$/.test(w));
  return end === -1 ? 0 : end;
}
