import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Coins,
  GraduationCap,
  Landmark,
  Play,
  Share2,
  Zap,
} from "lucide-react";
import styles from "./marketing.module.css";

const allocations = [
  { label: "Stocks", value: 60, icon: Building2, className: styles.stocksAllocation },
  { label: "Bonds", value: 30, icon: Landmark, className: styles.bondsAllocation },
  { label: "Cash", value: 10, icon: Coins, className: styles.cashAllocation },
];

const chartBars = [24, 38, 54, 72, 86, 82, 66, 51, 36, 22];

function LessonPhone() {
  return <div className={styles.lessonPhone} role="img" aria-label="Investi lesson screen explaining what a stock is">
    <div className={styles.phoneHardware} aria-hidden="true">
      <div className={styles.phoneScreen}>
        <div className={styles.phoneStatus}>
          <span>9:41</span>
          <span className={styles.phoneIsland} />
          <span className={styles.phoneSignal}>● ▰</span>
        </div>
        <div className={styles.phoneAppBar}>
          <ArrowLeft />
          <span>Lesson 1 of 6</span>
          <Share2 />
        </div>
        <div className={styles.phoneScreenContent}>
          <p className={styles.phoneKicker}>Lesson 1 of 6</p>
          <h3>What is a stock?</h3>
          <p className={styles.phoneDefinition}>A stock represents a small ownership in a real company. When the company grows, your share can grow in value too.</p>
          <div className={styles.lessonVisual}>
            <div className={styles.lessonIllustration}>
              <span className={styles.lessonBuilding}><Building2 /></span>
              <span className={styles.lessonSlice}>
                <span className={styles.lessonFraction}>1 share</span>
                <strong>A slice of the company</strong>
              </span>
            </div>
            <span className={styles.lessonPlay}><Play fill="currentColor" /></span>
          </div>
          <div className={styles.lessonProgress}>
            <span><i /></span>
            <small>1 of 6</small>
          </div>
          <span className={styles.lessonNext}>Next lesson <ArrowRight /></span>
        </div>
      </div>
    </div>
  </div>;
}

function ProductFeature({ kind }: { kind: "learn" | "use" }) {
  const learn = kind === "learn";
  const Icon = learn ? GraduationCap : Zap;
  return <div className={`${styles.howFeature} ${learn ? styles.howFeatureLearn : styles.howFeatureUse}`}>
    <span className={styles.howFeatureIcon}><Icon aria-hidden="true" /></span>
    <h3>{learn ? "Learn in minutes" : "Actually use it"}</h3>
    <p>{learn
      ? "Clear, interactive lessons that make investing simple."
      : "Apply what you learn with real tools and market data."}</p>
  </div>;
}

function PortfolioDemo() {
  return <div
    className={styles.portfolioDemo}
    role="img"
    aria-label="Portfolio Lab example with 60 percent stocks, 30 percent bonds, 10 percent cash, 7.2 percent expected annual return, and a 5-year range from minus 12 percent to plus 28 percent"
  >
    <div className={styles.demoTopline} aria-hidden="true">
      <div>
        <span className={styles.demoMark}><span /><span /><span /></span>
        <div>
          <strong>Portfolio Lab</strong>
          <small>Explore the trade-offs</small>
        </div>
      </div>
      <span className={styles.demoStatus}>100% allocated</span>
    </div>
    <div className={styles.demoBody} aria-hidden="true">
      <div className={styles.allocationPanel}>
        <div className={styles.allocationHeading}>
          <div><strong>Build your mix</strong><small>Adjust the allocation</small></div>
          <span>100%</span>
        </div>
        <div className={styles.mixBar}>
          <span className={styles.mixStocks} />
          <span className={styles.mixBonds} />
          <span className={styles.mixCash} />
        </div>
        <div className={styles.allocationRows}>
          {allocations.map(({ label, value, icon: Icon, className }) => <div className={`${styles.allocationRow} ${className}`} key={label}>
            <span className={styles.allocationIcon}><Icon /></span>
            <span className={styles.allocationLabel}>{label}</span>
            <span className={styles.allocationTrack}><i style={{ width: `${value}%` }} /><b style={{ left: `${value}%` }} /></span>
            <strong>{value}%</strong>
          </div>)}
        </div>
      </div>
      <div className={styles.resultPanel}>
        <p>Expected annual return</p>
        <strong className={styles.returnValue}>7.2%</strong>
        <div className={styles.returnChart}>
          {chartBars.map((height, index) => <span key={index} style={{ height: `${height}%` }} className={index > 3 && index < 7 ? styles.returnBarActive : undefined} />)}
        </div>
        <div className={styles.rangeResult}>
          <span>5-year range</span>
          <strong>-12% <i>to</i> +28%</strong>
        </div>
        <small>Illustrative scenario</small>
      </div>
    </div>
  </div>;
}

export function ProductShowcases() {
  return <>
    <section aria-labelledby="how-it-works-title" className={styles.howWorks}>
      <h2 id="how-it-works-title" className={styles.howWorksTitle}>How does Investi work?</h2>
      <div className={`${styles.container} ${styles.howWorksGrid}`}>
        <div className={styles.phoneStage}><LessonPhone /></div>
        <ProductFeature kind="learn" />
        <ProductFeature kind="use" />
      </div>
    </section>

    <section aria-labelledby="portfolio-showcase-title" className={styles.portfolioShowcase}>
      <div className={`${styles.container} ${styles.portfolioShowcaseLayout}`}>
        <div className={styles.portfolioCopy}>
          <p className={styles.portfolioEyebrow}>PORTFOLIO LAB</p>
          <h2 id="portfolio-showcase-title">Don’t just read about diversification. <span>Break a portfolio.</span></h2>
          <p className={styles.portfolioDescription}>Build a portfolio, try different allocations and see how they perform in different market scenarios.</p>
          <Link href="/lab/portfolio" prefetch={false} className={`${styles.button} ${styles.primaryButton} ${styles.portfolioCta}`}>Try the Portfolio Lab <ArrowRight aria-hidden="true" /></Link>
        </div>
        <div className={styles.portfolioDemoStage}><PortfolioDemo /></div>
      </div>
    </section>
  </>;
}
