import {
  ArrowLeft,
  ArrowRight,
  Building2,
  GraduationCap,
  Play,
  Share2,
  Wifi,
  Zap,
} from "lucide-react";
import { PortfolioShowcase } from "./portfolio-showcase";
import styles from "./marketing.module.css";

function LessonPhone() {
  return <div className={styles.lessonPhone} role="img" aria-label="Investi lesson screen explaining what a stock is">
    <div className={styles.phoneHardware} aria-hidden="true">
      <div className={styles.phoneScreen}>
        <div className={styles.phoneStatus}>
          <span className={styles.phoneTime}>9:41</span>
          <span className={styles.phoneIsland} />
          <span className={styles.phoneSystemStatus}>
            <span className={styles.phoneCellular}><i /><i /><i /><i /></span>
            <Wifi className={styles.phoneWifi} />
            <span className={styles.phoneBattery}><i /></span>
          </span>
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

    <PortfolioShowcase />
  </>;
}
