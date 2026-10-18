import type { Analysis } from './types';
import { sampleAnalysis } from './analyze';

// In-memory stand-in for a results database. Results live only as long as the
// server process; swap for a real store before running more than one instance.

const globalStore = globalThis as unknown as {
  __roastmybioResults?: Map<string, Analysis>;
  __roastmybioVoiceNotes?: Map<string, Uint8Array<ArrayBuffer>>;
};
const results = (globalStore.__roastmybioResults ??= new Map());
/** Voice-note MP3s, by result id. Kept apart so the bytes never reach the page props. */
const voiceNotes = (globalStore.__roastmybioVoiceNotes ??= new Map());

/** Fixed sample results, always available (used by the card gallery and for demos). */
export const DEMO_IDS = {
  serious: 'demo-serious',
  roastNoChill: 'demo-roast',
  roastGenZ: 'demo-roast-genz',
} as const;

function demo(id: string): Analysis | undefined {
  switch (id) {
    case DEMO_IDS.serious:
      return sampleAnalysis(id, { mode: 'serious', app: 'Hinge', looking: 'A relationship', heat: 'genz', voice: false });
    case DEMO_IDS.roastNoChill:
      return sampleAnalysis(id, { mode: 'roast', app: 'Hinge', looking: 'A relationship', heat: 'nochill', voice: true });
    case DEMO_IDS.roastGenZ:
      return sampleAnalysis(id, { mode: 'roast', app: 'Hinge', looking: 'A relationship', heat: 'genz', voice: true });
  }
}

export function saveAnalysis(analysis: Analysis, voiceNote?: Uint8Array<ArrayBuffer>) {
  results.set(analysis.id, analysis);
  if (voiceNote) voiceNotes.set(analysis.id, voiceNote);
}

export function getAnalysis(id: string): Analysis | undefined {
  return results.get(id) ?? demo(id);
}

export function getVoiceNote(id: string): Uint8Array<ArrayBuffer> | undefined {
  return voiceNotes.get(id);
}
