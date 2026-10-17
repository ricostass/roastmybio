import { analyzeProfile } from '@/lib/analyze';
import { saveAnalysis } from '@/lib/store';
import { parseCheckOptions, validateScreenshots } from '@/lib/upload';

export const runtime = 'nodejs';

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

  const analysis = await analyzeProfile(options, screenshots);
  saveAnalysis(analysis);
  return Response.json({ id: analysis.id });
}
