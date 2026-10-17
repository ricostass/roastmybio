import { ImageResponse } from 'next/og';
import { renderCard } from '@/components/cards/registry';
import { SATORI_FONTS } from '@/components/cards/kit';
import { loadCardFonts } from '@/lib/card-fonts';
import { FORMAT_SIZE, buildCard, parseFormat } from '@/lib/cards';
import { getAnalysis } from '@/lib/store';

export const runtime = 'nodejs';

// GET /api/card/:id?kind=verdict|line&line=0&format=9:16|4:5|1:1&t=verdict|poster|voice|receipt
export async function GET(request: Request, ctx: RouteContext<'/api/card/[id]'>) {
  const { id } = await ctx.params;
  const params = new URL(request.url).searchParams;
  const analysis = getAnalysis(id);
  if (!analysis) return new Response('Not found', { status: 404 });

  const format = parseFormat(params.get('format'));
  const card = buildCard(analysis, {
    kind: params.get('kind') === 'line' ? 'line' : 'verdict',
    line: Number(params.get('line') ?? 0) || 0,
    format,
  });
  if (!card) return new Response('Not found', { status: 404 });

  const { width, height } = FORMAT_SIZE[format];
  return new ImageResponse(renderCard(card, SATORI_FONTS, params.get('t')), {
    width,
    height,
    fonts: await loadCardFonts(),
    headers: { 'Cache-Control': 'public, max-age=3600, immutable' },
  });
}
