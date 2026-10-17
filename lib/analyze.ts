import { SAMPLE_ROAST, SAMPLE_SERIOUS } from './sample';
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

/**
 * Reviews a profile from its screenshots.
 *
 * The model-backed analysis isn't wired up yet: this returns the handoff's
 * sample result so the full flow can be exercised end to end. Screenshots are
 * not stored anywhere — they're dropped once this returns.
 */
export async function analyzeProfile(input: AnalyzeInput, screenshots: File[]): Promise<Analysis> {
  void screenshots;
  return sampleAnalysis(newId(), input);
}
