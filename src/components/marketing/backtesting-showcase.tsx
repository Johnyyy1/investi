import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowRight, GraduationCap } from "lucide-react";
import { portfolioWeightedReturn } from "@/features/finance/foundations";
import { calculateBacktestMetrics } from "@/features/lab/backtest";
import { syntheticMonthlyData } from "@/features/lab/sample-data";
import styles from "./marketing.module.css";
import { formatPercentage } from "@/lib/formatters";

const initialValue = 10_000;
const portfolioReturns = syntheticMonthlyData.map((row) => portfolioWeightedReturn(
  [0.6, 0.3, 0.1],
  [row.stocks, row.bonds, row.cash],
));
const portfolio = calculateBacktestMetrics(initialValue, portfolioReturns);
const benchmark = calculateBacktestMetrics(initialValue, syntheticMonthlyData.map((row) => row.stocks));

const chartWidth = 700;
const chartHeight = 240;
const chartValues = [...portfolio.values, ...benchmark.values];
const chartMinimum = Math.floor(Math.min(...chartValues) / 2_000) * 2_000;
const chartMaximum = Math.ceil(Math.max(...chartValues) / 2_000) * 2_000;
const chartRange = chartMaximum - chartMinimum;
const chartTicks = Array.from({ length: 4 }, (_, index) => chartMaximum - (chartRange * index) / 3);

function linePath(values: readonly number[]) {
  return values.map((value, index) => {
    const x = (index / (values.length - 1)) * chartWidth;
    const y = ((chartMaximum - value) / chartRange) * chartHeight;
    return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(" ");
}

function point(values: readonly number[], index: number) {
  return {
    x: (index / (values.length - 1)) * chartWidth,
    y: ((chartMaximum - values[index]) / chartRange) * chartHeight,
  };
}

const portfolioEnd = point(portfolio.values, portfolio.values.length - 1);
const benchmarkEnd = point(benchmark.values, benchmark.values.length - 1);
const formatValue = (value: number) => `${Math.round(value).toLocaleString("cs-CZ")} Kč`;
const formatPercent = (value: number) => formatPercentage(value);
const formatAxisValue = (value: number) => `${Math.round(value / 1_000).toLocaleString("cs-CZ")} tis. Kč`;

const metrics = [
  { label: "Konečná hodnota", value: formatValue(portfolio.finalValue), detail: "z 10 000 Kč" },
  { label: "CAGR", value: formatPercent(portfolio.cagr), detail: "za rok" },
  { label: "Maximální drawdown", value: formatPercent(portfolio.maxDrawdown), detail: "největší pokles" },
  { label: "Volatilita", value: formatPercent(portfolio.volatility), detail: "anualizovaná" },
] as const;

export function BacktestingShowcase() {
  const summary = `Ukázkový vzdělávací backtest od ledna 2015 do prosince 2025: portfolio 60 / 30 / 10 začíná na ${formatValue(initialValue)} a končí na ${formatValue(portfolio.finalValue)}, zatímco akciový benchmark končí na ${formatValue(benchmark.finalValue)}. CAGR portfolia je ${formatPercent(portfolio.cagr)}, maximální drawdown ${formatPercent(portfolio.maxDrawdown)} a anualizovaná volatilita ${formatPercent(portfolio.volatility)}.`;

  return <section aria-labelledby="backtesting-showcase-title" className={styles.backtestingShowcase}>
    <div className={`${styles.container} ${styles.backtestingLayout}`}>
      <div className={styles.backtestingCopy}>
        <p className={styles.backtestingEyebrow}>BACKTESTING LAB</p>
        <h2 id="backtesting-showcase-title">Tvoje intuice potřebuje data.</h2>
        <p className={styles.backtestingDescription}>Otestuj nápad na vzdělávacích tržních scénářích a sleduj, jak by se choval.</p>
        <Link href="/lab/backtesting" prefetch={false} className={`${styles.button} ${styles.primaryButton} ${styles.backtestingCta}`}>Vyzkoušet Backtesting Lab <ArrowRight aria-hidden="true" /></Link>
      </div>

      <div className={styles.backtestingSurface} data-testid="backtesting-showcase-demo">
        <figure className={styles.backtestingFigure} aria-labelledby="backtesting-chart-title" aria-describedby="backtesting-chart-summary">
          <div className={styles.backtestingChartHeader}>
            <div>
              <h3 id="backtesting-chart-title">Portfolio vs. srovnávací index</h3>
              <p>Počáteční hodnota {formatValue(initialValue)} · leden 2015–prosinec 2025</p>
            </div>
            <div className={styles.backtestingLegend} aria-hidden="true">
              <span><i className={styles.portfolioLegend} />Portfolio</span>
              <span><i className={styles.benchmarkLegend} />Srovnávací index</span>
            </div>
          </div>

          <div className={styles.backtestingChart} aria-hidden="true">
            <div className={styles.backtestingYAxis}>
              {chartTicks.map((tick) => <span key={tick}>{formatAxisValue(tick)}</span>)}
            </div>
            <div className={styles.backtestingPlot}>
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
                <g className={styles.backtestingGrid}>
                  {[0, 80, 160, 240].map((y) => <line key={`y-${y}`} x1="0" x2={chartWidth} y1={y} y2={y} />)}
                  {[0, 140, 280, 420, 560, 700].map((x) => <line key={`x-${x}`} x1={x} x2={x} y1="0" y2={chartHeight} />)}
                </g>
                <g className={`${styles.backtestingLineGroup} ${styles.benchmarkLineGroup}`}>
                  <path className={styles.benchmarkLine} d={linePath(benchmark.values)} vectorEffect="non-scaling-stroke" />
                  <rect className={styles.benchmarkEndpoint} x={benchmarkEnd.x - 4} y={benchmarkEnd.y - 4} width="8" height="8" vectorEffect="non-scaling-stroke" />
                </g>
                <g className={`${styles.backtestingLineGroup} ${styles.portfolioLineGroup}`}>
                  <path className={styles.portfolioLine} d={linePath(portfolio.values)} vectorEffect="non-scaling-stroke" />
                  <circle className={styles.portfolioEndpoint} cx={portfolioEnd.x} cy={portfolioEnd.y} r="4.5" vectorEffect="non-scaling-stroke" />
                </g>
              </svg>
              <div className={styles.backtestingXAxis}>
                {[2015, 2017, 2019, 2021, 2023, 2025].map((year) => <span key={year}>{year}</span>)}
              </div>
            </div>
          </div>
          <figcaption id="backtesting-chart-summary" className={styles.backtestingChartSummary}>{summary}</figcaption>
        </figure>

        <dl className={styles.backtestingMetrics}>
          {metrics.map((metric, index) => <div key={metric.label} style={{ "--metric-delay": `${440 + index * 70}ms` } as CSSProperties}>
            <dt>{metric.label}</dt>
            <dd>{metric.value}</dd>
            <dd>{metric.detail}</dd>
          </div>)}
        </dl>

        <p className={styles.backtestingDisclosure}><GraduationCap aria-hidden="true" /> Vzdělávací demo data · syntetické scénáře pro učení</p>
      </div>
    </div>
  </section>;
}
