"use client";

import { useId, useState } from "react";
import { FinanceInput } from "@/components/learning/finance-input";
import { ConceptCard } from "@/components/learning/concept-card";
import { MetricResult } from "@/components/learning/metric-result";
import { compoundValue, FinancialInputError, parsePrice } from "@/features/finance/returns";
import { bidAskSpread, drawdownFromPeak, marketCapitalization, ownershipPercentage, portfolioWeightedReturn, positionValue, simpleBondCashflows } from "@/features/finance/foundations";
import { Calculator } from "lucide-react";
import { formatCurrency, formatDecimal, formatPercentage } from "@/lib/formatters";

const number = (value: number) => formatDecimal(value, { maximumSignificantDigits: 8, notation: value !== 0 && (Math.abs(value) < 0.000001 || Math.abs(value) >= 1e15) ? "scientific" : "standard" });
const euros = (value: number) => formatCurrency(value, "EUR", { maximumFractionDigits: 2 });

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
  return <section aria-label={ownership ? "Ownership explorer" : "Market cap explorer"} className="min-w-0 space-y-6">
    <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
      {ownership ? <FinanceInput {...invalid} label="Owned shares" value={value} onValueChange={setValue} /> : <FinanceInput {...invalid} label="Share price" prefix="€" value={value} onValueChange={setValue} />}
      <span aria-hidden="true" className="hidden min-h-12 items-center pb-1 text-section-title font-bold text-primary-hover sm:flex">{ownership ? "÷" : "×"}</span>
      <FinanceInput {...invalid} label="Total shares" value={total} onValueChange={setTotal} />
    </div>
    {error ? <p id={errorId} role="alert" className="rounded-control border border-danger bg-danger-soft px-4 py-3 text-small text-danger-ink">{error}</p> : result ? <div aria-live="polite" aria-atomic="true" className="rounded-surface border border-primary/35 bg-primary-soft p-5 sm:p-6">
      <div className="flex items-start gap-3"><span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-control bg-surface text-primary-hover"><Calculator className="size-5" /></span><MetricResult label={ownership ? "Your ownership" : "Market capitalization"} value={ownership ? `${number(result.amount)}%` : euros(result.amount)} /></div>
      <p className="mt-5 break-words rounded-control bg-surface px-4 py-3 text-small font-bold tabular-nums text-foreground">{ownership ? `${number(result.value)} owned ÷ ${number(result.total)} total × 100 = ${number(result.amount)}%` : `${euros(result.value)} × ${number(result.total)} shares = ${euros(result.amount)}`}</p>
      <p className="mt-3 text-small text-secondary">{ownership ? "Assumes equal ownership per share. Changing the share price alone does not change your ownership fraction." : "The current market value of equity. It is not revenue, profit, cash, or enterprise value."}</p>
    </div> : null}
  </section>;
}

export function StockPositionExplorer() {
  const [quantity, setQuantity] = useState("3");
  const [price, setPrice] = useState("150");
  const errorId = useId();
  let value: number | undefined;
  let error: string | undefined;
  try {
    value = positionValue(parsePrice(quantity, "Počet"), parsePrice(price, "Tržní cena"));
  } catch { error = "Zadej platné číselné hodnoty."; }
  const invalid = { "aria-invalid": Boolean(error), "aria-describedby": error ? errorId : undefined };
  return <section aria-label="Výpočet hodnoty akciové pozice" className="min-w-0 space-y-6">
    <div className="grid gap-5 sm:grid-cols-2"><FinanceInput {...invalid} label="Počet akcií" value={quantity} onValueChange={setQuantity} /><FinanceInput {...invalid} label="Tržní cena jedné akcie" prefix="Kč" value={price} onValueChange={setPrice} /></div>
    {error ? <p id={errorId} role="alert" className="text-small text-danger-ink">{error}</p> : value !== undefined ? <div aria-live="polite" aria-atomic="true" className="border-y border-border py-6"><MetricResult label="Hodnota pozice" value={formatCurrency(value, "CZK", { maximumFractionDigits: 2 })} /><p className="mt-3 text-small text-secondary">{number(Number(quantity))} akcie × {formatCurrency(Number(price), "CZK", { maximumFractionDigits: 2 })} za akcii = {formatCurrency(value, "CZK", { maximumFractionDigits: 2 })}</p></div> : null}
  </section>;
}

