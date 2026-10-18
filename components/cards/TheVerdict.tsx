import { BRAND_HOST } from '@/lib/brand';
import { FORMAT_SIZE } from '@/lib/cards';
import { clock, meterBlocks, score, waveform } from '@/lib/format';
import type { RoastCard } from '@/lib/types';
import {
  C,
  Column,
  CtaPill,
  EasyBadge,
  Frame,
  HeatBadge,
  Middle,
  NoChillBadge,
  Verdict,
  Waveform,
  Wordmark,
  Words,
  heatColors,
  ls,
  type,
  type CardFonts,
} from './kit';

// 1a "The Verdict" — editorial type; cream ↔ black flips with heat.
// 9:16 is the designed hero; 4:5 and 1:1 are 1e; the video frame is 1f.

function Label({ children, fonts, color, size = 28 }: { children: string; fonts: CardFonts; color: string; size?: number }) {
  return <div style={{ display: 'flex', ...type(fonts.mono, 500, size), letterSpacing: ls(0.08, size), color }}>{children}</div>;
}

function Tagline({ card, fonts, align = 'left', size = 30 }: { card: RoastCard; fonts: CardFonts; align?: 'left' | 'right'; size?: number }) {
  const { muted } = heatColors(card.heat);
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: align === 'right' ? 'flex-end' : 'flex-start',
        ...type(fonts.body, 500, size, 1.3),
        color: muted(0.75),
      }}
    >
      <div style={{ display: 'flex' }}>An AI roasted my dating profile.</div>
      <div style={{ display: 'flex', ...type(fonts.mono, 500, size - 2, 1.3) }}>{BRAND_HOST}</div>
    </div>
  );
}

function Meter({ card }: { card: RoastCard }) {
  const { fg } = heatColors(card.heat);
  const filled = meterBlocks(card.cringe ?? 0);
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', height: 120 }}>
      {Array.from({ length: 8 }, (_, i) => (
        <div
          key={i}
          style={{
            width: 34,
            height: `${30 + i * 10}%`,
            boxSizing: 'border-box',
            ...(i < filled ? { background: C.accent } : { border: `4px solid ${fg}` }),
          }}
        />
      ))}
    </div>
  );
}

function Score({ card, fonts, size, slash }: { card: RoastCard; fonts: CardFonts; size: number; slash: number }) {
  const { muted } = heatColors(card.heat);
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
      <span
        style={{
          ...type(fonts.mono, 700, size, 1),
          letterSpacing: ls(-0.06, size),
          color: card.heat === 'nochill' ? C.accent : undefined,
        }}
      >
        {score(card.cringe ?? 0)}
      </span>
      <span style={{ ...type(fonts.mono, 500, slash), color: muted(0.5) }}>/10</span>
    </div>
  );
}

function TargetTag({ target, fonts, size = 30 }: { target: string; fonts: CardFonts; size?: number }) {
  return (
    <div
      style={{
        display: 'flex',
        alignSelf: 'flex-start',
        background: C.accent,
        color: C.ink,
        padding: `${Math.round(size * 0.47)}px ${Math.round(size * 0.87)}px`,
        ...type(fonts.mono, 700, size),
        letterSpacing: ls(0.08, size),
      }}
    >
      {target}
    </div>
  );
}

function Quote({ joke, fonts, size, box, lineHeight = 1.02 }: {
  joke: string;
  fonts: CardFonts;
  size: number;
  box: { width: number; height: number };
  lineHeight?: number;
}) {
  return (
    <Words
      text={joke}
      family={fonts.display}
      face="display600"
      size={size}
      lineHeight={lineHeight}
      tracking={-0.035}
      fit={box}
      open={<span style={{ color: C.accent }}>“</span>}
      close={<span style={{ color: C.accent }}>”</span>}
    />
  );
}

function Wrong({ card, fonts, labelSize = 28, size = 40, gap = 16 }: { card: RoastCard; fonts: CardFonts; labelSize?: number; size?: number; gap?: number }) {
  const { muted } = heatColors(card.heat);
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <Label fonts={fonts} color={muted(0.6)} size={labelSize}>
        {"WHAT'S ACTUALLY WRONG"}
      </Label>
      <div style={{ display: 'flex', marginTop: gap, ...type(fonts.body, 500, size, 1.25) }}>{card.line?.wrong}</div>
    </div>
  );
}

