import Link from "next/link";
import { ArrowRight, BarChart3, BookOpen, ChartSpline } from "lucide-react";
import styles from "./marketing.module.css";

const steps = [
  {
    title: "Learn",
    description: "Interactive, bite-sized lessons that make investing click.",
    href: "/learn",
    icon: BookOpen,
    className: styles.learnPanel,
  },
  {
    title: "Build",
    description: "Try ideas in a risk-free portfolio with real market data.",
    href: "/lab/portfolio",
    icon: BarChart3,
    className: styles.buildPanel,
  },
  {
    title: "Backtest",
    description: "Test your strategy against the past to see what works.",
    href: "/lab/backtesting",
    icon: ChartSpline,
    className: styles.backtestPanel,
  },
];

export function JourneyIntro() {
  return <section aria-labelledby="journey-title" className={styles.journey}>
    <div className={styles.journeyShell}>
      <span className={`${styles.journeyGlow} ${styles.journeyGlowOne}`} aria-hidden="true" />
      <span className={`${styles.journeyGlow} ${styles.journeyGlowTwo}`} aria-hidden="true" />
      <div className={`${styles.container} ${styles.journeyLayout}`}>
        <div className={styles.journeyCopy}>
          <p className={styles.eyebrow}>A CLEARER PATH FORWARD</p>
          <h2 id="journey-title">Learn. Build. Backtest.</h2>
          <p className={styles.journeyDescription}>Go from curious to confident with a learning experience designed for real life.</p>
          <Link href="/learn" prefetch={false} className={styles.journeyCta}>Explore the experience <ArrowRight aria-hidden="true" /></Link>
        </div>
        <div className={styles.journeyCardsScene}>
          <div className={styles.journeyPanels}>
            {steps.map(({ title, description, href, icon: Icon, className }, index) => <div key={title} className={`${styles.cardStage} ${styles[`cardStage${index + 1}`]}`}>
              <div className={styles.cardFloat}>
                <article className={`${styles.panel} ${className}`}>
                  <span className={styles.panelIcon}><Icon aria-hidden="true" /></span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                  <Link href={href} prefetch={false} className={styles.panelArrow} aria-label={`Explore ${title}`}><ArrowRight aria-hidden="true" /></Link>
                </article>
              </div>
            </div>)}
          </div>
        </div>
      </div>
    </div>
  </section>;
}
