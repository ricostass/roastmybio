import type { Analysis } from './types';
import { sampleAnalysis } from './analyze';

// In-memory stand-in for a results database. Results live only as long as the
// server process; swap for a real store before running more than one instance.

const globalStore = globalThis as unknown as { __roastmybioResults?: Map<string, Analysis> };
const results = (globalStore.__roastmybioResults ??= new Map());

/** Fixed sample results, always available (used by the card gallery and for demos). */
export const DEMO_IDS = {
  serious: 'demo-serious',
  roastNoChill: 'demo-roast',
  roastEasy: 'demo-roast-easy',
} as const;

function demo(id: string): Analysis | undefined {
  switch (id) {
    case DEMO_IDS.serious:
      return sampleAnalysis(id, { mode: 'serious', app: 'Hinge', looking: 'A relationship', heat: 'easy', voice: false });
    case DEMO_IDS.roastNoChill:
      return sampleAnalysis(id, { mode: 'roast', app: 'Hinge', looking: 'A relationship', heat: 'nochill', voice: true });
    case DEMO_IDS.roastEasy:
      return sampleAnalysis(id, { mode: 'roast', app: 'Hinge', looking: 'A relationship', heat: 'easy', voice: true });
  }
}

export function saveAnalysis(analysis: Analysis) {
  results.set(analysis.id, analysis);
}

export function getAnalysis(id: string): Analysis | undefined {
  return results.get(id) ?? demo(id);
}
