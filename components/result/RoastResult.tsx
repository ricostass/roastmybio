'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Waveform } from '@/components/Waveform';
import { Wordmark } from '@/components/Wordmark';
import { cardImageUrl, type CardRequest } from '@/lib/cards';
import { clock, lowerFirst, metaLine } from '@/lib/format';
import { CARD_FORMATS, type Analysis, type Roast } from '@/lib/types';
import { BRAND } from '@/lib/brand';
import { usePlayback } from '@/lib/use-playback';
import { SampleNotice } from './ScoreBlock';
import s from './result.module.css';

/** The MP4 (card animated with the voice note) isn't rendered yet. */
const VIDEO_READY = false;

function VoiceNote({ roast }: { roast: Roast }) {
  const { durationSec, audioUrl, segments } = roast.voice;
  const { playing, elapsed, progress, toggle } = usePlayback(durationSec, audioUrl);
  const now = [...segments].reverse().find((seg) => elapsed >= seg.startSec) ?? segments[0];
  return (
    <section className={s.voice} aria-label="Voice note">
      <div className={s.voiceHead}>
        <span>VOICE NOTE · {roast.heat === 'easy' ? 'GO EASY' : 'NO CHILL'}</span>
        <span>
          {clock(elapsed)} / {clock(durationSec)}
        </span>
      </div>
      <div className={s.voicePlayer}>
        <button type="button" className={s.play} onClick={toggle} aria-label={playing ? 'Pause voice note' : 'Play voice note'}>
          {playing ? '❚❚' : '▶'}
        </button>
        <Waveform progress={progress} height={52} />
      </div>
      <div className={s.nowRoasting} aria-live="polite">
        Now roasting: <strong>{now.label}</strong>
      </div>
    </section>
  );
}

async function cardFiles(id: string, reqs: CardRequest[]) {
  return Promise.all(
    reqs.map(async (req) => {
      const res = await fetch(cardImageUrl(id, req));
      if (!res.ok) throw new Error('Card render failed');
      const name = `${BRAND}-${req.kind}${req.kind === 'line' ? `-${(req.line ?? 0) + 1}` : ''}-${req.format.replace(':', 'x')}.png`;
      return new File([await res.blob()], name, { type: 'image/png' });
    }),
  );
}

function download(file: File) {
  const url = URL.createObjectURL(file);
  const a = Object.assign(document.createElement('a'), { href: url, download: file.name });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function RoastResult({ analysis }: { analysis: Analysis }) {
  const router = useRouter();
  const roast = analysis.roast!;
  const [status, setStatus] = useState<string | null>(null);
  const [softening, setSoftening] = useState(false);

  async function share(reqs: CardRequest[]) {
    setStatus('Making your cards…');
    try {
      const files = await cardFiles(analysis.id, reqs);
      if (roast.voice.audioUrl) {
        const audio = await fetch(roast.voice.audioUrl).then((r) => r.blob());
        files.push(new File([audio], `${BRAND}-voice-note.mp3`, { type: audio.type || 'audio/mpeg' }));
      }
      const data = { files, text: 'An AI roasted my dating profile.', url: `${location.origin}/s/${analysis.id}` };
      if (navigator.canShare?.(data)) {
        await navigator.share(data);
        setStatus(null);
      } else {
        files.forEach(download);
        setStatus(`Saved ${files.length} file${files.length === 1 ? '' : 's'}.`);
      }
    } catch (err) {
      // AbortError means the person closed the share sheet.
      setStatus(err instanceof DOMException && err.name === 'AbortError' ? null : "Couldn't make the cards. Try again.");
    }
  }

  async function goEasy() {
    setSoftening(true);
    const res = await fetch(`/api/roast/${analysis.id}/soften`, { method: 'POST' });
    const data = (await res.json()) as { id?: string };
    if (data.id) router.push(`/result/${data.id}`);
    else setSoftening(false);
  }

  const verdict = `${roast.verdict.setup} ${roast.verdict.punchline}`;
  return (
    <div className="theme" data-mode="roast">
      <main className={s.page}>
        <header className={s.header} style={{ paddingBottom: 14 }}>
          <Wordmark size={18} href="/" />
          <span className={s.headerLabel}>
            {metaLine([analysis.app.toUpperCase(), `${analysis.meta.photos} PHOTOS`, `${analysis.meta.prompts} PROMPTS`])}
          </span>
        </header>

        {analysis.demo && <SampleNotice />}
        <div className={s.verdictCard}>
          <Image
            src={cardImageUrl(analysis.id, { kind: 'verdict', format: '1:1' })}
            alt={`Roast card. ${verdict} Cringe ${roast.cringe} out of 10.`}
            width={1080}
            height={1080}
            unoptimized
            priority
          />
        </div>

        <div className={s.share}>
          <button
            type="button"
            className={s.primary}
            onClick={() => share(CARD_FORMATS.map((format) => ({ kind: 'verdict', format })))}
          >
            {analysis.voice ? 'Share card + voice note' : 'Share card'}
          </button>
          <div className={s.formats}>
            {CARD_FORMATS.map((f, i) => (
              <span key={f}>
                {i > 0 && <span className={s.sep}>·</span>}
                {f}
              </span>
            ))}
            {VIDEO_READY && analysis.voice && (
              <span>
                <span className={s.sep}>·</span>
                <span className={s.video}>+ video</span>
              </span>
            )}
          </div>
          {status && (
            <div className={s.status} role="status">
              {status}
            </div>
          )}
        </div>

        {analysis.voice && <VoiceNote roast={roast} />}

        <section className={s.section} style={{ paddingTop: 28 }}>
          <h2 className={s.label}>THE ROAST · {roast.lines.length} LINES</h2>
          {roast.lines.map((line, i) => (
            <div key={i} className={s.card}>
              <span className={s.target}>{line.target}</span>
              <div className={s.joke}>{line.joke}</div>
              <div className={s.wrong}>
                <strong>What&apos;s actually wrong:</strong> {lowerFirst(line.wrong)}
              </div>
              <button type="button" className={s.link} onClick={() => share([{ kind: 'line', line: i, format: '9:16' }])}>
                Share this line →
              </button>
            </div>
          ))}
        </section>

        <div className={s.footer}>
          {roast.heat === 'nochill' && (
            <button type="button" className={s.outline} onClick={goEasy} disabled={softening}>
              {softening ? 'Turning it down…' : 'Too much? Go easy on me'}
            </button>
          )}
          <Link href={`/result/${analysis.id}?view=serious`} className={s.footLink}>
            Read the full serious review →
          </Link>
        </div>
      </main>
    </div>
  );
}
