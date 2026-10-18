import { BRAND } from '@/lib/brand';
import { byteRange } from '@/lib/range';
import { getVoiceNote } from '@/lib/store';

export const runtime = 'nodejs';

// GET /api/voice/:id: the roast's voice note as MP3. Answers byte ranges,
// which Safari needs before it will play audio.
export async function GET(request: Request, ctx: RouteContext<'/api/voice/[id]'>) {
  const { id } = await ctx.params;
  const mp3 = getVoiceNote(id);
  if (!mp3) return new Response('Not found', { status: 404 });

  const headers = {
    'Content-Type': 'audio/mpeg',
    'Accept-Ranges': 'bytes',
    'Content-Disposition': `inline; filename="${BRAND}-voice-note.mp3"`,
    // A result's voice note never changes; a new roast gets a new id.
    'Cache-Control': 'public, max-age=31536000, immutable',
  };
  const range = byteRange(request.headers.get('range'), mp3.length);
  if (range === 'unsatisfiable') {
    return new Response(null, { status: 416, headers: { ...headers, 'Content-Range': `bytes */${mp3.length}` } });
  }
  if (!range) return new Response(mp3, { headers: { ...headers, 'Content-Length': String(mp3.length) } });
  return new Response(mp3.slice(range.start, range.end + 1), {
    status: 206,
    headers: {
      ...headers,
      'Content-Range': `bytes ${range.start}-${range.end}/${mp3.length}`,
      'Content-Length': String(range.end - range.start + 1),
    },
  });
}