function Story({ card, fonts }: { card: RoastCard; fonts: CardFonts }) {
  const { ground, fg, muted } = heatColors(card.heat);
  const { width, height } = FORMAT_SIZE['9:16'];
  return (
    <Frame width={width} height={height} style={{ background: ground, color: fg, padding: '88px 84px', fontFamily: fonts.body }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Wordmark size={40} fonts={fonts} />
        <HeatBadge heat={card.heat} fonts={fonts} />
      </div>
      {card.kind === 'verdict' && card.verdict ? (
        <Column>
          <div style={{ display: 'flex', marginTop: 120 }}>
            <Label fonts={fonts} color={muted(0.6)}>{`VERDICT · ${card.meta.photos} PHOTOS · ${card.meta.prompts} PROMPTS`}</Label>
          </div>
          <Middle>
            <Verdict {...card.verdict} family={fonts.display} size={164} lineHeight={0.92} box={{ width: 912, height: 800 }} />
          </Middle>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: `4px solid ${fg}`, paddingTop: 48 }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <Label fonts={fonts} color={muted(0.6)}>CRINGE-O-METER</Label>
              <div style={{ display: 'flex', marginTop: 8 }}>
                <Score card={card} fonts={fonts} size={200} slash={48} />
              </div>
            </div>
            <Meter card={card} />
          </div>
        </Column>
      ) : (
        <Column>
          <div style={{ display: 'flex', marginTop: 120 }}>
            <TargetTag target={card.line?.target ?? ''} fonts={fonts} />
          </div>
          <Middle>
            <Quote joke={card.line?.joke ?? ''} fonts={fonts} size={110} box={{ width: 912, height: 900 }} />
          </Middle>
          <div style={{ display: 'flex', flexDirection: 'column', borderTop: `4px solid ${fg}`, paddingTop: 44 }}>
            <Wrong card={card} fonts={fonts} />
          </div>
        </Column>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 72 }}>
        <Tagline card={card} fonts={fonts} />
        <CtaPill heat={card.heat} fonts={fonts} />
      </div>
    </Frame>
  );
}

function Portrait({ card, fonts }: { card: RoastCard; fonts: CardFonts }) {
  const { ground, fg, muted } = heatColors(card.heat);
  const { width, height } = FORMAT_SIZE['4:5'];
  return (
    <Frame width={width} height={height} style={{ background: ground, color: fg, padding: '80px 84px', fontFamily: fonts.body }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Wordmark size={40} fonts={fonts} />
        {card.heat === 'easy' ? <EasyBadge fonts={fonts} size={26} /> : <NoChillBadge fonts={fonts} size={26} lower="18+" />}
      </div>
      {card.kind === 'verdict' && card.verdict ? (
        <Column>
          <Middle>
            <Verdict {...card.verdict} family={fonts.display} size={140} lineHeight={0.92} box={{ width: 912, height: 640 }} />
          </Middle>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: `4px solid ${fg}`, paddingTop: 40 }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <Label fonts={fonts} color={muted(0.6)} size={26}>CRINGE-O-METER</Label>
              <Score card={card} fonts={fonts} size={140} slash={44} />
            </div>
            <Tagline card={card} fonts={fonts} align="right" size={28} />
          </div>
        </Column>
      ) : (
        <Column>
          <div style={{ display: 'flex', marginTop: 72 }}>
            <TargetTag target={card.line?.target ?? ''} fonts={fonts} size={28} />
          </div>
          <Middle>
            <Quote joke={card.line?.joke ?? ''} fonts={fonts} size={84} box={{ width: 912, height: 620 }} />
          </Middle>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 40, borderTop: `4px solid ${fg}`, paddingTop: 36 }}>
            <div style={{ display: 'flex', flex: 1 }}>
              <Wrong card={card} fonts={fonts} labelSize={24} size={32} gap={12} />
            </div>
            <Tagline card={card} fonts={fonts} align="right" size={26} />
          </div>
        </Column>
      )}
    </Frame>
  );
}

