"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { FinancialInputError, compoundPeriods, compoundValue, cumulativeReturn, parsePrice } from "@/features/finance/returns";

function formatValue(value: number) { return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value); }
function formatPercent(value: number) { return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(2)}%`; }

function parsePercent(value: string, period: number) {
  if (value.trim() === "") throw new FinancialInputError(`Period ${period} return is required.`);
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new FinancialInputError(`Period ${period} return must be a number.`);
  if (parsed < -100) throw new FinancialInputError(`Period ${period} return cannot be below -100%.`);
  return parsed / 100;
}

export function CompoundingExplorer() {
  const [startValue, setStartValue] = useState("10000");
  const [returnInputs, setReturnInputs] = useState(["20", "-20"]);
  const result = useMemo(() => {
    try {
      const start = parsePrice(startValue, "Starting value");
      const returns = returnInputs.map((value, index) => parsePercent(value, index + 1));
      const periods = compoundPeriods(start, returns);
      return { start, returns, periods, endingValue: compoundValue(start, returns), cumulative: cumulativeReturn(returns), arithmetic: returns.reduce((sum, value) => sum + value, 0) };
    } catch (error) { return { error: error instanceof FinancialInputError ? error.message : "Enter valid values." }; }
  }, [returnInputs, startValue]);
  function updateReturn(index: number, value: string) { setReturnInputs((current) => current.map((item, itemIndex) => itemIndex === index ? value : item)); }
  return <section className="my-9 border border-line bg-surface p-5 sm:p-6" aria-labelledby="compounding-explorer-heading"><div><p className="text-xs font-medium uppercase tracking-[0.15em] text-muted">Interactive figure</p><h3 id="compounding-explorer-heading" className="mt-2 text-lg font-semibold tracking-[-0.03em]">Compounding explorer</h3><p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">Each period applies to the value left by the previous period. Edit two to five returns to see the base change.</p></div><div className="mt-6 grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]"><label className="space-y-2"><span className="text-sm font-medium">Starting value</span><input value={startValue} onChange={(event) => setStartValue(event.target.value)} inputMode="decimal" className="h-11 w-full border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-950" aria-describedby="compounding-error" /></label><div className="grid gap-3 sm:grid-cols-2">{returnInputs.map((value, index) => <label key={index} className="space-y-2"><span className="text-sm font-medium">Period {index + 1} return</span><div className="flex items-center gap-2"><input value={value} onChange={(event) => updateReturn(index, event.target.value)} inputMode="decimal" className="h-11 min-w-0 flex-1 border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-950" aria-describedby="compounding-error" /><span className="text-sm text-muted">%</span>{returnInputs.length > 2 ? <button type="button" onClick={() => setReturnInputs((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="text-xs underline underline-offset-4">Remove</button> : null}</div></label>)}</div></div><div className="mt-4 flex gap-4"><Button type="button" variant="quiet" className="h-auto px-0" disabled={returnInputs.length >= 5} onClick={() => setReturnInputs((current) => [...current, "0"])}>+ Add period</Button></div>{"error" in result ? <p id="compounding-error" role="alert" className="mt-4 text-sm text-red-700">{result.error}</p> : <><div className="mt-6 overflow-x-auto"><table className="w-full min-w-[42rem] border-collapse text-left text-sm"><thead className="border-y border-line text-xs uppercase tracking-[0.12em] text-muted"><tr><th className="py-3 font-medium">Period</th><th className="py-3 font-medium">Starting value</th><th className="py-3 font-medium">Return</th><th className="py-3 font-medium">Gain / loss</th><th className="py-3 font-medium">Ending value</th></tr></thead><tbody>{result.periods.map((period) => <tr key={period.period} className="border-b border-line"><td className="py-3 font-medium">{period.period}</td><td className="py-3 font-mono tabular-nums">{formatValue(period.startValue)}</td><td className={`py-3 font-mono tabular-nums ${period.returnValue >= 0 ? "text-positive" : ""}`}>{formatPercent(period.returnValue)}</td><td className={`py-3 font-mono tabular-nums ${period.change >= 0 ? "text-positive" : ""}`}>{formatValue(period.change)}</td><td className="py-3 font-mono tabular-nums font-medium">{formatValue(period.endValue)}</td></tr>)}</tbody></table></div><dl className="mt-6 grid divide-y divide-line border-y border-line sm:grid-cols-4 sm:divide-x sm:divide-y-0"><div className="py-4 sm:pr-4"><dt className="text-xs uppercase tracking-[0.13em] text-muted">Initial value</dt><dd className="mt-1 font-mono text-sm">{formatValue(result.start)}</dd></div><div className="py-4 sm:px-4"><dt className="text-xs uppercase tracking-[0.13em] text-muted">Final value</dt><dd className="mt-1 font-mono text-sm">{formatValue(result.endingValue)}</dd></div><div className="py-4 sm:px-4"><dt className="text-xs uppercase tracking-[0.13em] text-muted">Arithmetic sum</dt><dd className="mt-1 font-mono text-sm">{formatPercent(result.arithmetic)}</dd></div><div className="py-4 sm:pl-4"><dt className="text-xs uppercase tracking-[0.13em] text-muted">Cumulative return</dt><dd className="mt-1 font-mono text-sm text-positive">{formatPercent(result.cumulative)}</dd></div></dl></>}</section>;
}
