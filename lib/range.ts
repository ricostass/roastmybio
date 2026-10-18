/**
 * Parses a single-range `Range: bytes=…` header against a body of `size`
 * bytes. Returns the inclusive byte span, null to send the whole body (no
 * header, or one this doesn't handle), or 'unsatisfiable'.
 */
export function byteRange(header: string | null, size: number): { start: number; end: number } | null | 'unsatisfiable' {
  const m = header?.trim().match(/^bytes=(\d*)-(\d*)$/);
  if (!m || (!m[1] && !m[2])) return null;
  let start: number;
  let end: number;
  if (!m[1]) {
    // "bytes=-500": the last 500 bytes.
    start = Math.max(0, size - Number(m[2]));
    end = size - 1;
  } else {
    start = Number(m[1]);
    end = m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
  }
  if (start >= size || start > end) return 'unsatisfiable';
  return { start, end };
}
