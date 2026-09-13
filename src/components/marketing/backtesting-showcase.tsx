import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowRight, GraduationCap } from "lucide-react";
import { portfolioWeightedReturn } from "@/features/finance/foundations";
import { calculateBacktestMetrics } from "@/features/lab/backtest";
import { syntheticMonthlyData } from "@/features/lab/sample-data";
import styles from "./marketing.module.css";

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
const formatValue = (value: number) => `${Math.round(value).toLocaleString("en-GB")} Kč`;
const formatPercent = (value: number) => `${(value * 100).toFixed(2)}%`;
const formatAxisValue = (value: number) => `${Math.round(value / 1_000)}k Kč`;

const metrics = [
  { label: "Final value", value: formatValue(portfolio.finalValue), detail: "from 10,000 Kč" },
  { label: "CAGR", value: formatPercent(portfolio.cagr), detail: "per year" },
  { label: "Max drawdown", value: formatPercent(portfolio.maxDrawdown), detail: "largest fall" },
  { label: "Volatility", value: formatPercent(portfolio.volatility), detail: "annualized" },
] as const;

export function BacktestingShowcase() {
  const summary = `Example educational backtest from January 2015 to December 2025: the 60 / 30 / 10 portfolio starts at ${formatValue(initialValue)} and ends at ${formatValue(portfolio.finalValue)}, versus ${formatValue(benchmark.finalValue)} for the stock-like benchmark. Portfolio CAGR is ${formatPercent(portfolio.cagr)}, maximum drawdown is ${formatPercent(portfolio.maxDrawdown)}, and annualized volatility is ${formatPercent(portfolio.volatility)}.`;

  return <section aria-labelledby="backtesting-showcase-title" className={styles.backtestingShowcase}>
    <div className={`${styles.container} ${styles.backtestingLayout}`}>
      <div className={styles.backtestingCopy}>
        <p className={styles.backtestingEyebrow}>BACKTESTING</p>
        <h2 id="backtesting-showcase-title">Your intuition needs data.</h2>
        <p className={styles.backtestingDescription}>Test an idea against educational market scenarios and see how it would have behaved.</p>
        <Link href="/lab/backtesting" prefetch={false} className={`${styles.button} ${styles.primaryButton} ${styles.backtestingCta}`}>Try Backtesting <ArrowRight aria-hidden="true" /></Link>
      </div>

      <div className={styles.backtestingSurface} data-testid="backtesting-showcase-demo">
        <figure className={styles.backtestingFigure} aria-labelledby="backtesting-chart-title" aria-describedby="backtesting-chart-summary">
          <div className={styles.backtestingChartHeader}>
            <div>
              <h3 id="backtesting-chart-title">Portfolio vs. benchmark</h3>
              <p>{formatValue(initialValue)} starting value · Jan 2015–Dec 2025</p>
            </div>
            <div className={styles.backtestingLegend} aria-hidden="true">
              <span><i className={styles.portfolioLegend} />Portfolio</span>
              <span><i className={styles.benchmarkLegend} />Benchmark</span>
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

        <p className={styles.backtestingDisclosure}><GraduationCap aria-hidden="true" /> Educational demo data · synthetic scenarios for learning</p>
      </div>
    </div>
  </section>;
}
