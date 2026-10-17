/** 0:31 style timestamp. */
export function clock(totalSec: number) {
  const s = Math.max(0, Math.floor(totalSec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Scores always show one decimal: 7.4, 6.0. */
export function score(n: number) {
  return n.toFixed(1);
}

/** Deterministic waveform heights (percent) — same shape as the design mocks. */
export function waveform(count: number, seed: number, min = 18): number[] {
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    const v = Math.abs(Math.sin(i * 1.7 + seed) * 0.6 + Math.sin(i * 0.43 + seed * 2) * 0.4);
    out.push(Math.round(min + v * (100 - min)));
  }
  return out;
}

/** How many of the 8 Cringe-o-meter blocks are filled for a 0–10 score. */
export function meterBlocks(cringe: number, blocks = 8) {
  return Math.min(blocks, Math.max(0, Math.round((cringe / 10) * blocks)));
}

/** Lower-cases the first letter, for "What's actually wrong: four of six…". */
export function lowerFirst(s: string) {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

export function metaLine(parts: (string | false | undefined)[]) {
  return parts.filter(Boolean).join(' · ');
}
