import { describe, expect, it } from 'vitest';
import { byteRange } from './range';

describe('byteRange', () => {
  it('reads start-end, open-ended and suffix ranges', () => {
    expect(byteRange('bytes=0-1', 100)).toEqual({ start: 0, end: 1 });
    expect(byteRange('bytes=40-', 100)).toEqual({ start: 40, end: 99 });
    expect(byteRange('bytes=90-500', 100)).toEqual({ start: 90, end: 99 });
    expect(byteRange('bytes=-10', 100)).toEqual({ start: 90, end: 99 });
  });

  it('sends the whole body when there is no range it handles', () => {
    expect(byteRange(null, 100)).toBeNull();
    expect(byteRange('bytes=0-1,5-9', 100)).toBeNull();
    expect(byteRange('items=0-1', 100)).toBeNull();
  });

  it('refuses ranges past the end', () => {
    expect(byteRange('bytes=100-', 100)).toBe('unsatisfiable');
    expect(byteRange('bytes=9-3', 100)).toBe('unsatisfiable');
  });
});
