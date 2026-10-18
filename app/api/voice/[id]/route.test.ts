import { describe, expect, it } from 'vitest';
import { sampleAnalysis } from '@/lib/analyze';
import { saveAnalysis } from '@/lib/store';
import { GET } from './route';

const mp3 = new Uint8Array(Array.from({ length: 1000 }, (_, i) => i % 256));
saveAnalysis(
  sampleAnalysis('voiced', { mode: 'roast', app: 'Hinge', looking: 'A relationship', heat: 'genz', voice: true }),
  mp3,
);

function get(id: string, range?: string) {
  const request = new Request(`http://localhost/api/voice/${id}`, { headers: range ? { range } : {} });
  return GET(request, { params: Promise.resolve({ id }) });
}

describe('GET /api/voice/[id]', () => {
  it('serves the voice note as MP3', async () => {
    const res = await get('voiced');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('audio/mpeg');
    expect(res.headers.get('accept-ranges')).toBe('bytes');
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(mp3);
  });

  it('answers the byte ranges Safari asks for', async () => {
    const res = await get('voiced', 'bytes=0-1');
    expect(res.status).toBe(206);
    expect(res.headers.get('content-range')).toBe('bytes 0-1/1000');
    expect([...new Uint8Array(await res.arrayBuffer())]).toEqual([0, 1]);
    expect((await get('voiced', 'bytes=1000-')).status).toBe(416);
  });

  it('404s for results without a voice note', async () => {
    expect((await get('demo-roast')).status).toBe(404);
  });
});
