'use client';

import { SubScores } from '@/components/result/ScoreBlock';
import { Waveform } from '@/components/Waveform';
import { clock, meterBlocks } from '@/lib/format';
import { SAMPLE_ROAST, SAMPLE_SERIOUS } from '@/lib/sample';
import type { Mode } from '@/lib/types';
import { usePlayback } from '@/lib/use-playback';
import s from './landing.module.css';

const ROAST = SAMPLE_ROAST.nochill;

/** The sample result beside the hero headline; swaps with the mode. */
export function HeroSample({ mode }: { mode: Mode }) {
  return mode === 'roast' ? <RoastSample /> : <SeriousSample />;
}

function SeriousSample() {
  return (
    <div className={s.sample}>
      <div className={s.sampleHead}>
        <span className={s.label}>OVERALL SCORE</span>
        <span className={s.monoMuted}>6 photos · 3 prompts</span>
      </div>
      <div className={s.bigScore}>
        <span>7.4</span>
        <span className={s.outOf}>/10</span>
      </div>
      <SubScores sub={SAMPLE_SERIOUS.sub} variant="hero" />
      <div className={s.sampleFoot}>
        <div className={s.row}>
          <span className={s.label}>BIGGEST FIX</span>
          <span className={s.evidence}>Platform data</span>
        </div>
        <div className={s.fixText}>Lead with a photo where you&apos;re doing something. Photo 4 (climbing) should be first, not fifth.</div>
        <div className={s.source}>Source: [Publisher], [Year], n=[sample]</div>
      </div>
    </div>
  );
}

function RoastSample() {
  const { playing, elapsed, progress, toggle } = usePlayback(ROAST.voice.durationSec, ROAST.voice.audioUrl, ROAST.voice.frameSec);
  const filled = meterBlocks(ROAST.cringe);
  return (
    <div className={s.sample}>
      <div className={s.sampleHead} style={{ alignItems: 'center' }}>
        <span className={s.label}>VOICE NOTE · {clock(ROAST.voice.durationSec)}</span>
        <span className={s.heatBadge}>NO CHILL · 18+</span>
      </div>
      <div className={s.player}>
        <button type="button" className={s.play} onClick={toggle} aria-label={playing ? 'Pause sample voice note' : 'Play sample voice note'}>
          {playing ? '❚❚' : '▶'}
        </button>
        <Waveform progress={progress} />
        <span className={s.monoMuted} style={{ fontSize: 13 }}>
          {clock(elapsed)}
        </span>
      </div>
      <div className={s.quote}>
        The good news: you&apos;d never cheat. The bad news: that&apos;s not loyalty.{' '}
        <span className={s.accent}>That&apos;s market conditions.</span>
      </div>
      <div className={`${s.sampleFoot} ${s.cringeRow}`}>
        <div>
          <div className={s.label}>CRINGE-O-METER</div>
          <div className={s.cringe}>
            {ROAST.cringe.toFixed(1)}
            <span>/10</span>
          </div>
        </div>
        <div className={s.meter} role="img" aria-label={`Cringe ${ROAST.cringe} out of 10`}>
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className={i < filled ? s.meterOn : s.meterOff} style={{ height: `${30 + i * 10}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
