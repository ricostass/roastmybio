export const BRAND = 'roastmybio';

/**
 * The link printed on share cards: the site's host from NEXT_PUBLIC_SITE_URL,
 * or just the name when running locally.
 */
export const BRAND_HOST = (() => {
  try {
    const host = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? '').hostname.replace(/^www\./, '');
    return host && host !== 'localhost' && !/^[\d.]+$/.test(host) ? host : BRAND;
  } catch {
    return BRAND;
  }
})();
