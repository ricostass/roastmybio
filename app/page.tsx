import { Landing } from '@/components/landing/Landing';

export default async function Home(props: PageProps<'/'>) {
  const { mode } = await props.searchParams;
  return <Landing initialMode={mode === 'roast' ? 'roast' : 'serious'} />;
}
