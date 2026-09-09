"use client";

import { useMemo, useState } from "react";
import { FinanceInput } from "@/components/learning/finance-input";
import { MetricResult } from "@/components/learning/metric-result";
import { LearningButton } from "@/components/learning/learning-button";
import { FinancialInputError, recoveryReturn } from "@/features/finance/returns";

function formatPercent(value: number) { return `${(value * 100).toFixed(2)}%`; }

export function RecoveryExplorer() {
  const [lossInput, setLossInput] = useState("20");
  const result = useMemo(() => {
    try {
      if (!lossInput.trim()) throw new FinancialInputError("Enter a loss magnitude.");
      const loss = Number(lossInput);
      if (!Number.isFinite(loss) || loss < 0 || loss >= 100) throw new FinancialInputError("Enter a loss from 0% up to, but not including, 100%.");
      return { loss: loss / 100, recovery: recoveryReturn(loss / 100) };
    } catch (error) { return { error: error instanceof FinancialInputError ? error.message : "Enter a valid loss." }; }
  }, [lossInput]);
  return <section aria-labelledby="recovery-explorer-heading" className="space-y-6">
    <div><h3 id="recovery-explorer-heading" className="text-ql-title font-semibold">Loss recovery explorer</h3><p className="mt-3 text-ql-body text-ql-secondary">A loss shrinks the value that the next gain works from. Enter a positive loss magnitude to see the gain needed to recover.</p></div>
    <FinanceInput label="Loss magnitude" mode="percentage" value={lossInput} onValueChange={setLossInput} error={"error" in result ? result.error : undefined} />
    <div className="flex flex-wrap gap-3" aria-label="Example losses">{[10, 20, 50].map((loss) => <LearningButton key={loss} variant="secondary" onClick={() => setLossInput(String(loss))}>Try −{loss}%</LearningButton>)}</div>
    {"error" in result ? null : <div className="grid gap-6 border-y border-ql-border py-6 sm:grid-cols-2" aria-live="polite" aria-atomic="true"><MetricResult label="Loss" value={`−${formatPercent(result.loss)}`} sentiment="negative" /><MetricResult label="Required recovery gain" value={`+${formatPercent(result.recovery)}`} sentiment="positive" note="Calculated from the smaller remaining value." /></div>}
  </section>;
}
