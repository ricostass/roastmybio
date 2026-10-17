import { score } from '@/lib/format';
import type { SeriousReview } from '@/lib/types';
import s from './result.module.css';

const SUB_LABELS = [
  ['photos', 'Photos'],
  ['prompts', 'Prompts'],
  ['bio', 'Bio'],
] as const;

/** Photos / Prompts / Bio bars. `variant="hero"` is the landing sample's spacing. */
export function SubScores({ sub, variant }: { sub: SeriousReview['sub']; variant?: 'hero' }) {
  return (
    <div className={variant === 'hero' ? `${s.subs} ${s.subsHero}` : s.subs}>
      {SUB_LABELS.map(([key, label]) => (
        <div key={key}>
          <div className={s.subHead}>
            <span>{label}</span>
            <span className={s.mono}>{score(sub[key])}</span>
          </div>
          <div className={s.track} role="img" aria-label={`${label} ${score(sub[key])} out of 10`}>
            <div style={{ width: `${sub[key] * 10}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ScoreBlock({ review }: { review: SeriousReview }) {
  return (
    <div className={s.scoreBlock}>
      <div className={s.overall}>
        <span>{score(review.overall)}</span>
        <span className={s.outOf}>/10</span>
      </div>
      <SubScores sub={review.sub} />
      <p className={s.summary}>{review.summary}</p>
    </div>
  );
}
