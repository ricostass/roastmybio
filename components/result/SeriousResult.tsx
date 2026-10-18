'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Wordmark } from '@/components/Wordmark';
import { metaLine } from '@/lib/format';
import type { Analysis, Fix, PhotoPick, PromptRewrite } from '@/lib/types';
import { SampleNotice, ScoreBlock } from './ScoreBlock';
import s from './result.module.css';

type Tier = 'quick' | 'full';

const TAGS: Record<PhotoPick['tag'], { label: string; className: string }> = {
  lead: { label: 'Lead with this', className: s.tagLead },
  keep: { label: 'Keep', className: s.tagKeep },
  'keep-one-group': { label: 'Keep one group', className: s.tagKeep },
  cut: { label: 'Cut', className: s.tagCut },
};

function FixCard({ fix, index, defaultOpen }: { fix: Fix; index: number; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);
  const id = `fix-source-${index}`;
  return (
    <div className={s.card}>
      <div className={s.cardHead}>
        <span className={s.index}>{String(index + 1).padStart(2, '0')}</span>
        <span className={s.chip}>{fix.evidence}</span>
      </div>
      <div className={s.strong}>{fix.text}</div>
      <button type="button" className={s.link} aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
        Source {open ? '▾' : '▸'}
      </button>
      {open && (
        <dl id={id} className={s.sourceGrid}>
          <dt>Publisher</dt>
          <dd>{fix.source.publisher}</dd>
          <dt>Year</dt>
          <dd>{fix.source.year}</dd>
          <dt>Sample</dt>
          <dd>{fix.source.sample}</dd>
          <dt>Finding</dt>
          <dd>{fix.source.finding}</dd>
        </dl>
      )}
    </div>
  );
}

function RewriteCard({ rewrite }: { rewrite: PromptRewrite }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(rewrite.suggested);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be blocked (permissions, insecure origin); the text is still selectable.
    }
  }
  return (
    <div className={s.card}>
      <div className={s.monoSmall}>{rewrite.label}</div>
      <div className={s.struck}>
        <span className="sr-only">Current answer: </span>
        {rewrite.current}
      </div>
      <div className={s.strong}>{rewrite.suggested}</div>
      <div className={s.why}>
        <span>Why:</span> {rewrite.why}
      </div>
      <button type="button" className={s.pill} onClick={copy} aria-live="polite">
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}

function PhotoOrder({ order }: { order: PhotoPick[] }) {
  return (
    <ol className={s.photos}>
      {order.map((p) => {
        const tag = TAGS[p.tag];
        return (
          <li key={p.photo} className={s.photo} data-cut={p.tag === 'cut' || undefined}>
            <span className={s.photoIndex}>photo {p.photo}</span>
            <span className={`${s.tag} ${tag.className}`}>{tag.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

function FullReview({ analysis, tier }: { analysis: Analysis; tier: Tier }) {
  const review = analysis.serious;
  const fixes = tier === 'full' ? review.fixes : review.fixes.slice(0, 1);
  return (
    <>
      <section className={s.section}>
        <h2 className={s.h2}>{tier === 'full' ? 'Fix these first' : 'Your biggest fix'}</h2>
        {fixes.map((fix, i) => (
          <FixCard key={i} fix={fix} index={i} defaultOpen={i === 0} />
        ))}
      </section>
      {tier === 'full' && (
        <>
          <section className={s.section}>
            <h2 className={s.h2}>Suggested photo order</h2>
            <PhotoOrder order={review.photoOrder} />
          </section>
          <aside className={s.trend}>
            <div className={s.trendLabel}>WHAT&apos;S WORKING IN 2026</div>
            <div className={s.trendTitle}>{review.trend.title}</div>
            <div className={s.trendBody}>{review.trend.body}</div>
            <div className={s.trendSource}>{review.trend.source}</div>
          </aside>
          <section className={s.section}>
            <h2 className={s.h2}>Prompt rewrites</h2>
            {review.rewrites.map((r, i) => (
              <RewriteCard key={i} rewrite={r} />
            ))}
          </section>
        </>
      )}
      <div className={s.footer}>
        <Link href="/?mode=serious#upload" className={s.primary}>
          Re-check after changes
        </Link>
        <a href="#" className={s.footLink}>
          Sources used · How we rate evidence
        </a>
      </div>
    </>
  );
}

/** The locked part of the free teaser: real content, blurred, under one unlock card. */
function Locked({ analysis, onUnlock }: { analysis: Analysis; onUnlock: (tier: Tier) => void }) {
  const review = analysis.serious;
  const locked = [
    `${review.fixes.length} FIXES`,
    'PHOTO ORDER',
    `${review.rewrites.length} REWRITES`,
    'ROAST',
  ].join(' · ');
  return (
    <div className={s.locked}>
      <div className={s.blurred} aria-hidden="true" inert>
        <h2 className={s.h2}>Fix these first</h2>
        {review.fixes.map((fix, i) => (
          <div key={i} className={s.card}>
            <div className={s.cardHead}>
              <span className={s.index}>{String(i + 1).padStart(2, '0')}</span>
              <span className={s.chip}>{fix.evidence}</span>
            </div>
            <div className={s.strong}>{fix.text}</div>
          </div>
        ))}
        <h2 className={s.h2} style={{ marginTop: 16 }}>
          Suggested photo order
        </h2>
        <div className={s.photos}>
          {[0, 1, 2].map((i) => (
            <div key={i} className={s.photoBlank} />
          ))}
        </div>
      </div>
      <div className={s.unlock}>
        <div className={s.unlockLabel}>LOCKED · {locked}</div>
        <div className={s.unlockTitle}>See what&apos;s costing you matches.</div>
        {/* Checkout isn't built yet: these unlock in place. */}
        <button type="button" className={s.unlockPrimary} onClick={() => onUnlock('full')}>
          <span>Full review</span>
          <span className={s.mono}>[PRICE]</span>
        </button>
        <button type="button" className={s.unlockSecondary} onClick={() => onUnlock('quick')}>
          <span>Quick check · biggest fix only</span>
          <span className={s.mono}>[PRICE]</span>
        </button>
        <div className={s.unlockFine}>One-time. Includes one re-check. [PRIVACY PROMISE]</div>
      </div>
    </div>
  );
}

export function SeriousResult({ analysis }: { analysis: Analysis }) {
  const [tier, setTier] = useState<Tier | null>(null);
  const looking = `LOOKING FOR ${analysis.looking.toUpperCase()}`;
  const meta = metaLine([
    analysis.app.toUpperCase(),
    `${analysis.meta.photos} PHOTOS`,
    `${analysis.meta.prompts} PROMPTS`,
    tier ? looking.replace('LOOKING FOR NOT SURE YET', 'NOT SURE YET') : 'FREE PREVIEW',
  ]);

  return (
    <div className="theme" data-mode="serious">
      <main className={s.page}>
        <header className={s.header}>
          <Wordmark size={18} href="/" />
          {tier ? (
            <span className={s.headerLabel}>{tier === 'full' ? 'FULL REVIEW' : 'QUICK CHECK'}</span>
          ) : (
            <div className={s.modePill} aria-label="Mode: Serious">
              <span data-on>Serious</span>
              <span>Roast</span>
            </div>
          )}
        </header>
        <div className={s.meta}>{meta}</div>
        {analysis.demo && <SampleNotice />}
        <ScoreBlock review={analysis.serious} />
        {tier ? <FullReview analysis={analysis} tier={tier} /> : <Locked analysis={analysis} onUnlock={setTier} />}
      </main>
    </div>
  );
}
