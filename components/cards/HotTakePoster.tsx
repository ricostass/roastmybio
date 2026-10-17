import { FORMAT_SIZE, splitLastSentence } from '@/lib/cards';
import { score } from '@/lib/format';
import type { RoastCard } from '@/lib/types';
import { C, Frame, Middle, Verdict, Wordmark, Words, ls, tint, type, type CardFonts } from './kit';

// 1b "Hot Take Poster" — all-caps, stickers, a thermometer. Go easy is cream
// with orange ink; No chill is a full orange ground. Story format only.

function palette(card: RoastCard) {
  return card.heat === 'easy'
    ? { ground: C.cream, punch: C.accent, dot: C.accent, fill: C.accent, label: tint('ink', 0.6), sticker: { bg: C.ink, fg: C.cream } }
    : { ground: C.accent, punch: C.cream, dot: C.cream, fill: C.ink, label: tint('ink', 0.7), sticker: { bg: C.cream, fg: C.ink } };
}

function Badge({ card, fonts }: { card: RoastCard; fonts: CardFonts }) {
  if (card.heat === 'easy') {
    return (
      <div
        style={{
          display: 'flex',
          transform: 'rotate(4deg)',
          border: `5px solid ${C.accent}`,
          color: C.accent,
          borderRadius: 999,
          padding: '16px 34px',
          ...type(fonts.display, 800, 34),
          letterSpacing: ls(0.06, 34),
        }}
      >
        GO EASY
      </div>
    );
  }
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        transform: 'rotate(4deg)',
        background: C.ink,
        color: C.cream,
        padding: '18px 34px',
        ...type(fonts.display, 800, 34, 1.1),
        letterSpacing: ls(0.06, 34),
      }}
    >
      <div style={{ display: 'flex' }}>NO CHILL</div>
      <div style={{ display: 'flex', ...type(fonts.mono, 700, 24, 1.1), letterSpacing: ls(0.2, 24) }}>18+ ONLY</div>
    </div>
  );
}

function Strip({ fonts, bg, fg }: { fonts: CardFonts; bg: string; fg: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        margin: '0 -72px',
        background: bg,
        color: fg,
        padding: '34px 0',
        ...type(fonts.display, 800, 34),
        letterSpacing: ls(0.02, 34),
        textTransform: 'uppercase',
      }}
    >
      profilecheck.app · An AI roasted my dating profile
    </div>
  );
}

/** Vertical label: Satori has no writing-mode, so the text is rotated in a fixed box. */
function VerticalLabel({ text, fonts, color }: { text: string; fonts: CardFonts; color: string }) {
  const length = 300;
  return (
    <div style={{ display: 'flex', width: 40, height: length, position: 'relative' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          position: 'absolute',
          width: length,
          height: 40,
          left: (40 - length) / 2,
          top: (length - 40) / 2,
          transform: 'rotate(-90deg)',
          ...type(fonts.mono, 700, 28, 40 / 28),
          letterSpacing: ls(0.12, 28),
          color,
        }}
      >
        {text}
      </div>
    </div>
  );
}

function Thermometer({ card, fonts }: { card: RoastCard; fonts: CardFonts }) {
  const p = palette(card);
  const cringe = card.cringe ?? 0;
  return (
    <div style={{ width: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
      <VerticalLabel text="CRINGE-O-METER" fonts={fonts} color={p.label} />
      <div
        style={{
          flex: 1,
          width: 72,
          border: `6px solid ${C.ink}`,
          borderRadius: 999,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          overflow: 'hidden',
          background: p.ground,
        }}
      >
        <div style={{ height: `${cringe * 10}%`, background: p.fill }} />
      </div>
      <div
        style={{
          display: 'flex',
          background: p.sticker.bg,
          color: p.sticker.fg,
          padding: '14px 20px',
          transform: 'rotate(-6deg)',
          ...type(fonts.mono, 700, 44),
          letterSpacing: ls(-0.04, 44),
        }}
      >
        {score(cringe)}
      </div>
    </div>
  );
}

export function HotTakePoster({ card, fonts }: { card: RoastCard; fonts: CardFonts }) {
  const p = palette(card);
  const { width, height } = FORMAT_SIZE['9:16'];
  const header = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <Wordmark size={40} fonts={fonts} dot={p.dot} />
      <Badge card={card} fonts={fonts} />
    </div>
  );

  if (card.kind === 'line' && card.line) {
    const line = card.line;
    const [, last] = splitLastSentence(line.joke);
    const words = line.joke.split(/\s+/).filter(Boolean);
    const accentFrom = words.length - last.split(/\s+/).filter(Boolean).length;
    const tag = line.quote ? `${line.target} · “${line.quote.toUpperCase()}”` : line.target;
    return (
      <Frame width={width} height={height} style={{ background: p.ground, color: C.ink, padding: '80px 72px 0', fontFamily: fonts.body }}>
        {header}
        <div
          style={{
            display: 'flex',
            marginTop: 90,
            transform: 'rotate(-3deg)',
            alignSelf: 'flex-start',
            background: card.heat === 'easy' ? C.ink : C.cream,
            color: card.heat === 'easy' ? C.cream : C.ink,
            padding: '16px 30px',
            ...type(fonts.mono, 700, 34),
            letterSpacing: ls(0.1, 34),
          }}
        >
          {tag}
        </div>
        <Middle>
          <Words
            text={line.joke}
            family={fonts.display}
            face="display800"
            size={128}
            lineHeight={0.9}
            tracking={-0.045}
            fit={{ width: 936, height: 1050 }}
            accentFrom={accentFrom}
            accent={p.punch}
            uppercase
          />
        </Middle>
        <div style={{ display: 'flex', flexDirection: 'column', margin: '0 -72px', background: C.ink, color: C.cream, padding: '44px 72px' }}>
          <div style={{ display: 'flex', ...type(fonts.mono, 700, 26), letterSpacing: ls(0.12, 26), color: C.accent }}>
            {"WHAT'S ACTUALLY WRONG"}
          </div>
          <div style={{ display: 'flex', marginTop: 14, ...type(fonts.body, 500, 38, 1.25) }}>{line.wrong}</div>
        </div>
        {card.heat === 'easy' ? <Strip fonts={fonts} bg={C.accent} fg={C.ink} /> : <Strip fonts={fonts} bg={C.cream} fg={C.ink} />}
      </Frame>
    );
  }

  return (
    <Frame width={width} height={height} style={{ background: p.ground, color: C.ink, padding: '80px 72px 0', fontFamily: fonts.body }}>
      {header}
      <div style={{ display: 'flex', flex: 1, gap: 48, marginTop: 100 }}>
        <div style={{ display: 'flex', flex: 1 }}>
          {card.verdict && (
            <Verdict
              {...card.verdict}
              family={fonts.display}
              size={176}
              lineHeight={0.86}
              tracking={-0.05}
              box={{ width: 768, height: 1150 }}
              accent={p.punch}
              uppercase
              wrap
            />
          )}
        </div>
        <Thermometer card={card} fonts={fonts} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 60 }}>
        <Strip fonts={fonts} bg={C.ink} fg={C.cream} />
      </div>
    </Frame>
  );
}
