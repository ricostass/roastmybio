import { analyzeProfile } from '@/lib/analyze';
import { ReviewError } from '@/lib/review';
import { saveAnalysis } from '@/lib/store';
import { parseCheckOptions, validateScreenshots } from '@/lib/upload';

export const runtime = 'nodejs';
// Reading up to nine screenshots with the model takes a while.
export const maxDuration = 120;

// POST multipart: screenshots (1–9 PNG/JPG), mode, looking, app, heat, voice, adult.
export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: 'Expected a form upload.' }, { status: 400 });
  }
  const screenshots = form.getAll('screenshots').filter((v): v is File => v instanceof File);
  const fileError = validateScreenshots(screenshots);
  if (fileError) return Response.json({ error: fileError }, { status: 400 });

  const options = parseCheckOptions((key) => {
    const v = form.get(key);
    return typeof v === 'string' ? v : null;
  });
  if (typeof options === 'string') return Response.json({ error: options }, { status: 400 });

  try {
    const analysis = await analyzeProfile(options, screenshots);
    saveAnalysis(analysis);
    return Response.json({ id: analysis.id });
  } catch (err) {
    if (err instanceof ReviewError) return Response.json({ error: err.message }, { status: err.status });
    console.error('analyze failed', err);
    return Response.json({ error: 'Something went wrong reading your profile. Try again.' }, { status: 500 });
  }
}
