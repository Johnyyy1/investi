"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { ArrowRight, Coins, GraduationCap, Landmark, TrendingUp } from "lucide-react";
import { rebalanceAllocation } from "@/features/lab/portfolio";
import { getPortfolioShowcaseOutcome } from "./portfolio-showcase-model";
import styles from "./marketing.module.css";

const allocations = [
  { id: "stocks", label: "Stocks", detail: "Growth potential", icon: TrendingUp, className: styles.stocksAllocation },
  { id: "bonds", label: "Bonds", detail: "Stability & income", icon: Landmark, className: styles.bondsAllocation },
  { id: "cash", label: "Cash", detail: "Flexibility & safety", icon: Coins, className: styles.cashAllocation },
] as const;

const formatAllocation = (value: number) => `${value.toLocaleString("en-GB", { maximumFractionDigits: 1 })}%`;
const formatReturn = (value: number, includePlus = false) => `${includePlus && value > 0 ? "+" : ""}${(value * 100).toLocaleString("en-GB", { maximumFractionDigits: 1 })}%`;

export function PortfolioShowcase() {
  const [weights, setWeights] = useState([60, 30, 10]);
  const outcome = getPortfolioShowcaseOutcome(weights);

  return <section aria-labelledby="portfolio-showcase-title" className={styles.portfolioShowcase}>
    <div className={`${styles.container} ${styles.portfolioShowcaseLayout}`}>
      <div className={styles.portfolioCopy}>
        <p className={styles.portfolioEyebrow}>PORTFOLIO LAB</p>
        <h2 id="portfolio-showcase-title">Don’t just read about diversification. <span>Break a portfolio.</span></h2>
        <p className={styles.portfolioDescription}>Build a portfolio, change the allocation and see how different choices affect the outcome.</p>
        <Link href="/lab/portfolio" prefetch={false} className={`${styles.button} ${styles.primaryButton} ${styles.portfolioCta}`}>Try Portfolio Lab <ArrowRight aria-hidden="true" /></Link>
      </div>

      <div className={styles.portfolioDemoStage}>
        <div className={styles.portfolioDemo} data-testid="portfolio-showcase-demo">
          <div className={styles.portfolioDemoHeader}>
            <div>
              <h3>Your portfolio</h3>
              <p>Adjust the allocation to explore the trade-offs.</p>
            </div>
            <span className={styles.educationBadge}><GraduationCap aria-hidden="true" /> 100% allocated · safe to experiment</span>
          </div>

          <div className={styles.portfolioWorkspace}>
            <fieldset className={styles.portfolioControls}>
              <legend className={styles.srOnly}>Portfolio allocation controls</legend>
              {allocations.map(({ id, label, detail, icon: Icon, className }, index) => <div className={`${styles.allocationControl} ${className}`} key={id}>
                <span className={styles.allocationIcon}><Icon aria-hidden="true" /></span>
                <label htmlFor={`marketing-${id}`}>
                  <strong>{label}</strong>
                  <span>{detail}</span>
                </label>
                <input
                  id={`marketing-${id}`}
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={weights[index]}
                  aria-label={`${label} allocation`}
                  aria-valuetext={`${formatAllocation(weights[index])} of the portfolio`}
                  style={{ "--allocation-value": `${weights[index]}%` } as CSSProperties}
                  onChange={(event) => setWeights(rebalanceAllocation(weights, index, Number(event.target.value)))}
                />
                <output htmlFor={`marketing-${id}`}>{formatAllocation(weights[index])}</output>
              </div>)}
            </fieldset>

            <figure className={styles.portfolioPie}>
              <Image
                src="/brand/portfolio-pie.webp"
                width={1200}
                height={1200}
                sizes="(max-width: 640px) 280px, (max-width: 919px) 340px, (max-width: 1220px) 280px, 330px"
                alt="Three-part portfolio pie in Investi blue, green and warm neutral"
              />
              <figcaption>Starting mix shown: 60% stocks · 30% bonds · 10% cash</figcaption>
            </figure>
          </div>

          <div className={styles.portfolioOutcomes} aria-live="polite">
            <div className={styles.outcomeIntro}>
              <strong>Potential outcomes</strong>
              <span>Based on your current allocation</span>
            </div>
            <div className={styles.outcomeMetric}>
              <span>Expected return</span>
              <strong>{formatReturn(outcome.expectedReturn)}</strong>
              <small>per example year</small>
            </div>
            <div className={styles.outcomeMetric}>
              <span>Example range</span>
              <strong>{formatReturn(outcome.lowerExample)} to {formatReturn(outcome.upperExample, true)}</strong>
              <small>across two scenarios</small>
            </div>
            <p className={styles.portfolioDisclosure}>Illustrative data for learning. Not a forecast or recommendation.</p>
          </div>
        </div>
      </div>
    </div>
  </section>;
}
