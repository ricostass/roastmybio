import type { CSSProperties, ReactNode } from 'react';
import type { Heat } from '@/lib/types';
import { fitLines, fitWrapped, wordGap, type FaceKey } from './fit';

// Building blocks shared by every card template.
//
// Card templates render in two places: in the browser (previews) and in Satori
// (PNG export via next/og). Satori only understands a subset of CSS, so card
// markup follows its rules: every element with more than one child is
// `display: flex`, text that mixes colours is split into word boxes, and sizes
// are plain px numbers. Don't use CSS variables, grid, calc(), <br> or
// fragments here (Satori lays a fragment's children out as a row).

export interface CardFonts {
  display: string;
  body: string;
  mono: string;
}

/** Font family names registered with Satori (see lib/card-fonts.ts). */
export const SATORI_FONTS: CardFonts = {
  display: 'Bricolage Grotesque',
  body: 'Instrument Sans',
  mono: 'JetBrains Mono',
};

/** next/font CSS variables set on <html> (see app/layout.tsx). */
export const WEB_FONTS: CardFonts = {
  display: 'var(--font-display), sans-serif',
  body: 'var(--font-body), sans-serif',
  mono: 'var(--font-mono), monospace',
};

export const C = {
  cream: '#F6F1EA',
  ink: '#141210',
  accent: '#FF5A1F',
  paper: '#FBF8F2',
  paperGround: '#E7E0D4',
} as const;

/** rgba() of ink or cream at an opacity. */
export function tint(color: 'ink' | 'cream', alpha: number) {
  return color === 'ink' ? `rgba(20,18,16,${alpha})` : `rgba(246,241,234,${alpha})`;
}

/** Letter-spacing in px from an em value, since Satori wants absolute units. */
export function ls(em: number, size: number) {
  return Math.round(em * size * 100) / 100;
}

/** Font properties as separate keys — Satori doesn't take the `font` shorthand. */
export function type(family: string, weight: number, size: number, lineHeight?: number): CSSProperties {
  return { fontFamily: family, fontWeight: weight as CSSProperties['fontWeight'], fontSize: size, lineHeight };
}

/** Ground/ink pair for the two heat levels (cream ↔ black). */
export function heatColors(heat: Heat) {
  return heat === 'easy'
    ? { ground: C.cream, fg: C.ink, muted: (a: number) => tint('ink', a) }
    : { ground: C.ink, fg: C.cream, muted: (a: number) => tint('cream', a) };
}

export function Wordmark({ size, color, dot = C.accent, fonts, style }: {
  size: number;
  color?: string;
  dot?: string;
  fonts: CardFonts;
  style?: CSSProperties;
}) {
  return (
    <div style={{ display: 'flex', ...type(fonts.display, 800, size), letterSpacing: ls(-0.02, size), color, ...style }}>
      <span>ProfileCheck</span>
      <span style={{ color: dot }}>.</span>
    </div>
  );
}

/** "GO EASY" outline pill. */
export function EasyBadge({ fonts, size = 28 }: { fonts: CardFonts; size?: number }) {
  return (
    <div
      style={{
        display: 'flex',
        border: `4px solid ${C.ink}`,
        borderRadius: 999,
        padding: `${Math.round(size / 2)}px ${Math.round(size * 1.07)}px`,
        ...type(fonts.mono, 500, size),
        letterSpacing: ls(0.06, size),
        color: C.ink,
      }}
    >
      GO EASY
    </div>
  );
}

/**
 * The No chill advisory block — worn as a badge of honour. `stacked` is the
 * two-row block; otherwise a single row ("NO CHILL · 18+").
 */
export function NoChillBadge({ fonts, size = 28, lower = '18+ · UNFILTERED', stacked = true }: {
  fonts: CardFonts;
  size?: number;
  lower?: string;
  stacked?: boolean;
}) {
  const font = type(fonts.display, 800, size, 1);
  if (!stacked) {
    return (
      <div
        style={{
          display: 'flex',
          border: `5px solid ${C.cream}`,
          padding: `12px ${size - 2}px`,
          background: C.cream,
          color: C.ink,
          ...font,
          letterSpacing: ls(0.1, size),
        }}
      >
        NO CHILL · 18+
      </div>
    );
  }
  const padX = size === 28 ? 28 : 24;
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        border: `5px solid ${C.cream}`,
        ...font,
        letterSpacing: ls(0.1, size),
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'center', padding: `${size / 2}px ${padX}px ${size / 2 - 4}px`, background: C.cream, color: C.ink }}>
        NO CHILL
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', padding: `${size / 2 - 2}px ${padX}px`, background: C.ink, color: C.cream }}>
        {lower}
      </div>
    </div>
  );
}