export function IndexEtfVisual() {
  return <figure aria-label="Index určuje měřítko, ETF drží investice a investor vlastní podíly ETF" className="space-y-3">
    <ConceptCard title="Index · určuje a měří">Firma A · Firma B · Firma C · Firma D · … Pravidla vybírají společnosti a určují jejich váhy.</ConceptCard>
    <p aria-hidden="true" className="text-center text-ql-title text-ql-secondary">↓</p>
    <ConceptCard title="ETF sledující index · snaží se ho napodobit">Fond drží investice tak, aby se přiblížil vývoji indexu. Výsledek ovlivňují náklady i odchylka sledování.</ConceptCard>
    <p aria-hidden="true" className="text-center text-ql-title text-ql-secondary">↓</p>
    <ConceptCard title="Investor · vlastní podíly ETF">Vlastníš podíly fondu, a tím získáváš expozici vůči jeho investicím.</ConceptCard>
    <figcaption className="text-ql-small text-ql-secondary">Firmy jsou pouze ilustrační, nejde o doporučení. Příklad ukazuje ETF sledující index; jiná ETF používají jiné strategie.</figcaption>
  </figure>;
}

const etfHoldings = [
  { label: "Firma A", weight: 45, color: "bg-primary" },
  { label: "Firma B", weight: 30, color: "bg-primary-hover" },
  { label: "Firma C", weight: 15, color: "bg-success-ink" },
  { label: "Ostatní", weight: 10, color: "bg-warning" },
] as const;

export function EtfHoldingsVisual() {
  return <figure aria-labelledby="etf-holdings-caption" className="space-y-6">
    <div role="img" aria-label="Váhy ETF: Firma A 45 %, Firma B 30 %, Firma C 15 %, ostatní 10 %" className="flex h-8 overflow-hidden rounded-pill bg-surface-muted">
      {etfHoldings.map((holding) => <span key={holding.label} aria-hidden="true" className={`h-full ${holding.color}`} style={{ width: `${holding.weight}%` }} />)}
    </div>
    <ul className="grid gap-3 min-[420px]:grid-cols-2">{etfHoldings.map((holding) => <li key={holding.label} className="flex items-center justify-between gap-3 border-b border-border pb-2 text-small"><span className="flex items-center gap-2"><span aria-hidden="true" className={`size-3 rounded-full ${holding.color}`} />{holding.label}</span><strong className="tabular-nums">{holding.weight}%</strong></li>)}</ul>
    <figcaption id="etf-holdings-caption" className="text-small text-secondary">Dvě největší pozice tvoří 75 % tohoto modelového ETF. „Mnoho pozic“ neznamená, že jsou váhy vyvážené.</figcaption>
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
  cash: { name: "Hotovost", relationship: "Okamžitě dostupné peníze", volatility: "Nominálně bývá stabilní; inflace může snížit kupní sílu", purpose: "Likvidita a využití v blízké době", payments: "Účet může podle podmínek přinášet úrok" },
  bond: { name: "Dluhopis", relationship: "Půjčka emitentovi", volatility: "Záleží na kreditním, úrokovém, inflačním a likviditním riziku", purpose: "Smluvní peněžní toky a možný příjem", payments: "Úrok a vrácení jistiny jsou slíbené, ne zaručené" },
  stock: { name: "Akcie", relationship: "Vlastnický podíl ve firmě", volatility: "Nejistota podnikání i trhu; cena může výrazně kolísat", purpose: "Možný růst firmy a případný příjem", payments: "Změna ceny a případně vyplacené dividendy" },
} as const;

export function AssetComparison() {
  const [asset, setAsset] = useState<keyof typeof assetDetails>("cash");
  const detail = assetDetails[asset];
  return <section aria-label="Porovnání hotovosti, dluhopisu a akcie" className="space-y-5">
    <div className="grid gap-3 sm:grid-cols-3" role="group" aria-label="Vyber aktivum k porovnání">
      {(Object.keys(assetDetails) as (keyof typeof assetDetails)[]).map((key) => <button key={key} type="button" onClick={() => setAsset(key)} aria-pressed={asset === key} className={`rounded-ql-md border px-4 py-3 text-left text-ql-small font-semibold transition-colors ${asset === key ? "border-ql-link bg-ql-subtle text-ql-link" : "border-ql-border hover:bg-ql-subtle"}`}>{assetDetails[key].name}</button>)}
    </div>
    <div aria-live="polite" className="grid gap-4 border-y border-ql-border py-6 sm:grid-cols-2">
      <MetricResult label="Vztah" value={detail.relationship} />
      <MetricResult label="Chování a riziko" value={detail.volatility} />
      <MetricResult label="Obvyklý účel" value={detail.purpose} />
      <MetricResult label="Možné platby nebo výsledek" value={detail.payments} />
    </div>
  </section>;
}

const marketChoices = {
  buy: { label: "Koupit hned", title: "Obchoduješ na ask", detail: "Okamžitý kupující se obvykle potká s nejnižší aktuální nabídkou prodávajících: ask 100,20 Kč. Tržní pokyn upřednostňuje provedení, přesnou cenu ale nezaručuje." },
  sell: { label: "Prodat hned", title: "Obchoduješ na bid", detail: "Okamžitý prodávající se obvykle potká s nejvyšší aktuální poptávkou kupujících: bid 99,80 Kč. Zobrazený bid není slib, že se za tuto cenu provedou všechny kusy." },
  limit: { label: "Nastavit limit", title: "Určuješ cenovou podmínku", detail: "Limitní nákup na 100 Kč říká, že koupíš jen za 100 Kč nebo levněji. Pokyn se nemusí provést vůbec." },
} as const;

