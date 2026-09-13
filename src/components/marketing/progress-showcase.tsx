import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import styles from "./marketing.module.css";

const completedLessons = 6;
const availableLessons = 10;
const exampleXp = completedLessons * 60;
const exampleStreak = 4;

export function ProgressShowcase() {
  return <section aria-labelledby="progress-showcase-title" className={styles.progressShowcase}>
    <div className={`${styles.container} ${styles.progressShowcaseLayout}`}>
      <div className={styles.progressCopy}>
        <p className={styles.progressEyebrow}>PROGRESS</p>
        <h2 id="progress-showcase-title">Keep the streak.<span>See yourself grow.</span></h2>
        <p className={styles.progressDescription}>Small lessons add up. Keep your streak, earn XP and see your investing knowledge grow over time.</p>
        <Link href="/sign-up" prefetch={false} className={`${styles.button} ${styles.primaryButton} ${styles.progressCta}`}>Start learning <ArrowRight aria-hidden="true" /></Link>
      </div>

      <div className={styles.progressScene} data-testid="progress-showcase-demo">
        <p className={styles.progressPreviewLabel}>Illustrative progress preview</p>

        <div className={styles.progressStats}>
          <div className={`${styles.progressStat} ${styles.streakStat}`}>
            <Image src="/brand/flame-icon.webp" width={92} height={92} sizes="72px" alt="" aria-hidden="true" className={styles.progressStatImage} />
            <span><small>Current streak</small><strong>{exampleStreak} days</strong></span>
          </div>
          <div className={`${styles.progressStat} ${styles.xpStat}`}>
            <Image src="/brand/xp-star.webp" width={92} height={92} sizes="72px" alt="" aria-hidden="true" className={styles.progressStatImage} />
            <span><small>XP earned</small><strong>{exampleXp} XP</strong></span>
          </div>
        </div>

        <div className={styles.progressSurface}>
          <div className={styles.progressSurfaceHeader}>
            <span><small>Your progress</small><strong>Investing curriculum</strong></span>
            <b>{Math.round((completedLessons / availableLessons) * 100)}%</b>
          </div>
          <div className={styles.progressLessonCount}>
            <strong>{completedLessons} of {availableLessons} lessons completed</strong>
            <span>Progress is saved as you learn</span>
          </div>
          <progress className={styles.progressBar} max={availableLessons} value={completedLessons} aria-label={`${completedLessons} of ${availableLessons} lessons completed`}>{completedLessons} of {availableLessons} lessons completed</progress>
          <div className={styles.progressReward}>
            <span className={styles.rewardDot} aria-hidden="true" />
            <span><small>First completion reward</small><strong>+60 XP per lesson</strong></span>
          </div>
        </div>

        <div className={styles.progressObjects} aria-hidden="true">
          <span className={styles.progressObjectGlow} />
          <Image src="/brand/gold-icon.webp" width={260} height={260} sizes="(max-width: 520px) 150px, 220px" alt="" className={styles.progressTrophy} />
          <Image src="/brand/books-icon.webp" width={240} height={240} sizes="(max-width: 520px) 145px, 200px" alt="" className={styles.progressBooks} />
        </div>
      </div>
    </div>
  </section>;
}
