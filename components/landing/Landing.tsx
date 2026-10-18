'use client';

import { useState } from 'react';
import { Wordmark } from '@/components/Wordmark';
import type { Mode } from '@/lib/types';
import { HeroSample } from './HeroSample';
import { UploadForm } from './UploadForm';
import s from './landing.module.css';

export function Landing({ initialMode = 'roast' }: { initialMode?: Mode }) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const roast = mode === 'roast';

  return (
    <div className="theme" data-mode={mode}>
      <header className={s.header}>
        <Wordmark href="/" />
        <nav className={s.nav} aria-label="Sections">
          <a href="#how">How it works</a>
          <a href="#modes">Modes</a>
          <a href="#pricing">Pricing</a>
        </nav>
        <a href="#upload" className={s.headerCta}>
          Check my profile
        </a>
      </header>

      <main>
        <section className={s.hero}>
          <div className={s.heroCopy}>
            <div className={s.toggle} role="group" aria-label="How do you want to hear it?">
              <button type="button" aria-pressed={roast} onClick={() => setMode('roast')}>
                Roast
              </button>
              <button type="button" aria-pressed={!roast} onClick={() => setMode('serious')}>
                Serious
              </button>
            </div>
            {roast ? (
              <>
                <h1 className={s.h1}>
                  Your profile, roasted. <span className={s.accent}>No mercy.</span>
                </h1>
                <p className={s.sub}>
                  A voice note that goes through your photos, prompts and bio one by one. It always ends with the real fixes.
                </p>
              </>
            ) : (
              <>
                <h1 className={s.h1}>
                  Find out why your matches <span className={s.accent}>go quiet.</span>
                </h1>
                <p className={s.sub}>
                  Upload your profile screenshots. Every photo, prompt and bio line gets scored, and every fix comes with a cited
                  source.
                </p>
              </>
            )}
            <div className={s.heroActions}>
              <a href="#upload" className={s.primaryCta}>
                Check my profile
              </a>
              <span className={s.micro}>Free to start · screenshots deleted after analysis</span>
            </div>
          </div>
          <div className={s.heroSample}>
            <HeroSample mode={mode} />
          </div>
        </section>

        <section id="upload" className={s.section}>
          <UploadForm mode={mode} />
        </section>

        <section id="how" className={s.section}>
          <h2 className={s.h2}>How it works</h2>
          <ol className={s.steps}>
            <li>
              <div className={s.stepNo}>01</div>
              <div className={s.stepTitle}>Upload screenshots</div>
              <div className={s.stepBody}>Up to nine, from any app. Tell us what you&apos;re looking for.</div>
            </li>
            <li>
              <div className={s.stepNo}>02</div>
              <div className={s.stepTitle}>Pick how you want to hear it</div>
              <div className={s.stepBody}>Serious, with sources. Or roasted, as a voice note. Same analysis.</div>
            </li>
            <li>
              <div className={s.stepNo}>03</div>
              <div className={s.stepTitle}>Fix it and re-check</div>
              <div className={s.stepBody}>Reorder photos, rewrite prompts, run it again.</div>
            </li>
          </ol>
        </section>

        <section id="modes" className={s.section}>
          <h2 className={s.h2}>Two ways to hear it</h2>
          <div className={s.modeCards}>
            <div className={`${s.modeCard} ${s.modeSerious}`}>
              <div className={s.modeLabel}>SERIOUS</div>
              <div className={s.modeTitle}>Scored, sourced, fixable.</div>
              <ul className={s.modeList}>
                <li>Score out of 10, plus Photos / Prompts / Bio</li>
                <li>Top 3 fixes, each with an evidence tag and source</li>
                <li>Suggested photo order</li>
                <li>Prompt rewrites with a one-line why</li>
              </ul>
              <button type="button" className={s.modeButton} onClick={() => setMode('serious')}>
                Preview serious mode
              </button>
            </div>
            <div className={`${s.modeCard} ${s.modeRoast}`}>
              <div className={s.modeLabel}>ROAST</div>
              <div className={s.modeTitle}>Comedy. Then the real fixes.</div>
              <ul className={s.modeList}>
                <li>Voice note, line by line through your profile</li>
                <li>Two heat levels: Go easy · No chill (18+)</li>
                <li>Verdict and Cringe-o-meter on a shareable card</li>
                <li>Jokes target what you posted, never your looks</li>
              </ul>
              <button type="button" className={s.modeButton} onClick={() => setMode('roast')}>
                Preview roast mode
              </button>
            </div>
          </div>
        </section>

        <section id="pricing" className={s.section}>
          <h2 className={s.h2} style={{ marginBottom: 12 }}>
            Pricing
          </h2>
          <p className={s.pricingIntro}>Upload and see your overall score and verdict for free. Pay to unlock the rest.</p>
          <div className={s.prices}>
            <div className={s.price}>
              <div className={s.priceName}>Quick check</div>
              <div className={s.priceAmount}>[PRICE]</div>
              <div className={s.priceBody}>Overall score and the single biggest fix, with its source.</div>
              <a href="#upload" className={s.priceButton}>
                Get a quick check
              </a>
            </div>
            <div className={`${s.price} ${s.priceFeatured}`}>
              <div className={s.priceHead}>
                <div className={s.priceName}>Full review</div>
                <span className={s.popular}>MOST POPULAR</span>
              </div>
              <div className={s.priceAmount}>[PRICE]</div>
              <div className={s.priceBody}>
                Everything: all fixes with sources, photo order, prompt rewrites, both modes, and one re-check after your changes.
              </div>
              <a href="#upload" className={s.priceButton}>
                Get the full review
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className={s.footer}>
        <div className={s.footerInner}>
          <Wordmark size={18} />
          <nav className={s.footerNav} aria-label="Legal">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Sources &amp; methodology</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
