import { describe, expect, it } from 'vitest';
import { fitLines, fitWrapped, measure, wrapCount } from './fit';

describe('text fitting', () => {
  it('keeps the designed size when copy fits', () => {
    expect(fitLines(['In 2019.'], 'display800', 164, 912, -0.045)).toBe(164);
  });

  it('shrinks a line that would overflow', () => {
    const size = fitLines(['Your profile reads like a LinkedIn summary.'], 'display800', 164, 912, -0.045);
    expect(size).toBeLessThan(164);
    expect(measure('Your profile reads like a LinkedIn summary.', 'display800', size, -0.045)).toBeLessThanOrEqual(912);
  });

  it('wraps and fits long text into a box', () => {
    const long = 'word '.repeat(80).trim();
    const size = fitWrapped([long], 'display600', 110, { width: 912, height: 900 }, 1.02, -0.035);
    expect(size).toBeLessThan(110);
    expect(wrapCount(long, 'display600', size, 912, -0.035) * size * 1.02).toBeLessThanOrEqual(900);
  });
});