export function HeatBadge({ heat, fonts }: { heat: Heat; fonts: CardFonts }) {
  return heat === 'easy' ? <EasyBadge fonts={fonts} /> : <NoChillBadge fonts={fonts} />;
}

const FACE_WEIGHT: Record<FaceKey, number> = { display800: 800, display600: 600, body700: 700, mono: 700 };

/**
 * Text that wraps word by word. Satori can't flow mixed-colour inline text,
 * so each word is its own box; `accentFrom` colours every word from that index.
 * Pass `fit` to shrink the size until the text fits that box.
 */
export function Words({ text, family, face, size, lineHeight, tracking = 0, fit, accentFrom, accent = C.accent, open, close, uppercase, style }: {
  text: string;
  family: string;
  face: FaceKey;
  size: number;
  lineHeight: number;
  /** Letter-spacing in em. */
  tracking?: number;
  fit?: { width: number; height: number };
  accentFrom?: number;
  accent?: string;
  /** Glyphs hung on the first / last word, e.g. accent quote marks. */
  open?: ReactNode;
  close?: ReactNode;
  uppercase?: boolean;
  style?: CSSProperties;
}) {
  const shown = uppercase ? text.toUpperCase() : text;
  const px = fit ? fitWrapped([shown], face, size, fit, lineHeight, tracking) : size;
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        columnGap: wordGap(face, px, tracking),
        ...type(family, FACE_WEIGHT[face], px, lineHeight),
        letterSpacing: ls(tracking, px),
        ...(uppercase && { textTransform: 'uppercase' }),
        ...style,
      }}
    >
      {words.map((w, i) => (
        <span key={i} style={{ display: 'flex', ...(accentFrom !== undefined && i >= accentFrom && { color: accent }) }}>
          {i === 0 && open}
          {w}
          {i === words.length - 1 && close}
        </span>
      ))}
    </div>
  );
}

/**
 * Two-line verdict: setup in ink, punchline in accent. Each line stays on one
 * line, shrinking to fit `box.width`; if that would make it much smaller than
 * designed (long generated copy), it wraps inside `box` instead. `wrap` always
 * wraps (the poster's stacked look).
 */
export function Verdict({ setup, punchline, family, size, lineHeight, box, tracking = -0.045, accent = C.accent, align, uppercase, wrap }: {
  setup: string;
  punchline: string;
  family: string;
  size: number;
  lineHeight: number;
  box: { width: number; height: number };
  tracking?: number;
  accent?: string;
  align?: 'center';
  uppercase?: boolean;
  wrap?: boolean;
}) {
  const lines = [setup, punchline].map((l) => (uppercase ? l.toUpperCase() : l));
  const oneLine = fitLines(lines, 'display800', size, box.width, tracking);
  const px =
    wrap || oneLine < size * 0.8 ? fitWrapped(lines, 'display800', size, box, lineHeight, tracking) : oneLine;
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: align === 'center' ? 'center' : 'flex-start',
        ...(align === 'center' && { textAlign: 'center' }),
        ...(uppercase && { textTransform: 'uppercase' }),
        ...type(family, 800, px, lineHeight),
        letterSpacing: ls(tracking, px),
      }}
    >
      <div style={{ display: 'flex' }}>{setup}</div>
      <div style={{ display: 'flex', color: accent }}>{punchline}</div>
    </div>
  );
}

export function Waveform({ heights, played, height, gap, radius, rest }: {
  heights: number[];
  /** 0–1. */
  played: number;
  height: number;
  gap: number;
  radius: number;
  rest: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap, height }}>
      {heights.map((h, i) => (
        <div
          key={i}
          style={{ flex: 1, height: `${h}%`, borderRadius: radius, background: i / heights.length < played ? C.accent : rest }}
        />
      ))}
    </div>
  );
}

export function CtaPill({ heat, fonts }: { heat: Heat; fonts: CardFonts }) {
  return (
    <div
      style={{
        display: 'flex',
        background: heat === 'easy' ? C.ink : C.accent,
        color: heat === 'easy' ? C.cream : C.ink,
        borderRadius: 999,
        padding: '26px 44px',
        ...type(fonts.body, 700, 32),
      }}
    >
      Roast mine →
    </div>
  );
}

/** A vertical group that fills the remaining height — use instead of a fragment. */
export function Column({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={{ display: 'flex', flexDirection: 'column', flex: 1, ...style }}>{children}</div>;
}

/** Fills the remaining height and centres its content vertically, full width. */
export function Middle({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, ...style }}>{children}</div>
  );
}

export function Frame({ width, height, style, children }: {
  width: number;
  height: number;
  style: CSSProperties;
  children: ReactNode;
}) {
  return (
    <div style={{ width, height, display: 'flex', flexDirection: 'column', boxSizing: 'border-box', position: 'relative', ...style }}>
      {children}
    </div>
  );
}
