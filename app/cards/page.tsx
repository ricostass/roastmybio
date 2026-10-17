import type { Metadata } from 'next';
import { CardPreview } from '@/components/cards/CardPreview';
import { VerdictVideoFrame } from '@/components/cards/TheVerdict';
import { WEB_FONTS } from '@/components/cards/kit';
import { DEFAULT_TEMPLATE, TEMPLATES, TEMPLATE_IDS } from '@/components/cards/registry';
import { buildCard, cardImageUrl, type CardRequest } from '@/lib/cards';
import { DEMO_IDS, getAnalysis } from '@/lib/store';
import type { RoastCard } from '@/lib/types';
import s from './cards.module.css';

// Design review: every roast card direction, rendered live from the shared
// card model. Each preview links to the PNG export of the same card.

export const metadata: Metadata = { title: 'Roast cards — ProfileCheck', robots: { index: false } };

const VARIANTS: { id: string; label: string; req: CardRequest }[] = [
  { id: DEMO_IDS.roastEasy, label: 'Verdict · Go easy', req: { kind: 'verdict', format: '9:16' } },
  { id: DEMO_IDS.roastNoChill, label: 'Verdict · No chill', req: { kind: 'verdict', format: '9:16' } },
  { id: DEMO_IDS.roastNoChill, label: 'Line · No chill', req: { kind: 'line', line: 0, format: '9:16' } },
  { id: DEMO_IDS.roastEasy, label: 'Line · Go easy', req: { kind: 'line', line: 1, format: '9:16' } },
];

function card(id: string, req: CardRequest) {
  return buildCard(getAnalysis(id)!, req)!;
}

function Item({ id, label, req, template, width = 270 }: { id: string; label: string; req: CardRequest; template?: string; width?: number }) {
  return (
    <figure className={s.item}>
      <CardPreview card={card(id, req)} template={template} width={width} />
      <figcaption>
        {label} · <a href={cardImageUrl(id, { ...req, template })}>PNG</a>
      </figcaption>
    </figure>
  );
}

export default function CardsPage() {
  const video: RoastCard = card(DEMO_IDS.roastNoChill, { kind: 'verdict', format: '9:16' });
  return (
    <main className={s.page}>
      <h1 className={s.h1}>Roast cards</h1>
      <p className={s.intro}>
        Four directions, one card model. The share flow uses <strong>{TEMPLATES[DEFAULT_TEMPLATE].name}</strong> — change it
        with <code>NEXT_PUBLIC_CARD_TEMPLATE</code> ({TEMPLATE_IDS.join(' / ')}), or per image with <code>?t=</code>. Only The
        Verdict has 4:5 and 1:1; the others fall back to it in feed formats.
      </p>

      {TEMPLATE_IDS.map((t) => (
        <section key={t} className={s.section}>
          <h2 className={s.h2}>
            <span className={s.ref}>{TEMPLATES[t].ref}</span> {TEMPLATES[t].name}
            {t === DEFAULT_TEMPLATE && <span className={s.current}>in use</span>}
          </h2>
          <p className={s.blurb}>{TEMPLATES[t].blurb}</p>
          <div className={s.row}>
            {VARIANTS.map((v) => (
              <Item key={v.label} {...v} template={t} />
            ))}
          </div>
        </section>
      ))}

      <section className={s.section}>
        <h2 className={s.h2}>
          <span className={s.ref}>1e</span> Feed formats
        </h2>
        <p className={s.blurb}>4:5 (1080×1350) and 1:1 (1080×1080) of The Verdict.</p>
        <div className={s.row}>
          <Item id={DEMO_IDS.roastNoChill} label="4:5 · No chill" req={{ kind: 'verdict', format: '4:5' }} width={300} />
          <Item id={DEMO_IDS.roastNoChill} label="1:1 · No chill" req={{ kind: 'verdict', format: '1:1' }} width={300} />
          <Item id={DEMO_IDS.roastEasy} label="4:5 · Go easy" req={{ kind: 'verdict', format: '4:5' }} width={300} />
          <Item id={DEMO_IDS.roastEasy} label="1:1 · Line" req={{ kind: 'line', line: 2, format: '1:1' }} width={300} />
        </div>
      </section>

      <section className={s.section}>
        <h2 className={s.h2}>
          <span className={s.ref}>1f</span> Video frame
        </h2>
        <p className={s.blurb}>
          The Verdict at 0:31: captions sync to the spoken word, progress along the bottom. The MP4 isn&apos;t rendered yet.
        </p>
        <div className={s.row}>
          <figure className={s.item}>
            <div className={s.scaled} style={{ width: 270, height: 480 }}>
              <div style={{ transform: 'scale(0.25)', transformOrigin: '0 0' }}>
                <VerdictVideoFrame
                  card={video}
                  fonts={WEB_FONTS}
                  caption={{ words: ['Six', 'photos,', 'one', 'facial', 'expression.'], current: 3 }}
                />
              </div>
            </div>
            <figcaption>Frame at 0:31 · No chill</figcaption>
          </figure>
        </div>
      </section>
    </main>
  );
}
