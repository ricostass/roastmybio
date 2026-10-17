import { readFile } from 'node:fs/promises';
import path from 'node:path';

// Static font instances for Satori (it can't read variable fonts or woff2).
const FILES = [
  { name: 'Bricolage Grotesque', weight: 600, file: 'BricolageGrotesque-600.woff' },
  { name: 'Bricolage Grotesque', weight: 800, file: 'BricolageGrotesque-800.woff' },
  { name: 'Instrument Sans', weight: 500, file: 'InstrumentSans-500.woff' },
  { name: 'Instrument Sans', weight: 600, file: 'InstrumentSans-600.woff' },
  { name: 'Instrument Sans', weight: 700, file: 'InstrumentSans-700.woff' },
  { name: 'JetBrains Mono', weight: 500, file: 'JetBrainsMono-500.woff' },
  { name: 'JetBrains Mono', weight: 700, file: 'JetBrainsMono-700.woff' },
] as const;

type Weight = (typeof FILES)[number]['weight'];
export interface SatoriFont {
  name: string;
  data: Buffer;
  weight: Weight;
  style: 'normal';
}

let cached: Promise<SatoriFont[]> | undefined;

export function loadCardFonts(): Promise<SatoriFont[]> {
  cached ??= Promise.all(
    FILES.map(async (f) => ({
      name: f.name,
      weight: f.weight,
      style: 'normal' as const,
      data: await readFile(path.join(process.cwd(), 'assets', 'fonts', f.file)),
    })),
  );
  return cached;
}
