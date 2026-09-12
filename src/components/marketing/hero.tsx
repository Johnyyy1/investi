import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DemoButton } from "@/components/auth/demo-button";
import styles from "./marketing.module.css";

export function Hero() {
  return <section aria-labelledby="hero-title" className={styles.hero}>
    <div className={`${styles.container} ${styles.heroLayout}`}>
      <div className={styles.heroContent}>
        <h1 id="hero-title" className={styles.heroTitle}><span>Learn investing</span> <span>by doing.</span></h1>
        <p className={styles.heroCopy}>Interactive lessons, portfolio experiments and backtests —<br className={styles.desktopBreak} /> from your first stock to quantitative investing.</p>
        <div className={styles.heroActions}>
          <Link href="/sign-up" prefetch={false} className={`${styles.button} ${styles.primaryButton}`}>Start learning <ArrowRight aria-hidden="true" /></Link>
          <DemoButton compact className={styles.demo} buttonClassName={`${styles.button} ${styles.demoButton}`} />
        </div>
      </div>
      <div className={styles.heroVisual} data-asset-state="ready" aria-hidden="true">
        <div className={`${styles.heroAnnotation} ${styles.heroAnnotationLeft}`}>
          <span>A smarter<br />you</span>
          <svg width="62" height="54" viewBox="0 0 62 54" fill="none">
            <path d="M4 4C7 27 24 39 52 41" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M43 34L54 41L45 49" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <Image
          src="/brand/mascot-hero.webp"
          width={1536}
          height={1024}
          sizes="(max-width: 919px) calc(100vw - 40px), (max-width: 1200px) 52vw, 710px"
          preload
          alt=""
          aria-hidden="true"
          className={styles.heroImage}
        />
        <div className={`${styles.heroAnnotation} ${styles.heroAnnotationRight}`}>
          <span>A brighter<br />tomorrow</span>
          <svg width="62" height="54" viewBox="0 0 62 54" fill="none">
            <path d="M58 4C55 27 38 39 10 41" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M19 34L8 41L17 49" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  </section>;
}
