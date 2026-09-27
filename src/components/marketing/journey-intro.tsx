import Link from "next/link";
import { ArrowRight, BarChart3, BookOpen, ChartSpline } from "lucide-react";
import styles from "./marketing.module.css";

const steps = [
  {
    title: "Uč se",
    description: "Krátké interaktivní lekce, díky kterým investování dává smysl.",
    href: "/learn",
    icon: BookOpen,
    className: styles.learnPanel,
  },
  {
    title: "Sestavuj",
    description: "Vyzkoušej nápady v bezrizikovém portfoliu a sleduj dopad rozložení.",
    href: "/lab/portfolio",
    icon: BarChart3,
    className: styles.buildPanel,
  },
  {
    title: "Backtestuj",
    description: "Otestuj strategii na minulosti a zjisti, jak by se chovala.",
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
          <p className={styles.eyebrow}>JASNĚJŠÍ CESTA VPŘED</p>
          <h2 id="journey-title">Uč se. Sestavuj. Backtestuj.</h2>
          <p className={styles.journeyDescription}>Od zvědavosti k jistotě díky učení navrženému pro skutečný život.</p>
          <Link href="/learn" prefetch={false} className={styles.journeyCta}>Prozkoumat cestu <ArrowRight aria-hidden="true" /></Link>
        </div>
        <div className={styles.journeyCardsScene}>
          <div className={styles.journeyPanels}>
            {steps.map(({ title, description, href, icon: Icon, className }, index) => <div key={title} className={`${styles.cardStage} ${styles[`cardStage${index + 1}`]}`}>
              <div className={styles.cardFloat}>
                <article className={`${styles.panel} ${className}`}>
                  <span className={styles.panelIcon}><Icon aria-hidden="true" /></span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                  <Link href={href} prefetch={false} className={styles.panelArrow} aria-label={`Prozkoumat: ${title}`}><ArrowRight aria-hidden="true" /></Link>
                </article>
              </div>
            </div>)}
          </div>
        </div>
      </div>
    </div>
  </section>;
}
