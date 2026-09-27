import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Coins, GraduationCap, Landmark, TrendingUp } from "lucide-react";
import styles from "./marketing.module.css";

const allocations = [
  { id: "stocks", label: "Akcie", detail: "Potenciál růstu", value: 60, icon: TrendingUp, className: styles.stocksAllocation },
  { id: "bonds", label: "Dluhopisy", detail: "Stabilita a příjem", value: 30, icon: Landmark, className: styles.bondsAllocation },
  { id: "cash", label: "Hotovost", detail: "Flexibilita a bezpečí", value: 10, icon: Coins, className: styles.cashAllocation },
] as const;

const formatAllocation = (value: number) => `${value.toLocaleString("en-GB", { maximumFractionDigits: 1 })}%`;

export function PortfolioShowcase() {
  return <section aria-labelledby="portfolio-showcase-title" className={styles.portfolioShowcase}>
    <div className={`${styles.container} ${styles.portfolioShowcaseLayout}`}>
      <div className={styles.portfolioCopy}>
        <p className={styles.portfolioEyebrow}>PORTFOLIO LAB</p>
        <h2 id="portfolio-showcase-title">O diverzifikaci jen nečti. <span>Rozlož portfolio.</span></h2>
        <p className={styles.portfolioDescription}>Sestav portfolio, změň rozložení a sleduj, jak různé volby ovlivní výsledek.</p>
        <Link href="/lab/portfolio" prefetch={false} className={`${styles.button} ${styles.primaryButton} ${styles.portfolioCta}`}>Vyzkoušet Portfolio Lab <ArrowRight aria-hidden="true" /></Link>
      </div>

      <div className={styles.portfolioDemoStage}>
        <div className={styles.portfolioDemo} data-testid="portfolio-showcase-demo">
          <div className={styles.portfolioDemoHeader}>
            <div>
              <h3>Tvé portfolio</h3>
              <p>Ilustrační rozložení 60 / 30 / 10.</p>
            </div>
            <span className={styles.educationBadge}><GraduationCap aria-hidden="true" /> 100 % rozloženo · bezpečné experimentování</span>
          </div>

          <div className={styles.portfolioWorkspace}>
            <div className={styles.portfolioControls} role="img" aria-label="Rozložení portfolia: 60 % akcie, 30 % dluhopisy, 10 % hotovost.">
              {allocations.map(({ id, label, detail, value, icon: Icon, className }) => <div className={`${styles.allocationControl} ${className}`} key={id} aria-hidden="true">
                <span className={styles.allocationIcon}><Icon aria-hidden="true" /></span>
                <span className={styles.allocationLabel}>
                  <strong>{label}</strong>
                  <span>{detail}</span>
                </span>
                <span className={styles.allocationTrack}><i style={{ width: `${value}%` }} /><b style={{ left: `${value}%` }} /></span>
                <span className={styles.allocationValue}>{formatAllocation(value)}</span>
              </div>)}
            </div>

            <figure className={styles.portfolioPie}>
              <Image
                src="/brand/portfolio-pie.webp"
                width={1200}
                height={1200}
                sizes="(max-width: 640px) 280px, (max-width: 919px) 340px, (max-width: 1220px) 280px, 330px"
                alt="Třídílný koláčový graf portfolia v modré, zelené a neutrální barvě investi"
              />
              <figcaption>Zobrazené počáteční rozložení: 60 % akcie · 30 % dluhopisy · 10 % hotovost</figcaption>
            </figure>
          </div>

          <div className={styles.portfolioOutcomes}>
            <div className={styles.outcomeIntro}>
              <strong>Možné výsledky</strong>
              <span>Podle tvého současného rozložení</span>
            </div>
            <div className={styles.outcomeMetric}>
              <span>Očekávaný výnos</span>
              <strong>7,2 %</strong>
              <small>za modelový rok</small>
            </div>
            <div className={styles.outcomeMetric}>
              <span>Modelové rozpětí</span>
              <strong>−12 % až +28 %</strong>
              <small>ve dvou scénářích</small>
            </div>
            <p className={styles.portfolioDisclosure}>Ilustrační data pro učení. Nejde o prognózu ani doporučení.</p>
          </div>
        </div>
      </div>
    </div>
  </section>;
}
