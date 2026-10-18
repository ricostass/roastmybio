import { describe, expect, it } from 'vitest';
import { resolveTemplate } from '@/components/cards/registry';
import { sampleAnalysis } from './analyze';
import { buildCard, cardImageUrl, currentCaptionWord, splitLastSentence } from './cards';
import { meterBlocks } from './format';

const roast = sampleAnalysis('t', { mode: 'roast', app: 'Hinge', looking: 'A relationship', heat: 'nochill', voice: true });
const serious = sampleAnalysis('s', { mode: 'serious', app: 'Hinge', looking: 'A relationship', heat: 'genz', voice: false });

describe('buildCard', () => {
  it('builds a verdict card from the roast', () => {
    const card = buildCard(roast, { kind: 'verdict', format: '1:1' });
    expect(card).toMatchObject({ kind: 'verdict', heat: 'nochill', cringe: 8.4, format: '1:1' });
    expect(card?.verdict).toEqual({ setup: 'Not a red flag.', punchline: 'A beige one.' });
  });

  it('freezes line cards at the voice note\'s still frame', () => {
    const card = buildCard(roast, { kind: 'line', line: 1, format: '9:16' });
    expect(card?.line?.target).toBe('PROMPT 2');
    expect(card?.voice).toEqual({ elapsedSec: 31, durationSec: 52 });
  });

  it('returns null without a roast or for a missing line', () => {
    expect(buildCard(serious, { kind: 'verdict', format: '9:16' })).toBeNull();
    expect(buildCard(roast, { kind: 'line', line: 9, format: '9:16' })).toBeNull();
  });
});

describe('resolveTemplate', () => {
  it('falls back to The Verdict for formats a direction does not have', () => {
    expect(resolveTemplate('receipt', { format: '9:16', kind: 'verdict' }).id).toBe('receipt');
    expect(resolveTemplate('receipt', { format: '1:1', kind: 'verdict' }).id).toBe('verdict');
    expect(resolveTemplate('nonsense', { format: '9:16', kind: 'line' }).id).toBe('verdict');
  });
});

describe('card helpers', () => {
  it('builds image URLs', () => {
    expect(cardImageUrl('abc', { kind: 'line', line: 2, format: '4:5', template: 'poster' })).toBe(
      '/api/card/abc?kind=line&format=4%3A5&line=2&t=poster',
    );
  });

  it('splits off the last sentence for the accent', () => {
    expect(splitLastSentence("The bad news: that's not loyalty. That's market conditions.")).toEqual([
      "The bad news: that's not loyalty.",
      "That's market conditions.",
    ]);
    expect(splitLastSentence('One sentence only.')).toEqual(['', 'One sentence only.']);
  });

  it('picks the spoken caption word', () => {
    expect(currentCaptionWord(['Not', 'a', 'red', 'flag.', 'A', 'beige', 'one.'], 'verdict')).toBe(5);
    expect(currentCaptionWord(['Holding', 'that', 'fish.', 'Only'], 'line')).toBe(2);
  });

  it('fills meter blocks in proportion', () => {
    expect(meterBlocks(8.4)).toBe(7);
    expect(meterBlocks(0)).toBe(0);
    expect(meterBlocks(10)).toBe(8);
  });
});
