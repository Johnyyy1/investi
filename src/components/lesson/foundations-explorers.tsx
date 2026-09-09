"use client";

import { useId, useState } from "react";
import { FinanceInput } from "@/components/learning/finance-input";
import { ConceptCard } from "@/components/learning/concept-card";
import { MetricResult } from "@/components/learning/metric-result";
import { compoundValue, FinancialInputError, parsePrice } from "@/features/finance/returns";
import { bidAskSpread, drawdownFromPeak, marketCapitalization, ownershipPercentage, portfolioWeightedReturn, simpleBondCashflows } from "@/features/finance/foundations";

const number = (value: number) => value.toLocaleString("en-IE", { maximumSignificantDigits: 8, notation: value !== 0 && (Math.abs(value) < 0.000001 || Math.abs(value) >= 1e15) ? "scientific" : "standard" });
const euros = (value: number) => value.toLocaleString("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 2 });

export function GrowthComparison() {
  const [starting, setStarting] = useState("10000");
  const [rate, setRate] = useState("5");
  const [time, setTime] = useState("10");
  const errorId = useId();
  let result: { rows: { year: number; cash: number; hypothetical: number }[]; final: number } | undefined;
  let error: string | undefined;
  try {
    const start = parsePrice(starting, "Starting value");
    const annual = parsePrice(rate, "Annual rate");
    const years = parsePrice(time, "Time");
    if (start <= 0 || start > 1e9) throw new FinancialInputError("Starting value must be greater than zero and at most 1,000,000,000.");
    if (annual < -100 || annual > 100) throw new FinancialInputError("Use a rate between −100% and 100% for this illustration.");
    if (!Number.isInteger(years) || years < 1 || years > 50) throw new FinancialInputError("Use a whole number of years from 1 to 50.");
    const rows = Array.from({ length: years + 1 }, (_, year) => ({ year, cash: start, hypothetical: compoundValue(start, Array(year).fill(annual / 100)) }));
    result = { rows, final: rows[years].hypothetical };
  } catch (cause) { error = cause instanceof Error ? cause.message : "Enter valid values."; }
  const invalid = { "aria-invalid": Boolean(error), "aria-describedby": error ? errorId : undefined };
  return <section aria-label="Growth comparison" className="space-y-6 min-w-0">
    <ConceptCard title="Mathematical illustration">The 5% default is hypothetical, not a forecast or a guaranteed investment return. Actual returns vary and can be negative. Scenario A assumes 0% growth; cash accounts may pay interest. Both scenarios omit inflation, fees, taxes, and additional contributions.</ConceptCard>
    <div className="grid gap-5 sm:grid-cols-3"><FinanceInput {...invalid} label="Starting value" prefix="€" value={starting} onValueChange={setStarting} /><FinanceInput {...invalid} label="Hypothetical annual rate" mode="percentage" value={rate} onValueChange={setRate} /><FinanceInput {...invalid} label="Time in years" value={time} onValueChange={setTime} /></div>
    {error ? <p id={errorId} role="alert" className="text-ql-small text-ql-danger-ink">{error}</p> : result ? <>
      <div aria-live="polite" aria-atomic="true" className="grid min-w-0 gap-6 border-y border-ql-border py-6 sm:grid-cols-2"><MetricResult label="Scenario A · 0% growth" value={euros(result.rows[0].cash)} /><MetricResult label="Scenario B · hypothetical" value={euros(result.final)} /></div>
      <p className="text-ql-small text-ql-secondary">Each year’s rate applies to the previous year’s value. These are nominal euros: the table does not adjust purchasing power.</p>
      <details><summary className="cursor-pointer py-3 text-ql-small text-ql-link">See values year by year</summary><ol className="space-y-3">{result.rows.map((row) => <li key={row.year} className="border-t border-ql-border pt-3 text-ql-small break-words"><p className="font-semibold">Year {row.year}</p><p>A · {euros(row.cash)}</p><p>B · {euros(row.hypothetical)}</p></li>)}</ol></details>
    </> : null}
  </section>;
}

export function ShareExplorer({ kind }: { kind: "ownership" | "market-cap" }) {
  const ownership = kind === "ownership";
  const [total, setTotal] = useState("1000000");
  const [value, setValue] = useState(ownership ? "100" : "50");
  const errorId = useId();
  let result: { amount: number; total: number; value: number } | undefined;
  let error: string | undefined;
  try {
    const shares = parsePrice(total, "Total shares");
    const input = parsePrice(value, ownership ? "Owned shares" : "Share price");
    result = { total: shares, value: input, amount: ownership ? ownershipPercentage(input, shares) : marketCapitalization(input, shares) };
  } catch (cause) { error = cause instanceof Error ? cause.message : "Enter valid values."; }
  const invalid = { "aria-invalid": Boolean(error), "aria-describedby": error ? errorId : undefined };
  return <section aria-label={ownership ? "Ownership explorer" : "Market cap explorer"} className="space-y-6 min-w-0">
    <div className="grid gap-5 sm:grid-cols-2"><FinanceInput {...invalid} label="Total shares" value={total} onValueChange={setTotal} /><FinanceInput {...invalid} label={ownership ? "Owned shares" : "Share price"} prefix={ownership ? undefined : "€"} value={value} onValueChange={setValue} /></div>
    {error ? <p id={errorId} role="alert" className="text-ql-small text-ql-danger-ink">{error}</p> : result ? <div aria-live="polite" aria-atomic="true" className="space-y-4 border-y border-ql-border py-6"><MetricResult label={ownership ? "Your ownership" : "Market capitalization"} value={ownership ? `${number(result.amount)}%` : euros(result.amount)} /><p className="break-words text-ql-small text-ql-secondary">{ownership ? `${number(result.value)} ÷ ${number(result.total)} × 100 = ${number(result.amount)}%` : `${euros(result.value)} × ${number(result.total)} shares = ${euros(result.amount)}`}</p><p className="text-ql-small text-ql-secondary">{ownership ? "Assumes equal ownership per share. Changing the share price alone does not change your ownership fraction." : "The current market value of equity. It is not revenue, profit, cash, or enterprise value."}</p></div> : null}
  </section>;
}

export function IndexEtfVisual() {
  return <figure aria-label="An index defines a measurement; a tracking ETF holds investments; an investor owns ETF shares" className="space-y-3">
    <ConceptCard title="Index · defines and measures">Company A · Company B · Company C · Company D · … A methodology selects and weights the group.</ConceptCard>
    <p aria-hidden="true" className="text-center text-ql-title text-ql-secondary">↓</p>
    <ConceptCard title="Index-tracking ETF · seeks to follow">The fund holds investments to seek the index’s performance. Costs and tracking differences can affect the result.</ConceptCard>
    <p aria-hidden="true" className="text-center text-ql-title text-ql-secondary">↓</p>
    <ConceptCard title="Investor · owns ETF shares">You hold shares of the fund, gaining exposure to its investments.</ConceptCard>
    <figcaption className="text-ql-small text-ql-secondary">Illustrative companies, not recommendations. This shows an index-tracking ETF; other ETFs follow different strategies.</figcaption>
  </figure>;
}

export function BondCashflowExplorer() {
  const [principal, setPrincipal] = useState("1000");
  const [couponRate, setCouponRate] = useState("5");
  const [years, setYears] = useState("5");
  const errorId = useId();
  let result: ReturnType<typeof simpleBondCashflows> | undefined;
  let error: string | undefined;
  try {
    const loan = parsePrice(principal, "Principal");
    const rate = parsePrice(couponRate, "Annual coupon rate");
    const term = parsePrice(years, "Years");
    if (loan > 1e9) throw new FinancialInputError("Principal must be at most €1,000,000,000 for this illustration.");
    if (rate > 100) throw new FinancialInputError("Use a coupon rate from 0% to 100%.");
    if (!Number.isInteger(term) || term < 1 || term > 50) throw new FinancialInputError("Use a whole number of years from 1 to 50.");
    result = simpleBondCashflows(loan, rate / 100, term);
  } catch (cause) { error = cause instanceof Error ? cause.message : "Enter valid values."; }
  const invalid = { "aria-invalid": Boolean(error), "aria-describedby": error ? errorId : undefined };
  return <section aria-label="Bond cash-flow illustration" className="space-y-6 min-w-0">
    <div className="grid gap-5 sm:grid-cols-3"><FinanceInput {...invalid} label="Principal" prefix="€" value={principal} onValueChange={setPrincipal} /><FinanceInput {...invalid} label="Annual coupon rate" mode="percentage" value={couponRate} onValueChange={setCouponRate} /><FinanceInput {...invalid} label="Years to maturity" value={years} onValueChange={setYears} /></div>
    {error ? <p id={errorId} role="alert" className="text-ql-small text-ql-danger-ink">{error}</p> : result ? <>
      <div aria-live="polite" aria-atomic="true" className="grid gap-5 border-y border-ql-border py-6 sm:grid-cols-2">
        <MetricResult label="Annual coupon" value={euros(result.annualCoupon)} />
        <MetricResult label={`Total coupons over ${years} years`} value={euros(result.totalCouponPayments)} />
        <MetricResult label="Principal returned at maturity" value={euros(result.principalAtMaturity)} />
        <MetricResult label="Total nominal cash received" value={euros(result.totalCashReceived)} />
      </div>
      <ConceptCard title="A cash-flow illustration, with important assumptions">This assumes the issuer makes every promised payment, the coupon stays fixed, and you hold the bond to maturity. Taxes, reinvestment, inflation, the price paid for the bond, and any market-price changes are ignored. The total is not a 25% investment return or a yield calculation.</ConceptCard>
    </> : null}
  </section>;
}

const assetDetails = {
  cash: { name: "Cash", relationship: "Immediately available money", volatility: "Often nominally stable; inflation can reduce purchasing power", purpose: "Liquidity and short-term usefulness", payments: "An account may pay interest, depending on its terms" },
  bond: { name: "Bond", relationship: "A loan to an issuer", volatility: "Credit, interest-rate, inflation, and liquidity risks may matter", purpose: "Contractual cash-flow structure and possible income", payments: "Interest and principal repayment are typically promised, not guaranteed" },
  stock: { name: "Stock", relationship: "Ownership in a company", volatility: "Business and market uncertainty; prices may fluctuate substantially", purpose: "Potential business growth and possible income", payments: "Price changes and dividends, when declared" },
} as const;

export function AssetComparison() {
  const [asset, setAsset] = useState<keyof typeof assetDetails>("cash");
  const detail = assetDetails[asset];
  return <section aria-label="Cash, bond, and stock comparison" className="space-y-5">
    <div className="grid gap-3 sm:grid-cols-3" role="group" aria-label="Choose an asset to compare">
      {(Object.keys(assetDetails) as (keyof typeof assetDetails)[]).map((key) => <button key={key} type="button" onClick={() => setAsset(key)} aria-pressed={asset === key} className={`rounded-ql-md border px-4 py-3 text-left text-ql-small font-semibold transition-colors ${asset === key ? "border-ql-link bg-ql-subtle text-ql-link" : "border-ql-border hover:bg-ql-subtle"}`}>{assetDetails[key].name}</button>)}
    </div>
    <div aria-live="polite" className="grid gap-4 border-y border-ql-border py-6 sm:grid-cols-2">
      <MetricResult label="Relationship" value={detail.relationship} />
      <MetricResult label="Behavior and risk" value={detail.volatility} />
      <MetricResult label="Common purpose" value={detail.purpose} />
      <MetricResult label="Potential payments / outcome" value={detail.payments} />
    </div>
  </section>;
}

const marketChoices = {
  buy: { label: "Buy now", title: "You meet the ask", detail: "An immediate buyer typically interacts with the lowest current selling interest: the €100 ask. A market order prioritizes trying to execute, not a guaranteed exact price; the quote can change before execution." },
  sell: { label: "Sell now", title: "You meet the bid", detail: "An immediate seller typically interacts with the highest current buying interest: the €99 bid. The displayed bid is useful intuition, not a promise that every share will execute at that exact price." },
  limit: { label: "Wait / place limit", title: "You set a price constraint", detail: "A limit buy at €95 says you will buy only at €95 or better. It may not execute at all. This expresses a price condition rather than a priority to trade immediately." },
} as const;

export function MarketQuoteExplorer() {
  const [choice, setChoice] = useState<keyof typeof marketChoices>("buy");
  const selected = marketChoices[choice];
  return <section aria-label="Bid and ask interaction" className="space-y-6">
    <div className="grid gap-5 border-y border-ql-border py-6 sm:grid-cols-3"><MetricResult label="Bid · current buying interest" value="€99.00" /><MetricResult label="Ask · current selling interest" value="€100.00" /><MetricResult label="Bid-ask spread" value={`€${bidAskSpread(99, 100).toFixed(2)}`} /></div>
    <div className="grid gap-3 sm:grid-cols-3" role="group" aria-label="Choose a market action">
      {(Object.keys(marketChoices) as (keyof typeof marketChoices)[]).map((key) => <button key={key} type="button" onClick={() => setChoice(key)} aria-pressed={choice === key} className={`rounded-ql-md border px-4 py-3 text-left text-ql-small font-semibold transition-colors ${choice === key ? "border-ql-link bg-ql-subtle text-ql-link" : "border-ql-border hover:bg-ql-subtle"}`}>{marketChoices[key].label}</button>)}
    </div>
    <ConceptCard title={selected.title}>{selected.detail}</ConceptCard>
  </section>;
}

const riskScenarios = {
  steady: { name: "Investment A", outcomes: [4, 5, 6], description: "Each equally likely outcome is close to 5%." },
  wide: { name: "Investment B", outcomes: [-20, 5, 30], description: "Each equally likely outcome still averages 5%, but the possible range is much wider." },
} as const;

const signedPercent = (value: number) => `${value > 0 ? "+" : ""}${value}%`;

export function RiskScenarioExplorer() {
  const [scenario, setScenario] = useState<keyof typeof riskScenarios>("steady");
  const selected = riskScenarios[scenario];
  const average = selected.outcomes.reduce((sum, value) => sum + value, 0) / selected.outcomes.length;
  return <section aria-label="Risk scenario explorer" className="space-y-6">
    <div className="grid gap-3 sm:grid-cols-2" role="group" aria-label="Choose an investment scenario">
      {(Object.keys(riskScenarios) as (keyof typeof riskScenarios)[]).map((key) => <button key={key} type="button" onClick={() => setScenario(key)} aria-pressed={scenario === key} className={`rounded-ql-md border px-4 py-3 text-left text-ql-small font-semibold transition-colors ${scenario === key ? "border-ql-link bg-ql-subtle text-ql-link" : "border-ql-border hover:bg-ql-subtle"}`}>{riskScenarios[key].name}</button>)}
    </div>
    <div aria-live="polite" className="grid gap-5 border-y border-ql-border py-6 sm:grid-cols-3"><MetricResult label="Worst listed outcome" value={signedPercent(Math.min(...selected.outcomes))} sentiment="negative" /><MetricResult label="Best listed outcome" value={signedPercent(Math.max(...selected.outcomes))} sentiment="positive" /><MetricResult label="Simple average of listed outcomes" value={signedPercent(average)} /></div>
    <ConceptCard title={selected.name}>{selected.description} This is a deliberately simple equal-probability illustration, not a forecast. A similar expected outcome can come with very different uncertainty and losses.</ConceptCard>
  </section>;
}

export function DrawdownExplorer() {
  const [peak, setPeak] = useState("10000");
  const [current, setCurrent] = useState("7500");
  const errorId = useId();
  let drawdown: number | undefined;
  let error: string | undefined;
  try {
    const peakValue = parsePrice(peak, "Peak value");
    const currentValue = parsePrice(current, "Current value");
    if (peakValue > 1e9 || currentValue > 1e9) throw new FinancialInputError("Use values at most €1,000,000,000 for this illustration.");
    drawdown = drawdownFromPeak(peakValue, currentValue);
  } catch (cause) { error = cause instanceof Error ? cause.message : "Enter valid values."; }
  const invalid = { "aria-invalid": Boolean(error), "aria-describedby": error ? errorId : undefined };
  return <section aria-label="Drawdown explorer" className="space-y-6">
    <div className="grid gap-5 sm:grid-cols-2"><FinanceInput {...invalid} label="Previous peak value" prefix="€" value={peak} onValueChange={setPeak} /><FinanceInput {...invalid} label="Current value" prefix="€" value={current} onValueChange={setCurrent} /></div>
    {error ? <p id={errorId} role="alert" className="text-ql-small text-ql-danger-ink">{error}</p> : drawdown !== undefined ? <div aria-live="polite" aria-atomic="true" className="border-y border-ql-border py-6"><MetricResult label="Drawdown from the stated peak" value={`${(drawdown * 100).toLocaleString("en-IE", { maximumFractionDigits: 2 })}%`} /><p className="mt-3 text-ql-small text-ql-secondary">Drawdown is the decline from a previous peak. If the current value is at or above the stated peak, this illustration shows 0% drawdown from it.</p></div> : null}
  </section>;
}

const liquidityExamples = {
  highlyTraded: { name: "Highly traded large-company stock", detail: "There are typically many active buyers and sellers. It may be easier to trade a modest amount near the prevailing market price, often with a tighter spread. The share can still lose value." },
  thinlyTraded: { name: "Thinly traded obscure security", detail: "Fewer active participants can mean a wider spread or a larger price impact when trying to trade. It may be harder to sell quickly near the price you expected. Less liquidity does not tell you the investment’s future return." },
} as const;

export function LiquidityComparison() {
  const [example, setExample] = useState<keyof typeof liquidityExamples>("highlyTraded");
  const selected = liquidityExamples[example];
  return <section aria-label="Liquidity comparison" className="space-y-5">
    <div className="grid gap-3 sm:grid-cols-2" role="group" aria-label="Choose trading conditions to compare">
      {(Object.keys(liquidityExamples) as (keyof typeof liquidityExamples)[]).map((key) => <button key={key} type="button" onClick={() => setExample(key)} aria-pressed={example === key} className={`rounded-ql-md border px-4 py-3 text-left text-ql-small font-semibold transition-colors ${example === key ? "border-ql-link bg-ql-subtle text-ql-link" : "border-ql-border hover:bg-ql-subtle"}`}>{liquidityExamples[key].name}</button>)}
    </div>
    <ConceptCard title={selected.name}>{selected.detail}</ConceptCard>
  </section>;
}

const concentrationExamples = {
  oneCompany: { name: "Portfolio A · one company", detail: "One company’s business problems can dominate the whole result. This has more company-specific concentration risk." },
  spread: { name: "Portfolio B · many investments", detail: "A range of investments can reduce dependence on one company. They can still fall together, and broad market risk remains." },
} as const;

export function DiversificationPreview() {
  const [example, setExample] = useState<keyof typeof concentrationExamples>("oneCompany");
  const selected = concentrationExamples[example];
  return <section aria-label="Diversification preview" className="space-y-5">
    <div className="grid gap-3 sm:grid-cols-2" role="group" aria-label="Choose a portfolio concentration example">
      {(Object.keys(concentrationExamples) as (keyof typeof concentrationExamples)[]).map((key) => <button key={key} type="button" onClick={() => setExample(key)} aria-pressed={example === key} className={`rounded-ql-md border px-4 py-3 text-left text-ql-small font-semibold transition-colors ${example === key ? "border-ql-link bg-ql-subtle text-ql-link" : "border-ql-border hover:bg-ql-subtle"}`}>{concentrationExamples[key].name}</button>)}
    </div>
    <ConceptCard title={selected.name}>{selected.detail}</ConceptCard>
  </section>;
}

const horizonExamples = {
  soon: { name: "Needed next month", detail: "A loss shortly before the money is needed may leave little time to recover. This illustrates why the timing of a need belongs in a risk conversation." },
  later: { name: "Intended for decades later", detail: "A longer horizon may allow more time for outcomes to unfold, but it does not guarantee a gain or make every investment suitable." },
} as const;

export function TimeHorizonExplorer() {
  const [example, setExample] = useState<keyof typeof horizonExamples>("soon");
  const selected = horizonExamples[example];
  return <section aria-label="Time horizon explorer" className="space-y-5">
    <div className="grid gap-3 sm:grid-cols-2" role="group" aria-label="Choose a time horizon">
      {(Object.keys(horizonExamples) as (keyof typeof horizonExamples)[]).map((key) => <button key={key} type="button" onClick={() => setExample(key)} aria-pressed={example === key} className={`rounded-ql-md border px-4 py-3 text-left text-ql-small font-semibold transition-colors ${example === key ? "border-ql-link bg-ql-subtle text-ql-link" : "border-ql-border hover:bg-ql-subtle"}`}>{horizonExamples[key].name}</button>)}
    </div>
    <ConceptCard title={selected.name}>{selected.detail}</ConceptCard>
  </section>;
}

const diversificationScenarios = {
  company: { label: "Only Company A falls", returns: [-0.4, 0, 0, 0], detail: "Company A falls 40%; the other three hypothetical companies remain unchanged." },
  broad: { label: "All four fall together", returns: [-0.2, -0.2, -0.2, -0.2], detail: "All four hypothetical companies fall 20% together." },
} as const;

export function DiversificationImpact() {
  const [scenario, setScenario] = useState<keyof typeof diversificationScenarios>("company");
  const selected = diversificationScenarios[scenario];
  const concentrated = portfolioWeightedReturn([1, 0, 0, 0], selected.returns);
  const spread = portfolioWeightedReturn([0.25, 0.25, 0.25, 0.25], selected.returns);
  return <section aria-label="Diversification impact illustration" className="space-y-6">
    <div className="grid gap-3 sm:grid-cols-2" role="group" aria-label="Choose a hypothetical company-return scenario">
      {(Object.keys(diversificationScenarios) as (keyof typeof diversificationScenarios)[]).map((key) => <button key={key} type="button" aria-pressed={scenario === key} onClick={() => setScenario(key)} className={`min-h-12 rounded-ql-md border px-4 py-3 text-left text-ql-small font-semibold transition-colors ${scenario === key ? "border-ql-link bg-ql-subtle text-ql-link" : "border-ql-border hover:bg-ql-subtle"}`}>{diversificationScenarios[key].label}</button>)}
    </div>
    <p className="text-ql-small text-ql-secondary">{selected.detail} These are simplified one-period inputs, not forecasts.</p>
    <div aria-live="polite" aria-atomic="true" className="grid gap-5 border-y border-ql-border py-6 sm:grid-cols-2">
      <MetricResult label="Portfolio A · 100% Company A" value={signedPercent(concentrated * 100)} sentiment="negative" />
      <MetricResult label="Portfolio B · 25% in each company" value={signedPercent(spread * 100)} sentiment="negative" />
    </div>
    <ConceptCard title={scenario === "company" ? "One dependency has less influence" : "Diversification does not remove broad losses"}>{scenario === "company" ? "In Portfolio B, Company A’s −40% return has a −10% portfolio effect: 25% × −40%. More holdings are not automatically better diversified; the exposures must actually differ." : "When all four holdings fall together, both portfolios fall in this example. Real investments may move together too. This is not correlation analysis."}</ConceptCard>
  </section>;
}

const portfolioHorizons = {
  soon: { label: "Money needed in 6 months", timing: "Near-term need", capacity: "A loss may disrupt the planned use before there is time for circumstances to change." },
  later: { label: "Money not expected for 20 years", timing: "Longer horizon", capacity: "More time may make fluctuations easier to withstand, but it does not guarantee recovery or profit." },
} as const;

export function PortfolioHorizonScenario() {
  const [horizon, setHorizon] = useState<keyof typeof portfolioHorizons>("soon");
  const selected = portfolioHorizons[horizon];
  return <section aria-label="Portfolio time-horizon scenario" className="space-y-6">
    <div className="grid gap-3 sm:grid-cols-2" role="group" aria-label="Choose when the money is needed">
      {(Object.keys(portfolioHorizons) as (keyof typeof portfolioHorizons)[]).map((key) => <button key={key} type="button" aria-pressed={horizon === key} onClick={() => setHorizon(key)} className={`min-h-12 rounded-ql-md border px-4 py-3 text-left text-ql-small font-semibold transition-colors ${horizon === key ? "border-ql-link bg-ql-subtle text-ql-link" : "border-ql-border hover:bg-ql-subtle"}`}>{portfolioHorizons[key].label}</button>)}
    </div>
    <div aria-live="polite" className="grid gap-5 border-y border-ql-border py-6 sm:grid-cols-2"><MetricResult label="Timing" value={selected.timing} /><MetricResult label="Why it matters" value={selected.capacity} /></div>
    <p className="text-ql-small text-ql-secondary">This scenario shows why timing belongs in portfolio thinking. It does not prescribe an allocation.</p>
  </section>;
}

const riskContext = {
  tolerance: { label: "Emotional response", title: "Risk tolerance", detail: "“I would not panic if my portfolio fell 30%.” This describes emotional willingness to experience loss and uncertainty." },
  capacity: { label: "Financial need", title: "Risk capacity", detail: "“I need this money next year.” This can limit the financial ability to absorb a loss, even when the person feels calm about market swings." },
  together: { label: "Consider both", title: "Tolerance is not enough", detail: "Portfolio decisions involve both willingness and financial ability to bear loss, alongside goals, liquidity, and time horizon. This lesson is not a suitability assessment." },
} as const;

export function RiskCapacityScenario() {
  const [context, setContext] = useState<keyof typeof riskContext>("tolerance");
  const selected = riskContext[context];
  return <section aria-label="Risk tolerance and capacity scenario" className="space-y-6">
    <div className="grid gap-3 sm:grid-cols-3" role="group" aria-label="Explore the person's risk context">
      {(Object.keys(riskContext) as (keyof typeof riskContext)[]).map((key) => <button key={key} type="button" aria-pressed={context === key} onClick={() => setContext(key)} className={`min-h-12 rounded-ql-md border px-4 py-3 text-left text-ql-small font-semibold transition-colors ${context === key ? "border-ql-link bg-ql-subtle text-ql-link" : "border-ql-border hover:bg-ql-subtle"}`}>{riskContext[key].label}</button>)}
    </div>
    <ConceptCard title={selected.title}>{selected.detail}</ConceptCard>
  </section>;
}
