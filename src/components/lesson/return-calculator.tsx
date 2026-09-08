"use client";

import { useMemo, useState } from "react";
import { FinancialInputError, absoluteChange, parsePrice, simpleReturn } from "@/features/finance/returns";

function formatChange(value: number) {
  return `${value >= 0 ? "+" : ""}${new Intl.NumberFormat("en-US", { maximumFractionDigits: 6 }).format(value)}`;
}

function formatPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(2)}%`;
}

export function ReturnCalculator() {
  const [start, setStart] = useState("100");
  const [end, setEnd] = useState("115");
  const result = useMemo(() => {
    try {
      const startingPrice = parsePrice(start, "Starting price");
      const endingPrice = parsePrice(end, "Ending price");
      return { change: absoluteChange(startingPrice, endingPrice), returnValue: simpleReturn(startingPrice, endingPrice) };
    } catch (error) {
      return { error: error instanceof FinancialInputError ? error.message : "Enter valid prices." };
    }
  }, [start, end]);

  return <section className="my-9 border border-line bg-surface p-5 sm:p-6" aria-labelledby="return-calculator-heading"><div><p className="text-xs font-medium uppercase tracking-[0.15em] text-muted">Interactive figure</p><h3 id="return-calculator-heading" className="mt-2 text-lg font-semibold tracking-[-0.03em]">Return calculator</h3></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="space-y-2"><span className="text-sm font-medium">Starting price</span><input value={start} onChange={(event) => setStart(event.target.value)} inputMode="decimal" className="h-11 w-full border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-950" aria-describedby="calculator-error" /></label><label className="space-y-2"><span className="text-sm font-medium">Ending price</span><input value={end} onChange={(event) => setEnd(event.target.value)} inputMode="decimal" className="h-11 w-full border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-950" aria-describedby="calculator-error" /></label></div>{"error" in result ? <p id="calculator-error" role="alert" className="mt-4 text-sm text-red-700">{result.error}</p> : <dl className="mt-6 grid divide-y divide-line border-y border-line sm:grid-cols-2 sm:divide-x sm:divide-y-0"><div className="py-4 sm:pr-5"><dt className="text-xs uppercase tracking-[0.13em] text-muted">Absolute change</dt><dd className={`mt-1 text-xl font-semibold tabular-nums ${result.change >= 0 ? "text-positive" : "text-neutral-950"}`}>{formatChange(result.change)}</dd></div><div className="py-4 sm:pl-5"><dt className="text-xs uppercase tracking-[0.13em] text-muted">Percentage return</dt><dd className={`mt-1 text-xl font-semibold tabular-nums ${result.returnValue >= 0 ? "text-positive" : "text-neutral-950"}`}>{formatPercent(result.returnValue)}</dd></div></dl>}</section>;
}
