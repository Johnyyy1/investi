"use client";

import { useId, useState } from "react";
import { FinanceInput } from "@/components/learning/finance-input";
import { ConceptCard } from "@/components/learning/concept-card";
import { MetricResult } from "@/components/learning/metric-result";
import { compoundValue, FinancialInputError, parsePrice } from "@/features/finance/returns";
import { marketCapitalization, ownershipPercentage } from "@/features/finance/foundations";

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