export function MarketQuoteExplorer() {
  const [choice, setChoice] = useState<keyof typeof marketChoices>("buy");
  const selected = marketChoices[choice];
  return <section aria-label="Práce s cenami bid a ask" className="space-y-6">
    <div className="grid gap-5 border-y border-ql-border py-6 sm:grid-cols-3"><MetricResult label="Bid · aktuální poptávka" value="99,80 Kč" /><MetricResult label="Ask · aktuální nabídka" value="100,20 Kč" /><MetricResult label="Spread bid–ask" value={formatCurrency(bidAskSpread(99.8, 100.2), "CZK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} /></div>
    <div className="grid gap-3 sm:grid-cols-3" role="group" aria-label="Vyber tržní pokyn">
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
  soon: { name: "Peníze potřebuji za 3 měsíce", detail: "Ztráta krátce před plánovaným výdajem by nemusela mít čas se napravit. Pro tento blízký cíl jsou důležité hlavně likvidita a stabilita." },
  later: { name: "Peníze nebudu potřebovat 15 let", detail: "Delší horizont dává více času nejistým výsledkům i složenému zhodnocení. Nezaručuje však zisk a nedělá každou investici vhodnou." },
} as const;

export function TimeHorizonExplorer() {
  const [example, setExample] = useState<keyof typeof horizonExamples>("soon");
  const selected = horizonExamples[example];
  return <section aria-label="Porovnání časových horizontů" className="space-y-5">
    <div className="grid gap-3 sm:grid-cols-2" role="group" aria-label="Vyber časový horizont">
      {(Object.keys(horizonExamples) as (keyof typeof horizonExamples)[]).map((key) => <button key={key} type="button" onClick={() => setExample(key)} aria-pressed={example === key} className={`rounded-ql-md border px-4 py-3 text-left text-ql-small font-semibold transition-colors ${example === key ? "border-ql-link bg-ql-subtle text-ql-link" : "border-ql-border hover:bg-ql-subtle"}`}>{horizonExamples[key].name}</button>)}
    </div>
    <ConceptCard title={selected.name}>{selected.detail}</ConceptCard>
  </section>;
}

const diversificationScenarios = {
  company: { label: "Klesne jen firma A", returns: [-0.4, 0, 0, 0], detail: "Firma A klesne o 40 %, ostatní tři modelové firmy se nezmění." },
  broad: { label: "Klesnou všechny čtyři", returns: [-0.2, -0.2, -0.2, -0.2], detail: "Všechny čtyři modelové firmy klesnou společně o 20 %." },
} as const;

export function DiversificationImpact() {
  const [scenario, setScenario] = useState<keyof typeof diversificationScenarios>("company");
  const selected = diversificationScenarios[scenario];
  const concentrated = portfolioWeightedReturn([1, 0, 0, 0], selected.returns);
  const spread = portfolioWeightedReturn([0.25, 0.25, 0.25, 0.25], selected.returns);
  return <section aria-label="Vliv diverzifikace" className="space-y-6">
    <div className="grid gap-3 sm:grid-cols-2" role="group" aria-label="Vyber modelový scénář výnosů">
      {(Object.keys(diversificationScenarios) as (keyof typeof diversificationScenarios)[]).map((key) => <button key={key} type="button" aria-pressed={scenario === key} onClick={() => setScenario(key)} className={`min-h-12 rounded-ql-md border px-4 py-3 text-left text-ql-small font-semibold transition-colors ${scenario === key ? "border-ql-link bg-ql-subtle text-ql-link" : "border-ql-border hover:bg-ql-subtle"}`}>{diversificationScenarios[key].label}</button>)}
    </div>
    <p className="text-ql-small text-ql-secondary">{selected.detail} Jde o zjednodušený příklad za jedno období, ne o předpověď.</p>
    <div aria-live="polite" aria-atomic="true" className="grid gap-5 border-y border-ql-border py-6 sm:grid-cols-2">
      <MetricResult label="Portfolio A · 100 % ve firmě A" value={formatPercentage(concentrated)} sentiment="negative" />
      <MetricResult label="Portfolio B · 25 % v každé firmě" value={formatPercentage(spread)} sentiment="negative" />
    </div>
    <ConceptCard title={scenario === "company" ? "Jedna firma má menší vliv" : "Diverzifikace neodstraní plošný pokles"}>{scenario === "company" ? "V portfoliu B má pokles firmy A o 40 % dopad −10 %: 25 % × −40 %. Více pozic není automaticky lepší diverzifikace; jejich expozice se musí skutečně lišit." : "Když všechny čtyři pozice klesnou společně, v tomto příkladu klesnou obě portfolia. Také skutečné investice se mohou pohybovat spolu."}</ConceptCard>
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
