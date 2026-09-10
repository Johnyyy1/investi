import { BookOpen, ChartNoAxesColumnIncreasing, Wrench } from "lucide-react";
import styles from "./marketing.module.css";

export function JourneyIntro() {
  return <section aria-labelledby="journey-title" className={styles.journey}>
    <div className={`${styles.container} ${styles.journeyLayout}`}>
      <div className={styles.journeyCopy}>
        <p className={styles.eyebrow}>LEARN · BUILD · BACKTEST · GROW</p>
        <h2 id="journey-title">From “what is a stock?” to building a backtest.</h2>
        <p className={styles.journeyDescription}>A complete learning journey that turns curiosity into confidence — with real tools, not just theory.</p>
        <div className={styles.copyUnderlineDoodle} aria-hidden="true">
          <svg width="108" height="10" viewBox="0 0 108 10" fill="none">
            <path d="M2 6C30 2 75 2 106 6" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>
      <div className={styles.journeyPanels}>
        <div className={styles.learnCardWrapper}>
          <svg className={styles.learnSparkleDoodle} width="16" height="14" viewBox="0 0 16 14" fill="none" aria-hidden="true">
            <path d="M3 12L7 2M9 12L13 2" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <article className={`${styles.panel} ${styles.learnPanel}`}>
            <span className={styles.panelIcon}><BookOpen aria-hidden="true" /></span>
            <div><h3>Learn</h3><p>Bite-sized, interactive lessons.</p></div>
          </article>
        </div>
        <article className={`${styles.panel} ${styles.buildPanel}`}>
          <span className={styles.panelIcon}><Wrench aria-hidden="true" /></span>
          <div><h3>Build</h3><p>Try ideas, build portfolios, see what happens.</p></div>
        </article>
        <div className={styles.backtestRow}>
          <article className={`${styles.panel} ${styles.backtestPanel}`}>
            <span className={styles.panelIcon}><ChartNoAxesColumnIncreasing aria-hidden="true" /></span>
            <div><h3>Backtest</h3><p>Test your ideas on educational demo data.</p></div>
          </article>
          <div className={styles.practiceNote} aria-hidden="true">
            <span>Practice today.</span>
            <span>Invest tomorrow.</span>
            <svg width="68" height="10" viewBox="0 0 68 10" fill="none">
              <path d="M2 6C20 2 48 2 66 7" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  </section>;
}
