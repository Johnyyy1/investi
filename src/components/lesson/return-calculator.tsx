"use client";

import { FinanceInput } from "@/components/learning/finance-input";
import { MetricResult } from "@/components/learning/metric-result";
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

  return <section aria-labelledby="return-calculator-heading" className="space-y-6">
    <h3 id="return-calculator-heading" className="text-ql-title font-semibold">Return calculator</h3>
    <div className="grid gap-5 sm:grid-cols-2"><FinanceInput label="Starting price" value={start} onValueChange={setStart} aria-describedby={"error" in result ? "calculator-error" : undefined} aria-invalid={"error" in result} /><FinanceInput label="Ending price" value={end} onValueChange={setEnd} aria-describedby={"error" in result ? "calculator-error" : undefined} aria-invalid={"error" in result} /></div>
    {"error" in result ? <p id="calculator-error" role="alert" className="text-ql-small text-ql-danger-ink">{result.error}</p> : <div aria-live="polite" className="grid gap-6 border-y border-ql-border py-6 sm:grid-cols-2"><MetricResult label="Absolute change" value={formatChange(result.change)} /><MetricResult label="Percentage return" value={formatPercent(result.returnValue)} /></div>}
  </section>;
}
