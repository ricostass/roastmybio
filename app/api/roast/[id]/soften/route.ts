import { analyzeProfile } from '@/lib/analyze';
import { getAnalysis, saveAnalysis } from '@/lib/store';

export const runtime = 'nodejs';

// "Too much? Go easy on me" — re-runs the roast at the lower heat.
export async function POST(_request: Request, ctx: RouteContext<'/api/roast/[id]/soften'>) {
  const { id } = await ctx.params;
  const original = getAnalysis(id);
  if (!original?.roast) return Response.json({ error: 'Not found' }, { status: 404 });
  if (original.roast.heat === 'easy') return Response.json({ id });

  // Screenshots aren't kept after analysis, so this works from the original
  // inputs; a model-backed analyzer should re-run from its stored findings.
  const softer = await analyzeProfile(
    { mode: 'roast', app: original.app, looking: original.looking, heat: 'easy', voice: original.voice },
    [],
  );
  saveAnalysis(softer);
  return Response.json({ id: softer.id });
}