function Square({ card, fonts }: { card: RoastCard; fonts: CardFonts }) {
  const { ground, fg, muted } = heatColors(card.heat);
  const { width, height } = FORMAT_SIZE['1:1'];
  return (
    <Frame width={width} height={height} style={{ background: ground, color: fg, padding: '72px 80px', fontFamily: fonts.body }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Wordmark size={40} fonts={fonts} />
        {card.heat === 'easy' ? <EasyBadge fonts={fonts} size={26} /> : <NoChillBadge fonts={fonts} size={26} stacked={false} />}
      </div>
      {card.kind === 'verdict' && card.verdict ? (
        <Middle>
          <Verdict {...card.verdict} family={fonts.display} size={128} lineHeight={0.92} box={{ width: 920, height: 560 }} />
        </Middle>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 36 }}>
          <TargetTag target={card.line?.target ?? ''} fonts={fonts} size={26} />
          <Quote joke={card.line?.joke ?? ''} fonts={fonts} size={70} lineHeight={1.04} box={{ width: 920, height: 480 }} />
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: `4px solid ${fg}`, paddingTop: 32 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 18 }}>
          <span
            style={{
              ...type(fonts.mono, 700, 96, 1),
              letterSpacing: ls(-0.06, 96),
              color: card.heat === 'nochill' ? C.accent : undefined,
            }}
          >
            {score(card.cringe ?? 0)}
          </span>
          <span style={{ ...type(fonts.mono, 500, 26), letterSpacing: ls(0.08, 26), color: muted(0.6) }}>/10 CRINGE</span>
        </div>
        <div style={{ display: 'flex', ...type(fonts.mono, 500, 26), color: muted(0.75) }}>{BRAND_HOST}</div>
      </div>
    </Frame>
  );
}

/** 1f — one frame of the video version: verdict stays put, captions run in the lower third. */
export function VerdictVideoFrame({ card, fonts, caption }: {
  card: RoastCard;
  fonts: CardFonts;
  /** Caption words on screen and which one is being spoken. */
  caption: { words: string[]; current: number };
}) {
  const { ground, fg, muted } = heatColors(card.heat);
  const { width, height } = FORMAT_SIZE['9:16'];
  const elapsed = card.voice?.elapsedSec ?? 0;
  const duration = card.voice?.durationSec ?? 1;
  const progress = elapsed / duration;
  return (
    <Frame width={width} height={height} style={{ background: ground, color: fg, padding: '88px 84px 0', fontFamily: fonts.body }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Wordmark size={40} fonts={fonts} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, ...type(fonts.mono, 500, 28), letterSpacing: ls(0.06, 28) }}>
          <div style={{ width: 18, height: 18, borderRadius: 999, background: C.accent }} />
          {`${clock(elapsed)} / ${clock(duration)}`}
        </div>
      </div>
      <div style={{ display: 'flex', marginTop: 120 }}>
        <Label fonts={fonts} color={muted(0.6)}>{card.heat === 'easy' ? 'VERDICT · GO EASY' : 'VERDICT · NO CHILL · 18+'}</Label>
      </div>
      {card.verdict && (
        <div style={{ display: 'flex', marginTop: 40 }}>
          <Verdict {...card.verdict} family={fonts.display} size={150} lineHeight={0.92} box={{ width: 912, height: 420 }} />
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 60 }}>
        <Waveform heights={waveform(48, 4)} played={progress} height={120} gap={6} radius={6} rest={muted(card.heat === 'easy' ? 0.22 : 0.28)} />
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', flexWrap: 'wrap', rowGap: 12, columnGap: 10, marginBottom: 60 }}>
        {caption.words.map((w, i) => (
          <span
            key={i}
            style={{
              display: 'flex',
              ...type(fonts.body, 700, 60, 1),
              background: i === caption.current ? C.accent : fg,
              color: i === caption.current ? C.ink : ground,
              padding: '12px 22px 16px',
              borderRadius: 14,
              opacity: i > caption.current ? 0.35 : 1,
            }}
          >
            {w}
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 70 }}>
        <Tagline card={card} fonts={fonts} />
        <CtaPill heat={card.heat} fonts={fonts} />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 14, display: 'flex', background: muted(0.18) }}>
        <div style={{ width: `${progress * 100}%`, height: '100%', background: C.accent }} />
      </div>
    </Frame>
  );
}

export function TheVerdict({ card, fonts }: { card: RoastCard; fonts: CardFonts }) {
  if (card.format === '4:5') return <Portrait card={card} fonts={fonts} />;
  if (card.format === '1:1') return <Square card={card} fonts={fonts} />;
  return <Story card={card} fonts={fonts} />;
}
