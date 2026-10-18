import { toModelImage } from './images';
import { ReviewError, reviewConfigured, reviewScreenshots, roastProfile } from './review';
import { SAMPLE_ROAST, SAMPLE_SERIOUS } from './sample';
import { toRoast, toSeriousReview } from './scoring';
import type { Analysis, DatingApp, Heat, Looking, Mode } from './types';

export interface AnalyzeInput {
  mode: Mode;
  app: DatingApp;
  looking: Looking;
  heat: Heat;
  voice: boolean;
}

export function newId() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 12);
}

export function sampleAnalysis(id: string, input: AnalyzeInput): Analysis {
  return {
    id,
    createdAt: new Date().toISOString(),
    mode: input.mode,
    app: input.app,
    looking: input.looking,
    voice: input.voice,
    meta: { photos: 6, prompts: 3 },
    serious: SAMPLE_SERIOUS,
    roast: input.mode === 'roast' ? SAMPLE_ROAST[input.heat] : undefined,
  };
}

/** Without model credentials, development falls back to the sample; production refuses. */
function sampleOrRefuse(input: AnalyzeInput): Analysis {
  if (process.env.NODE_ENV === 'production') {
    throw new ReviewError("Profile checks aren't switched on yet. Try again later.", 503);
  }
  return { ...sampleAnalysis(newId(), input), demo: true };
}

/**
 * Reviews a profile from its screenshots. Everything the result pages show,
 * free preview and unlocked review alike, comes from this one stored result,
 * so the score someone sees before paying is the score they get after.
 * Screenshots are not stored; only what was read off them is kept.
 */
export async function analyzeProfile(input: AnalyzeInput, screenshots: File[]): Promise<Analysis> {
  if (!reviewConfigured()) return sampleOrRefuse(input);
  const images = await Promise.all(screenshots.map(toModelImage));
  const { profile, review, roast } = await reviewScreenshots(images, input);
  return {
    id: newId(),
    createdAt: new Date().toISOString(),
    mode: input.mode,
    app: input.app,
    looking: input.looking,
    voice: input.voice,
    meta: { photos: profile.photos.length, prompts: profile.prompts.length },
    serious: toSeriousReview(review, profile, SAMPLE_SERIOUS.trend),
    roast: roast ? toRoast(input.heat, roast) : undefined,
    profile,
  };
}

/** "Too much? Go easy on me": the same review with the roast re-run at the lower heat. */
export async function softenRoast(original: Analysis): Promise<Analysis> {
  const easy = { mode: 'roast' as const, app: original.app, looking: original.looking, heat: 'easy' as const, voice: original.voice };
  const roast =
    original.profile && reviewConfigured() ? toRoast('easy', await roastProfile(original.profile, easy)) : SAMPLE_ROAST.easy;
  return { ...original, id: newId(), createdAt: new Date().toISOString(), roast };
}
