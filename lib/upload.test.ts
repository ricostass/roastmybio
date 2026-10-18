import { describe, expect, it } from 'vitest';
import { parseCheckOptions, validateScreenshots } from './upload';

const png = (name = 'a.png', size = 1000) => ({ name, type: 'image/png', size });

describe('validateScreenshots', () => {
  it('accepts 1–9 PNG/JPG files', () => {
    expect(validateScreenshots([png(), { name: 'b.jpg', type: 'image/jpeg', size: 5 }])).toBeNull();
    expect(validateScreenshots(Array.from({ length: 9 }, () => png()))).toBeNull();
  });

  it('rejects none, too many, wrong type and oversized files', () => {
    expect(validateScreenshots([])).toMatch(/at least one/);
    expect(validateScreenshots(Array.from({ length: 10 }, () => png()))).toMatch(/Up to 9/);
    expect(validateScreenshots([{ name: 'x.gif', type: 'image/gif', size: 1 }])).toMatch(/x.gif/);
    expect(validateScreenshots([png('big.png', 11 * 1024 * 1024)])).toMatch(/big.png/);
  });
});

describe('parseCheckOptions', () => {
  const form = (values: Record<string, string>) => (key: string) => values[key] ?? null;
  const base = { mode: 'roast', app: 'Hinge', looking: 'A relationship' };

  it('parses a valid roast request', () => {
    expect(parseCheckOptions(form({ ...base, heat: 'genz', voice: 'true' }))).toEqual({
      mode: 'roast',
      app: 'Hinge',
      looking: 'A relationship',
      heat: 'genz',
      voice: true,
      adult: false,
    });
  });

  it('requires the 18+ confirmation for No chill', () => {
    expect(parseCheckOptions(form({ ...base, heat: 'nochill' }))).toMatch(/18\+/);
    expect(parseCheckOptions(form({ ...base, heat: 'nochill', adult: 'true' }))).toMatchObject({ heat: 'nochill' });
  });

  it('rejects unknown values', () => {
    expect(parseCheckOptions(form({ ...base, mode: 'spicy' }))).toBe('Unknown mode.');
    expect(parseCheckOptions(form({ ...base, app: 'Grindr' }))).toBe('Pick which app.');
    expect(parseCheckOptions(form({ ...base, heat: 'lava' }))).toBe('Unknown roaster.');
  });
});
