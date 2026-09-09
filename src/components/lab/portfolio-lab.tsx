"use client";
import { useRef, useState } from "react";
import { FinanceInput } from "@/components/learning/finance-input";
import { LearningButton } from "@/components/learning/learning-button";
import { parsePrice } from "@/features/finance/returns";
import { portfolioAssets, portfolioScenario, rebalanceAllocation } from "@/features/lab/portfolio";

const scenarios = [
  { name: "Stocks rise", returns: [8, 2, 0] },
  { name: "Stocks fall", returns: [-20, 2, 0] },
  { name: "Stocks & bonds fall", returns: [-15, -8, 1] },
];
const pct = (value: number) => `${value > 0 ? "+" : ""}${(value === 0 ? 0 : value * 100).toLocaleString("en-GB", { maximumFractionDigits: 2 })}%`;
const money = (value: number) => `${value.toLocaleString("en-GB", { maximumFractionDigits: 0 })} Kč`;
type Run = ReturnType<typeof portfolioScenario> & { weights: number[]; returns: number[]; initial: number };

export function PortfolioLab() {
  const [weights, setWeights] = useState([60, 30, 10]);
  const [returns, setReturns] = useState(["-20", "2", "0"]);
  const [scenario, setScenario] = useState("Stocks fall");
  const [amount, setAmount] = useState("100000");
  const [run, setRun] = useState<Run>();
  const [previous, setPrevious] = useState<Run>();
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string>();
  const output = useRef<HTMLHeadingElement>(null);
  function execute() {
    try {
      const initial = parsePrice(amount, "Starting amount");
      const parsed = returns.map((value, index) => parsePrice(value, `${portfolioAssets[index].label} return`) / 100);
      const result = portfolioScenario(weights.map((value) => value / 100), parsed, initial);
      setPrevious(run); setRun({ ...result, weights: [...weights], returns: parsed, initial }); setDirty(false); setError(undefined);
      requestAnimationFrame(() => output.current?.focus());
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Check your inputs and try again."); }
  }
  return <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14">
    <form onSubmit={(event) => { event.preventDefault(); execute(); }} className="min-w-0">
      <fieldset><legend className="text-ql-title font-semibold">Build your mix</legend><p className="mt-2 text-ql-small text-ql-secondary">Sliders keep the mix at 100%.</p>
        <div className="mt-6 flex h-4 overflow-hidden rounded-full" role="img" aria-label={portfolioAssets.map((asset, i) => `${asset.label} ${weights[i].toFixed(1)}%`).join(", ")}>{portfolioAssets.map((asset, index) => <span key={asset.id} className={asset.color} style={{ width: `${weights[index]}%` }} />)}</div>
        {portfolioAssets.map((asset, index) => <div key={asset.id} className="mt-5"><label htmlFor={`lab-${asset.id}`} className="flex justify-between gap-3 text-ql-body font-semibold"><span>{asset.label}</span><span className="tabular-nums">{weights[index].toLocaleString("en-GB", { maximumFractionDigits: 1 })}%</span></label><input id={`lab-${asset.id}`} type="range" min={0} max={100} step={1} value={weights[index]} aria-label={`${asset.label} allocation slider`} aria-valuetext={`${weights[index].toFixed(1)} percent`} onChange={(event) => { setWeights(rebalanceAllocation(weights, index, Number(event.target.value))); setDirty(true); }} className="ql-range min-h-12 w-full cursor-pointer accent-ql-link focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ql-link" /></div>)}
      </fieldset>
      <label htmlFor="scenario" className="mt-6 block text-ql-small font-semibold">Hypothetical scenario</label>
      <select id="scenario" value={scenario} onChange={(event) => { const selected = scenarios.find((item) => item.name === event.target.value); setScenario(event.target.value); if (selected) setReturns(selected.returns.map(String)); setDirty(true); }} className="mt-2 min-h-12 w-full rounded-ql-md border border-ql-control bg-ql-surface px-3 text-ql-body">{scenarios.map((item) => <option key={item.name}>{item.name}</option>)}{scenario === "Custom" && <option>Custom</option>}</select>
      <p className="mt-3 text-ql-small text-ql-secondary">Stocks {returns[0]}% · Bonds {returns[1]}% · Cash {returns[2]}%</p>
      <details className="mt-3"><summary className="flex min-h-12 cursor-pointer items-center text-ql-small text-ql-link">Edit scenario &amp; starting amount</summary><div className="mt-3 grid gap-5 sm:grid-cols-2">{portfolioAssets.map((asset, index) => <FinanceInput key={asset.id} label={`${asset.label} hypothetical return`} mode="percentage" value={returns[index]} onValueChange={(value) => { setReturns((current) => current.map((old, i) => i === index ? value : old)); setScenario("Custom"); setDirty(true); }} />)}<FinanceInput label="Starting amount" value={amount} suffix="Kč" onValueChange={(value) => { setAmount(value); setDirty(true); }} /></div></details>
      {error && <p role="alert" className="mt-5 text-ql-small text-ql-danger-ink">{error}</p>}
      <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 mt-3 bg-ql-page py-3 lg:static"><LearningButton className="w-full" type="submit">Run scenario</LearningButton></div>
    </form>
    <section className="min-w-0 border-t border-ql-border pt-8 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10" aria-label="Scenario outcome">
      <p className="text-ql-small text-ql-secondary">One period · hypothetical values</p>
      <h2 ref={output} tabIndex={-1} className="mt-2 text-ql-section font-semibold">{run ? "See what changed" : "What will the mix do?"}</h2>
      {run ? <>
        {dirty && <p role="status" className="mt-3 text-ql-small text-ql-warning-ink">Inputs changed. Run the scenario to update this result.</p>}
        <p className="mt-6 text-ql-small text-ql-secondary">Portfolio return</p><p data-testid="portfolio-return" className="mt-1 text-ql-celebration font-bold">{pct(run.returnValue)}</p>
        <p className="mt-3 text-ql-body">{money(run.initial)} → <strong>{money(run.finalValue)}</strong></p>
        <p className="mt-2 text-ql-small text-ql-secondary">{run.weights.map((value) => value.toLocaleString("en-GB", { maximumFractionDigits: 1 })).join(" / ")} mix · Stocks / Bonds / Cash</p>
        <h3 className="mt-8 text-ql-title font-semibold">Each part contributes</h3>
        <ul className="mt-3">{portfolioAssets.map((asset, index) => <li key={asset.id} className="flex justify-between gap-4 border-b border-ql-border py-3 text-ql-small"><span>{asset.label} · {pct(run.returns[index])} return</span><strong>{pct(run.contributions[index]).replace("%", " pp")}</strong></li>)}</ul>
        <p className="mt-4 text-ql-body text-ql-secondary">Each contribution is its allocation × its return. These percentage points (pp) add up to the portfolio return.</p>
        <p className="mt-4 text-ql-body text-ql-secondary">{run.largestWeight >= 0.8 ? "At least 80% depends on one asset category. Its outcome will dominate this mix." : "This mix spreads exposure across categories. They can still fall together; allocation alone does not measure risk."}</p>
        {previous && <div className="mt-6 border-t border-ql-border pt-5" data-testid="portfolio-comparison"><h3 className="text-ql-title font-semibold">Compare your last run</h3><p className="mt-2 text-ql-body">{pct(previous.returnValue)} → {pct(run.returnValue)}</p><p className="mt-2 text-ql-small text-ql-secondary">Previous mix: {previous.weights.map((value) => value.toFixed(0)).join(" / ")}. {previous.returns.every((value, index) => value === run.returns[index]) ? "Same asset returns: the difference comes from allocation." : "Asset returns changed too. This is not an allocation-only comparison."}</p></div>}
      </> : <><p className="mt-5 text-ql-body text-ql-secondary">Stocks fall 20% in the starting example. Will a mix with bonds and cash fall by the same amount?</p><p className="mt-5 text-ql-body text-ql-secondary">Run it, change the stocks slider, and compare.</p></>}
      <p className="mt-8 text-ql-small text-ql-secondary">Invented examples, not forecasts or suggested allocations. No fees, tax, currency changes, or trades within the period. Asset categories can contain very different holdings.</p>
    </section>
  </div>;
}
