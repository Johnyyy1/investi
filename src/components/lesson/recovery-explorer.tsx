"use client";

import { useMemo, useState } from "react";
import { FinancialInputError, recoveryReturn } from "@/features/finance/returns";

function formatPercent(value: number) { return `${(value * 100).toFixed(2)}%`; }

export function RecoveryExplorer() {
  const [lossInput, setLossInput] = useState("20");
  const result = useMemo(() => { try { const loss = Number(lossInput); if (!Number.isFinite(loss) || loss < 0 || loss >= 100) throw new FinancialInputError("Enter a loss from 0% up to, but not including, 100%."); return { loss: loss / 100, recovery: recoveryReturn(loss / 100) }; } catch (error) { return { error: error instanceof FinancialInputError ? error.message : "Enter a valid loss." }; } }, [lossInput]);
  return <section className="my-9 border-l-2 border-neutral-950 bg-neutral-100 px-5 py-5" aria-labelledby="recovery-explorer-heading"><p className="text-xs font-medium uppercase tracking-[0.15em] text-muted">Interactive figure</p><h3 id="recovery-explorer-heading" className="mt-2 text-lg font-semibold tracking-[-0.03em]">Loss required recovery</h3><p className="mt-2 max-w-xl text-sm leading-6 text-neutral-700">A loss shrinks the value that the next gain works from. Enter a positive loss magnitude to see the gain needed to recover.</p><label className="mt-5 block max-w-xs space-y-2"><span className="text-sm font-medium">Loss</span><div className="flex items-center gap-2"><input value={lossInput} onChange={(event) => setLossInput(event.target.value)} inputMode="decimal" className="h-11 min-w-0 flex-1 border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-950" aria-describedby="recovery-error" /><span className="text-sm text-muted">%</span></div></label>{"error" in result ? <p id="recovery-error" role="alert" className="mt-4 text-sm text-red-700">{result.error}</p> : <p className="mt-5 text-sm leading-6">After a <span className="font-mono">{formatPercent(result.loss)}</span> loss, the required gain is <span className="font-mono font-semibold text-positive">+{formatPercent(result.recovery)}</span>.</p>}<div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted"><span>−10% → +11.11%</span><span>−20% → +25.00%</span><span>−50% → +100.00%</span></div></section>;
}
