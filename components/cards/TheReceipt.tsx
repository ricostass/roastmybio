import { BRAND_HOST } from '@/lib/brand';
import { FORMAT_SIZE } from '@/lib/cards';
import { score } from '@/lib/format';
import type { RoastCard } from '@/lib/types';
import { C, Column, Frame, Verdict, Wordmark, Words, ls, tint, type, type CardFonts } from './kit';

// 1d "The Receipt" — every joke is a line item, the Cringe-o-meter is the
// total, the verdict is printed at the bottom like the thank-you line.
// Story format only.

const ZIGZAG_TEETH = 40;
const ZIGZAG_HEIGHT = 28;

/** Torn bottom edge. Drawn as SVG because Satori can't do calc() in clip-path. */
function Zigzag({ width }: { width: number }) {
  const step = width / ZIGZAG_TEETH;
  const points = [`0,0`, `${width},0`];
  for (let i = ZIGZAG_TEETH; i > 0; i--) {
    points.push(`${i * step - step / 2},${ZIGZAG_HEIGHT}`, `${(i - 1) * step},0`);
  }
  return (
    <svg width={width} height={ZIGZAG_HEIGHT} viewBox={`0 0 ${width} ${ZIGZAG_HEIGHT}`} style={{ display: 'flex' }}>
      <polygon points={points.join(' ')} fill={C.paper} />
    </svg>
  );
}

function Dashed({ margin }: { margin: string }) {
  return <div style={{ display: 'flex', borderTop: `4px dashed ${tint('ink', 0.3)}`, margin }} />;
}

function Row({ label, value, fonts }: { label: string; value: string; fonts: CardFonts }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 30, ...type(fonts.mono, 500, 32, 1.3) }}>
      <span style={{ display: 'flex', flex: 1 }}>{label}</span>
      <span style={{ display: 'flex' }}>{value}</span>
    </div>
  );
}

export function TheReceipt({ card, fonts }: { card: RoastCard; fonts: CardFonts }) {
  const genz = card.heat === 'genz';
  const { width, height } = FORMAT_SIZE['9:16'];
  const paperWidth = width - 220;
  const items = card.receipt ?? [];
  const lineItem = card.line && items.find((item) => item.label.startsWith(card.line!.target));

  return (
    <Frame
      width={width}
      height={height}
      style={{ background: genz ? C.paperGround : C.ink, color: C.ink, padding: '70px 110px 0', fontFamily: fonts.mono }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 40,
          ...type(fonts.mono, 500, 24),
          letterSpacing: ls(0.04, 24),
          color: genz ? tint('ink', 0.6) : tint('cream', 0.7),
        }}
      >
        <span>{BRAND_HOST}</span>
        <span>an AI roasted my dating profile</span>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.paper, padding: '70px 60px 0' }}>
          <Wordmark size={64} fonts={fonts} style={{ justifyContent: 'center' }} />
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginTop: 12,
              ...type(fonts.mono, 500, 28, 1.5),
              color: tint('ink', 0.6),
            }}
          >
            <div style={{ display: 'flex' }}>ROAST RECEIPT</div>
            <div style={{ display: 'flex' }}>
              <span>HEAT:&nbsp;</span>
              <span style={genz ? undefined : { color: C.accent, fontWeight: 700 }}>{genz ? 'GEN Z' : 'NO CHILL · 18+'}</span>
              <span>{`\u00a0· ${card.meta.photos} PHOTOS · ${card.meta.prompts} PROMPTS`}</span>
            </div>
          </div>
          <Dashed margin="44px 0 36px" />

          {card.kind === 'line' && card.line ? (
            <Column>
              <Row label={lineItem?.label ?? card.line.target} value={score(lineItem?.cringe ?? card.cringe ?? 0)} fonts={fonts} />
              <Dashed margin="40px 0 44px" />
              <Words
                text={card.line.joke}
                family={fonts.display}
                face="display800"
                size={72}
                lineHeight={1}
                tracking={-0.035}
                fit={{ width: 740, height: 520 }}
                style={{ justifyContent: 'center' }}
              />
              <Dashed margin="44px 0 32px" />
              <div style={{ display: 'flex', ...type(fonts.mono, 700, 28), letterSpacing: ls(0.06, 28) }}>{"WHAT'S ACTUALLY WRONG"}</div>
              <div style={{ display: 'flex', marginTop: 14, ...type(fonts.mono, 500, 30, 1.4) }}>{card.line.wrong}</div>
            </Column>
          ) : (
            <Column>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
                {items.map((item, i) => (
                  <Row key={i} label={item.label} value={score(item.cringe)} fonts={fonts} />
                ))}
              </div>
              <Dashed margin="40px 0 32px" />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ ...type(fonts.mono, 700, 36), letterSpacing: ls(0.06, 36) }}>TOTAL CRINGE</span>
                <div style={{ display: 'flex', alignItems: 'baseline' }}>
                  <span style={{ ...type(fonts.mono, 700, 120, 1), letterSpacing: ls(-0.05, 120), color: genz ? undefined : C.accent }}>
                    {score(card.cringe ?? 0)}
                  </span>
                  <span style={{ ...type(fonts.mono, 700, 44, 1), color: tint('ink', 0.5) }}>/10</span>
                </div>
              </div>
              <Dashed margin="36px 0 44px" />
              {card.verdict && <Verdict {...card.verdict} family={fonts.display} size={118} lineHeight={0.95} box={{ width: 740, height: 360 }} align="center" />}
            </Column>
          )}

          <div style={{ flex: 1 }} />
          <div
            style={{
              height: 90,
              margin: '0 60px',
              background:
                'repeating-linear-gradient(90deg, #141210 0px, #141210 6px, transparent 6px, transparent 10px, #141210 10px, #141210 12px, transparent 12px, transparent 20px, #141210 20px, #141210 28px, transparent 28px, transparent 32px)',
            }}
          />
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              margin: '20px 0 52px',
              ...type(fonts.mono, 500, 30, 1.5),
              color: tint('ink', 0.65),
            }}
          >
            <div style={{ display: 'flex' }}>GET YOURS AT {BRAND_HOST.toUpperCase()}</div>
            <div style={{ display: 'flex' }}>NO REFUNDS ON FEELINGS</div>
          </div>
        </div>
        <Zigzag width={paperWidth} />
      </div>

      {!genz && (
        <div
          style={{
            display: 'flex',
            position: 'absolute',
            right: 130,
            // Over the line items; on a line card that's the single item, above the joke.
            top: card.kind === 'line' ? 400 : 560,
            transform: 'rotate(-12deg)',
            border: `8px solid ${C.accent}`,
            color: C.accent,
            padding: '14px 26px',
            ...type(fonts.display, 800, 40, 1),
            letterSpacing: ls(0.12, 40),
            opacity: 0.75,
          }}
        >
          VOID IF UNDER 18
        </div>
      )}
    </Frame>
  );
}
