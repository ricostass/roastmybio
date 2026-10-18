import { genZRoast } from '@/lib/analyze';
import { ReviewError } from '@/lib/review';
import { getAnalysis, saveAnalysis } from '@/lib/store';
import { voiceOver } from '@/lib/voice';

export const runtime = 'nodejs';
export const maxDuration = 180;

// "Get the Gen Z take": re-runs the roast with the Gen Z roaster. The serious
// review, and so the score, is carried over unchanged.
export async function POST(_request: Request, ctx: RouteContext<'/api/roast/[id]/genz'>) {
  const { id } = await ctx.params;
  const original = getAnalysis(id);
  if (!original?.roast) return Response.json({ error: 'Not found' }, { status: 404 });
  if (original.roast.heat === 'genz') return Response.json({ id });

  try {
    const { analysis: genz, voiceNote } = await voiceOver(await genZRoast(original));
    saveAnalysis(genz, voiceNote);
    return Response.json({ id: genz.id });
  } catch (err) {
    if (err instanceof ReviewError) return Response.json({ error: err.message }, { status: err.status });
    console.error('gen z roast failed', err);
    return Response.json({ error: 'Something went wrong. Try again.' }, { status: 500 });
  }
}
