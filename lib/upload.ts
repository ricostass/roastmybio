import { DATING_APPS, LOOKING_OPTIONS, type DatingApp, type Heat, type Looking, type Mode } from './types';

export const MAX_SCREENSHOTS = 9;
export const MAX_SCREENSHOT_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_TYPES = ['image/png', 'image/jpeg'];

export interface ScreenshotLike {
  name: string;
  type: string;
  size: number;
}

/** Returns a user-facing error, or null when the set of screenshots is acceptable. */
export function validateScreenshots(files: readonly ScreenshotLike[]): string | null {
  if (files.length === 0) return 'Add at least one screenshot.';
  if (files.length > MAX_SCREENSHOTS) return `Up to ${MAX_SCREENSHOTS} screenshots — you added ${files.length}.`;
  const wrongType = files.find((f) => !ACCEPTED_TYPES.includes(f.type));
  if (wrongType) return `${wrongType.name} isn't a PNG or JPG.`;
  const tooBig = files.find((f) => f.size > MAX_SCREENSHOT_BYTES);
  if (tooBig) return `${tooBig.name} is over 10 MB.`;
  return null;
}

export interface CheckOptions {
  mode: Mode;
  app: DatingApp;
  looking: Looking;
  heat: Heat;
  voice: boolean;
  /** "I'm 18+ and this is my own profile" — required for No chill. */
  adult: boolean;
}

/** Parses and validates the non-file fields of an upload. */
export function parseCheckOptions(get: (key: string) => string | null): CheckOptions | string {
  const mode = get('mode');
  const app = get('app');
  const looking = get('looking');
  const heat = get('heat') ?? 'genz';
  if (mode !== 'serious' && mode !== 'roast') return 'Unknown mode.';
  if (!DATING_APPS.includes(app as DatingApp)) return 'Pick which app.';
  if (!LOOKING_OPTIONS.includes(looking as Looking)) return "Pick what you're looking for.";
  if (heat !== 'genz' && heat !== 'nochill') return 'Unknown roaster.';
  const adult = get('adult') === 'true';
  if (mode === 'roast' && heat === 'nochill' && !adult) {
    return 'No chill is 18+ only. Confirm you are 18+ and this is your own profile.';
  }
  return { mode, app: app as DatingApp, looking: looking as Looking, heat, voice: get('voice') === 'true', adult };
}
