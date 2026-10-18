import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { RoastResult } from '@/components/result/RoastResult';
import { SeriousResult } from '@/components/result/SeriousResult';
import { getAnalysis } from '@/lib/store';

export const metadata: Metadata = {
  title: 'Your result — roastmybio',
  robots: { index: false },
};

export default async function ResultPage(props: PageProps<'/result/[id]'>) {
  const { id } = await props.params;
  const { view } = await props.searchParams;
  const analysis = getAnalysis(id);
  if (!analysis) notFound();
  // Roast results also carry the serious review ("Read the full serious review").
  if (analysis.roast && view !== 'serious') return <RoastResult analysis={analysis} />;
  return <SeriousResult analysis={analysis} />;
}
