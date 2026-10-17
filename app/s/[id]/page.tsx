import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cardImageUrl } from '@/lib/cards';
import { getAnalysis } from '@/lib/store';
import s from './share.module.css';

// Public page behind a shared roast card. Server-rendered so link previews
// pick up the card as the og:image.

export async function generateMetadata(props: PageProps<'/s/[id]'>): Promise<Metadata> {
  const { id } = await props.params;
  const roast = getAnalysis(id)?.roast;
  if (!roast) return {};
  const title = `${roast.verdict.setup} ${roast.verdict.punchline}`;
  const image = cardImageUrl(id, { kind: 'verdict', format: '1:1' });
  return {
    title: `${title} — roastmybio`,
    description: 'An AI roasted my dating profile.',
    openGraph: { title, description: 'An AI roasted my dating profile.', images: [{ url: image, width: 1080, height: 1080 }] },
    twitter: { card: 'summary_large_image', title, images: [image] },
  };
}

export default async function SharePage(props: PageProps<'/s/[id]'>) {
  const { id } = await props.params;
  const roast = getAnalysis(id)?.roast;
  if (!roast) notFound();
  return (
    <div className="theme" data-mode="roast">
      <main className={s.page}>
        <Image
          className={s.card}
          src={cardImageUrl(id, { kind: 'verdict', format: '4:5' })}
          alt={`Roast card: ${roast.verdict.setup} ${roast.verdict.punchline} Cringe ${roast.cringe} out of 10.`}
          width={1080}
          height={1350}
          unoptimized
          priority
        />
        <Link className={s.cta} href="/?mode=roast#upload">
          Roast mine →
        </Link>
        <p className={s.fine}>Jokes target what people post, never their looks.</p>
      </main>
    </div>
  );
}
