import { softenRoast } from '@/lib/analyze';
import { ReviewError } from '@/lib/review';
import { getAnalysis, saveAnalysis } from '@/lib/store';

export const runtime = 'nodejs';
export const maxDuration = 120;

// "Too much? Go easy on me": re-runs the roast at the lower heat. The serious
// review, and so the score, is carried over unchanged.
export async function POST(_request: Request, ctx: RouteContext<'/api/roast/[id]/soften'>) {
  const { id } = await ctx.params;
  const original = getAnalysis(id);
  if (!original?.roast) return Response.json({ error: 'Not found' }, { status: 404 });
  if (original.roast.heat === 'easy') return Response.json({ id });

  try {
    const softer = await softenRoast(original);
    saveAnalysis(softer);
    return Response.json({ id: softer.id });
  } catch (err) {
    if (err instanceof ReviewError) return Response.json({ error: err.message }, { status: err.status });
    console.error('soften failed', err);
    return Response.json({ error: 'Something went wrong. Try again.' }, { status: 500 });
  }
}
