import Link from 'next/link';
import styles from './Wordmark.module.css';

export function Wordmark({ size = 24, href }: { size?: number; href?: string }) {
  const content = (
    <>
      ProfileCheck<span className={styles.dot}>.</span>
    </>
  );
  const style = { fontSize: size };
  return href ? (
    <Link href={href} className={styles.mark} style={style}>
      {content}
    </Link>
  ) : (
    <span className={styles.mark} style={style}>
      {content}
    </span>
  );
}
