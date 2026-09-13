import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DemoButton } from "@/components/auth/demo-button";
import styles from "./marketing.module.css";

export function FinalCta() {
  return <section aria-labelledby="final-cta-title" className={styles.finalCtaSection} data-testid="final-cta">
    <div className={styles.container}>
      <div className={styles.finalCtaCard}>
        <div className={styles.finalCtaContent}>
          <p className={styles.finalCtaEyebrow}>Final step</p>
          <h2 id="final-cta-title">Ready to start learning by doing?</h2>
          <p className={styles.finalCtaDescription}>Build real investing intuition through interactive lessons, portfolio experiments and backtests — one small step at a time.</p>
          <div className={styles.finalCtaActions}>
            <Link href="/sign-up" prefetch={false} className={`${styles.button} ${styles.primaryButton} ${styles.finalCtaButton}`}>
              Start learning <ArrowRight aria-hidden="true" />
            </Link>
            <DemoButton compact className={styles.finalCtaDemo} buttonClassName={`${styles.button} ${styles.demoButton} ${styles.finalCtaButton}`} />
          </div>
        </div>

        <div className={styles.finalCtaScene} aria-hidden="true" data-testid="final-cta-scene">
          <span className={styles.finalCtaSceneGlow} />
          <Image
            src="/brand/clouds.webp"
            width={1448}
            height={1086}
            sizes="(max-width: 919px) calc(100vw - 64px), 580px"
            alt=""
            className={styles.finalCtaClouds}
          />
          <Image
            src="/brand/hill.webp"
            width={1254}
            height={1254}
            sizes="(max-width: 919px) calc(100vw - 64px), 610px"
            alt=""
            className={styles.finalCtaHill}
          />
        </div>
      </div>
    </div>
  </section>;
}
