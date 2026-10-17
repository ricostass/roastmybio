import { FORMAT_SIZE } from '@/lib/cards';
import type { RoastCard } from '@/lib/types';
import { WEB_FONTS } from './kit';
import { renderCard } from './registry';

/** Live (DOM) rendering of a card at export size, scaled down to `width`. */
export function CardPreview({ card, template, width, radius = 14 }: {
  card: RoastCard;
  template?: string | null;
  width: number;
  radius?: number;
}) {
  const size = FORMAT_SIZE[card.format];
  const scale = width / size.width;
  return (
    <div
      style={{
        width,
        height: Math.round(size.height * scale),
        overflow: 'hidden',
        borderRadius: radius,
        boxShadow: '0 8px 30px rgba(0,0,0,.18)',
        flex: 'none',
      }}
    >
      <div style={{ width: size.width, height: size.height, transform: `scale(${scale})`, transformOrigin: '0 0' }}>
        {renderCard(card, WEB_FONTS, template)}
      </div>
    </div>
  );
}
