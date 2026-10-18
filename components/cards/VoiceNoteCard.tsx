import { BRAND_HOST } from '@/lib/brand';
import { FORMAT_SIZE, currentCaptionWord } from '@/lib/cards';
import { clock, score, waveform } from '@/lib/format';
import type { RoastCard } from '@/lib/types';
import { C, Frame, HeatBadge, Middle, Waveform, Wordmark, ls, tint, type, type CardFonts } from './kit';

// 1c "The Voice Note" — the still is a frame of the audio: waveform plus
// caption chips with the spoken word lit. Doubles as the video template.
// Story format only.

function Captions({ words, current, card, fonts, size }: {
  words: string[];
  current: number;
  card: RoastCard;
  fonts: CardFonts;
  size: number;
}) {
  const easy = card.heat === 'easy';
  const big = size >= 100;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', rowGap: big ? 14 : 12, columnGap: big ? 12 : 10 }}>
      {words.map((w, i) => (
        <span
          key={i}
          style={{
            display: 'flex',
            ...type(fonts.display, 800, size, 1),
            letterSpacing: ls(big ? -0.04 : -0.035, size),
            background: i === current ? C.accent : easy ? C.ink : C.cream,
            color: i === current ? C.ink : easy ? C.cream : C.ink,
            padding: big ? '10px 26px 20px' : '8px 20px 16px',
            borderRadius: big ? 18 : 14,
            opacity: i > current ? (easy ? 0.35 : 0.3) : 1,
          }}
        >
          {w}
        </span>
      ))}
    </div>
  );
}

export function VoiceNoteCard({ card, fonts }: { card: RoastCard; fonts: CardFonts }) {
  const easy = card.heat === 'easy';
  const fg = easy ? C.ink : C.cream;
  const muted = (a: number) => tint(easy ? 'ink' : 'cream', a);
  const { width, height } = FORMAT_SIZE['9:16'];
  const elapsed = card.voice?.elapsedSec ?? 0;
  const duration = card.voice?.durationSec ?? 1;
  const background = easy ? C.cream : 'radial-gradient(120% 70% at 50% 100%, #2A1B12 0%, #141210 60%)';
  const frame = { background, color: fg, padding: '88px 80px', fontFamily: fonts.body };
  const rest = easy ? tint('ink', 0.22) : tint('cream', 0.28);

  const header = (label: string) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ width: 22, height: 22, borderRadius: 999, background: C.accent }} />
        <div style={{ display: 'flex', ...type(fonts.mono, 500, 30), letterSpacing: ls(0.06, 30) }}>{label}</div>
      </div>
      <HeatBadge heat={card.heat} fonts={fonts} />
    </div>
  );

  if (card.kind === 'line' && card.line) {
    const words = card.line.joke.split(/\s+/).filter(Boolean);
    return (
      <Frame width={width} height={height} style={frame}>
        {header(`${card.line.target} · ${clock(duration)}`)}
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 120 }}>
          <Waveform heights={waveform(40, 3)} played={elapsed / duration} height={200} gap={8} radius={8} rest={rest} />
        </div>
        <Middle>
          <Captions words={words} current={currentCaptionWord(words, 'line')} card={card} fonts={fonts} size={78} />
        </Middle>
        <div style={{ display: 'flex', flexDirection: 'column', borderTop: `4px solid ${fg}`, paddingTop: 40 }}>
          <div style={{ display: 'flex', ...type(fonts.mono, 500, 26), letterSpacing: ls(0.08, 26), color: C.accent }}>
            {"WHAT'S ACTUALLY WRONG"}
          </div>
          <div style={{ display: 'flex', marginTop: 14, ...type(fonts.body, 500, 38, 1.25) }}>{card.line.wrong}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 56 }}>
          <Wordmark size={40} fonts={fonts} />
          <div style={{ display: 'flex', ...type(fonts.mono, 500, 28), color: muted(0.75) }}>{BRAND_HOST} · roast mine</div>
        </div>
      </Frame>
    );
  }

  const words = card.verdict ? `${card.verdict.setup} ${card.verdict.punchline}`.split(/\s+/).filter(Boolean) : [];
  return (
    <Frame width={width} height={height} style={frame}>
      {header(`VOICE NOTE · ${clock(duration)}`)}
      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 160 }}>
        <Waveform heights={waveform(40, easy ? 1 : 2)} played={elapsed / duration} height={260} gap={8} radius={8} rest={rest} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 30, ...type(fonts.mono, 500, 28), color: muted(0.55) }}>
        <span style={{ color: fg }}>{clock(elapsed)}</span>
        <span>{clock(duration)}</span>
      </div>
      <Middle>
        <Captions words={words} current={currentCaptionWord(words, 'verdict')} card={card} fonts={fonts} size={108} />
      </Middle>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `4px solid ${fg}`, paddingTop: 44 }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', ...type(fonts.mono, 500, 26), letterSpacing: ls(0.08, 26), color: muted(0.6) }}>CRINGE-O-METER</div>
          <div style={{ display: 'flex', alignItems: 'baseline', marginTop: 8 }}>
            <span style={{ ...type(fonts.mono, 700, 96, 1), letterSpacing: ls(-0.05, 96), color: easy ? undefined : C.accent }}>
              {score(card.cringe ?? 0)}
            </span>
            <span style={{ ...type(fonts.mono, 700, 40, 1), color: muted(0.5) }}>/10</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', ...type(fonts.body, 500, 30, 1.3), color: muted(0.75) }}>
          <div style={{ display: 'flex' }}>An AI roasted my profile.</div>
          <Wordmark size={40} fonts={fonts} color={fg} />
          <div style={{ display: 'flex', ...type(fonts.mono, 500, 28, 1.3) }}>{BRAND_HOST}</div>
        </div>
      </div>
    </Frame>
  );
}
