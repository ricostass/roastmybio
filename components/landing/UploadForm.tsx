'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type DragEvent } from 'react';
import { DATING_APPS, LOOKING_OPTIONS, type DatingApp, type Heat, type Looking, type Mode } from '@/lib/types';
import { ACCEPTED_TYPES, MAX_SCREENSHOTS, validateScreenshots } from '@/lib/upload';
import s from './landing.module.css';

const HEAT_OPTIONS: { value: Heat; label: string; sub: string }[] = [
  { value: 'genz', label: 'Gen Z', sub: 'The comment section. Chronically online.' },
  { value: 'nochill', label: 'No chill · 18+', sub: 'Swearing, below the belt.' },
];

function Chips<T extends string>({ legend, options, value, onChange }: {
  legend: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <fieldset className={s.field}>
      <legend className={s.fieldLabel}>{legend}</legend>
      <div className={s.chips}>
        {options.map((o) => (
          <button key={o} type="button" className={s.chip} aria-pressed={o === value} onClick={() => onChange(o)}>
            {o}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

interface Picked {
  file: File;
  /** Object URL for the preview thumbnail. */
  url: string;
}

const sameFile = (a: File, b: File) => a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;

function Thumbnails({ picked, onRemove }: { picked: Picked[]; onRemove: (index: number) => void }) {
  if (!picked.length) return null;
  return (
    <ol className={s.thumbs} aria-label="Your screenshots">
      {picked.map((p, i) => (
        <li key={p.url} className={s.thumb}>
          {/* Local object URL, so next/image has nothing to optimise. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.url} alt={`Screenshot ${i + 1}: ${p.file.name}`} />
          <span className={s.thumbIndex}>{i + 1}</span>
          <button type="button" className={s.thumbRemove} onClick={() => onRemove(i)} aria-label={`Remove screenshot ${i + 1}`}>
            ×
          </button>
        </li>
      ))}
    </ol>
  );
}

export function UploadForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [picked, setPicked] = useState<Picked[]>([]);
  const files = picked.map((p) => p.file);
  const [dragging, setDragging] = useState(false);
  const [looking, setLooking] = useState<Looking>('A relationship');
  const [app, setApp] = useState<DatingApp>('Hinge');
  const [heat, setHeat] = useState<Heat>('genz');
  const [voice, setVoice] = useState(true);
  const [adult, setAdult] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const roast = mode === 'roast';
  const needsAdult = roast && heat === 'nochill';

  // Revoke preview URLs once they're no longer shown.
  const urls = useRef<string[]>([]);
  useEffect(() => {
    const live = new Set(picked.map((p) => p.url));
    urls.current.filter((u) => !live.has(u)).forEach((u) => URL.revokeObjectURL(u));
    urls.current = [...live];
  }, [picked]);
  useEffect(() => () => urls.current.forEach((u) => URL.revokeObjectURL(u)), []);

  function update(next: Picked[]) {
    setPicked(next);
    setError(next.length ? validateScreenshots(next.map((p) => p.file)) : null);
  }

  /** New screenshots are added after the ones already picked, in profile order. */
  function pick(list: FileList | null) {
    if (!list?.length) return;
    const added = Array.from(list)
      .filter((f) => !picked.some((p) => sameFile(p.file, f)))
      .map((file) => ({ file, url: URL.createObjectURL(file) }));
    update([...picked, ...added]);
  }

  function remove(index: number) {
    update(picked.filter((_, i) => i !== index));
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    pick(e.dataTransfer.files);
  }

  async function submit() {
    const problem = validateScreenshots(files);
    if (problem) return setError(problem);
    if (needsAdult && !adult) return setError('No chill is 18+ only. Tick the box to confirm.');
    setError(null);
    setSubmitting(true);
    const body = new FormData();
    files.forEach((f) => body.append('screenshots', f));
    body.set('mode', mode);
    body.set('looking', looking);
    body.set('app', app);
    body.set('heat', roast ? heat : 'genz');
    body.set('voice', String(roast && voice));
    body.set('adult', String(needsAdult && adult));
    try {
      const res = await fetch('/api/analyze', { method: 'POST', body });
      const data = (await res.json()) as { id?: string; error?: string };
      if (!res.ok || !data.id) throw new Error(data.error ?? 'Something went wrong. Try again.');
      router.push(`/result/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
      setSubmitting(false);
    }
  }

  return (
    <form
      className={s.upload}
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      noValidate
    >
      <div className={s.uploadLeft}>
        <div className={s.label}>STEP 1 · UPLOAD</div>
        <label
          className={s.drop}
          data-dragging={dragging || undefined}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <input
            type="file"
            multiple
            accept={ACCEPTED_TYPES.join(',')}
            className="sr-only"
            onChange={(e) => {
              pick(e.target.files);
              // Lets the same file be picked again after it was removed.
              e.target.value = '';
            }}
          />
          <span className={s.plus} aria-hidden="true">
            +
          </span>
          {files.length ? (
            <>
              <span className={s.dropTitle}>
                {files.length} screenshot{files.length === 1 ? '' : 's'} ready
              </span>
              <span className={s.dropSub}>Tap or drop to add more · in profile order</span>
            </>
          ) : (
            <>
              <span className={s.dropTitle}>Drop your profile screenshots</span>
              <span className={s.dropSub}>Up to {MAX_SCREENSHOTS} · PNG or JPG · tap to browse on mobile</span>
            </>
          )}
        </label>
        <Thumbnails picked={picked} onRemove={remove} />
        <div className={s.privacy}>[PRIVACY PROMISE — e.g. screenshots are deleted after analysis; never used for training]</div>
      </div>

      <div className={s.uploadRight}>
        <Chips legend="What are you looking for?" options={LOOKING_OPTIONS} value={looking} onChange={setLooking} />
        <Chips legend="Which app?" options={DATING_APPS} value={app} onChange={setApp} />
        {roast && (
          <>
            <fieldset className={s.field}>
              <legend className={s.fieldLabel}>How hot?</legend>
              <div className={s.heat}>
                {HEAT_OPTIONS.map((o) => (
                  <button key={o.value} type="button" className={s.heatOption} aria-pressed={heat === o.value} onClick={() => setHeat(o.value)}>
                    <span className={s.heatLabel}>{o.label}</span>
                    <span className={s.heatSub}>{o.sub}</span>
                  </button>
                ))}
              </div>
            </fieldset>
            {needsAdult && (
              <label className={s.check}>
                <input type="checkbox" checked={adult} onChange={(e) => setAdult(e.target.checked)} />
                <span>I&apos;m 18+ and this is my own profile</span>
              </label>
            )}
            <div className={s.switchRow}>
              <span id="voice-label">
                <span className={s.switchTitle}>Say it out loud</span>
                <span className={s.switchSub}>Deliver the roast as a voice note</span>
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={voice}
                aria-labelledby="voice-label"
                className={s.switch}
                onClick={() => setVoice((v) => !v)}
              >
                <span />
              </button>
            </div>
          </>
        )}
        {error && (
          <div className={s.error} role="alert">
            {error}
          </div>
        )}
        <button type="submit" className={s.submit} disabled={submitting}>
          {submitting ? 'Reading your screenshots…' : roast ? 'Roast my profile' : 'Score my profile'}
        </button>
        <div className={s.fine}>You&apos;ll see your score and verdict free. Unlock the full review after.</div>
      </div>
    </form>
  );
}
