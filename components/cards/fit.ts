import { ADVANCES } from './advances';

// Text fitting for card copy. Roast copy is generated, so its length varies;
// these size it down (never up) so it stays inside the artwork. Widths come
// from the bundled fonts' advance widths, which is close enough to both the
// browser and Satori (it ignores kerning, so a small safety margin is kept).

export type FaceKey = keyof typeof ADVANCES;

const SAFETY = 0.97;
const FALLBACK_EM = 0.58;

const tables = Object.fromEntries(
  Object.entries(ADVANCES).map(([key, { chars, w }]) => [
    key,
    new Map([...chars].map((c, i) => [c, w[i] ?? FALLBACK_EM])),
  ]),
) as Record<FaceKey, Map<string, number>>;

/** Width of `text` in px at `size`, including letter-spacing (em). */
export function measure(text: string, face: FaceKey, size: number, tracking = 0) {
  const table = tables[face];
  let em = 0;
  for (const ch of text) em += (table.get(ch) ?? FALLBACK_EM) + tracking;
  return em * size;
}

/** The gap between word boxes that matches a real space. */
export function wordGap(face: FaceKey, size: number, tracking = 0) {
  return Math.round(((tables[face].get(' ') ?? 0.25) + tracking) * size);
}

/** Largest size ≤ `base` at which every line fits on one line within `maxWidth`. */
export function fitLines(lines: string[], face: FaceKey, base: number, maxWidth: number, tracking = 0) {
  const widest = Math.max(...lines.map((l) => measure(l, face, base, tracking)));
  if (widest <= maxWidth * SAFETY) return base;
  return Math.floor((base * maxWidth * SAFETY) / widest);
}

/** Number of lines `text` wraps to, wrapping on spaces like the Words component. */
export function wrapCount(text: string, face: FaceKey, size: number, maxWidth: number, tracking = 0) {
  const gap = wordGap(face, size, tracking);
  let lines = 1;
  let x = 0;
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const w = measure(word, face, size, tracking);
    if (x > 0 && x + gap + w > maxWidth * SAFETY) {
      lines += 1;
      x = w;
    } else {
      x += (x > 0 ? gap : 0) + w;
    }
  }
  return lines;
}

/** Largest size ≤ `base` at which the wrapped paragraphs fit in the box. */
export function fitWrapped(
  paragraphs: string[],
  face: FaceKey,
  base: number,
  box: { width: number; height: number },
  lineHeight: number,
  tracking = 0,
) {
  let size = base;
  const height = (px: number) =>
    paragraphs.reduce((n, p) => n + wrapCount(p, face, px, box.width, tracking), 0) * px * lineHeight;
  while (size > 24 && height(size) > box.height) {
    size = Math.floor(size * 0.95);
  }
  return size;
}
