import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DemoButton } from "@/components/auth/demo-button";
import { PortfolioPieVisual } from "./portfolio-pie-visual";
import styles from "./marketing.module.css";

export function Hero() {
  return <section aria-labelledby="hero-title" className={styles.hero}>
    <div className={styles.container}>
      <h1 id="hero-title" className={styles.heroTitle}><span>Learn investing</span> <span>by doing.</span></h1>
      <p className={styles.heroCopy}>Interactive lessons, portfolio experiments and backtests —<br className={styles.desktopBreak} /> from your first stock to quantitative investing.</p>
      <div className={styles.heroActions}>
        <Link href="/sign-up" prefetch={false} className={`${styles.button} ${styles.primaryButton}`}>Start learning <ArrowRight aria-hidden="true" /></Link>
        <DemoButton compact className={styles.demo} buttonClassName={`${styles.button} ${styles.demoButton}`} />
      </div>
      <PortfolioPieVisual />
    </div>
  </section>;
}
