import { waveform } from '@/lib/format';

/** Voice-note waveform; bars before `progress` (0–1) are lit in the accent. */
export function Waveform({ progress, bars = 40, seed = 2, height = 48, min = 20 }: {
  progress: number;
  bars?: number;
  seed?: number;
  height?: number;
  min?: number;
}) {
  return (
    <div aria-hidden="true" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 3, height }}>
      {waveform(bars, seed, min).map((h, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            borderRadius: 2,
            height: `${h}%`,
            background: i / bars < progress ? 'var(--ac)' : 'var(--rest)',
            transition: 'background-color .15s',
          }}
        />
      ))}
    </div>
  );
}
