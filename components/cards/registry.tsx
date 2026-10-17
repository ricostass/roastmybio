import type { ReactElement } from 'react';
import type { CardFormat, CardKind, RoastCard } from '@/lib/types';
import type { CardFonts } from './kit';
import { HotTakePoster } from './HotTakePoster';
import { TheReceipt } from './TheReceipt';
import { TheVerdict } from './TheVerdict';
import { VoiceNoteCard } from './VoiceNoteCard';

// Roast card layouts are swappable: every template draws the same RoastCard
// model. The final direction hasn't been picked yet, so the default is set
// with NEXT_PUBLIC_CARD_TEMPLATE (and can be overridden per request).

export type TemplateId = 'verdict' | 'poster' | 'voice' | 'receipt';

export interface CardTemplate {
  id: TemplateId;
  /** Design reference in the handoff, e.g. "1a". */
  ref: string;
  name: string;
  blurb: string;
  formats: CardFormat[];
  kinds: CardKind[];
  render: (card: RoastCard, fonts: CardFonts) => ReactElement;
}

export const TEMPLATES: Record<TemplateId, CardTemplate> = {
  verdict: {
    id: 'verdict',
    ref: '1a',
    name: 'The Verdict',
    blurb: 'Editorial type; cream ↔ black flips with heat.',
    formats: ['9:16', '4:5', '1:1'],
    kinds: ['verdict', 'line'],
    render: (card, fonts) => <TheVerdict card={card} fonts={fonts} />,
  },
  poster: {
    id: 'poster',
    ref: '1b',
    name: 'Hot Take Poster',
    blurb: 'All-caps, stickers, a thermometer. No chill goes full orange.',
    formats: ['9:16'],
    kinds: ['verdict', 'line'],
    render: (card, fonts) => <HotTakePoster card={card} fonts={fonts} />,
  },
  voice: {
    id: 'voice',
    ref: '1c',
    name: 'The Voice Note',
    blurb: 'A frame of the audio: waveform and captions, the spoken word lit.',
    formats: ['9:16'],
    kinds: ['verdict', 'line'],
    render: (card, fonts) => <VoiceNoteCard card={card} fonts={fonts} />,
  },
  receipt: {
    id: 'receipt',
    ref: '1d',
    name: 'The Receipt',
    blurb: 'Every joke a line item; the Cringe-o-meter is the total.',
    formats: ['9:16'],
    kinds: ['verdict', 'line'],
    render: (card, fonts) => <TheReceipt card={card} fonts={fonts} />,
  },
};

export const TEMPLATE_IDS = Object.keys(TEMPLATES) as TemplateId[];

export function isTemplateId(value: unknown): value is TemplateId {
  return typeof value === 'string' && value in TEMPLATES;
}

export const DEFAULT_TEMPLATE: TemplateId = isTemplateId(process.env.NEXT_PUBLIC_CARD_TEMPLATE)
  ? process.env.NEXT_PUBLIC_CARD_TEMPLATE
  : 'verdict';

/**
 * Picks the template that draws a card. Only "The Verdict" has feed formats
 * (4:5, 1:1); other directions fall back to it outside 9:16.
 */
export function resolveTemplate(requested: string | null | undefined, card: Pick<RoastCard, 'format' | 'kind'>): CardTemplate {
  const wanted = TEMPLATES[isTemplateId(requested) ? requested : DEFAULT_TEMPLATE];
  if (wanted.formats.includes(card.format) && wanted.kinds.includes(card.kind)) return wanted;
  return TEMPLATES.verdict;
}

export function renderCard(card: RoastCard, fonts: CardFonts, template?: string | null) {
  return resolveTemplate(template, card).render(card, fonts);
}
