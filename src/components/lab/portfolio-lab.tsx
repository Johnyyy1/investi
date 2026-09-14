"use client";

import { Search, X } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { Button, ButtonLink, IconButton } from "@/components/ui/button";
import { Feedback } from "@/components/ui/feedback";
import { Input } from "@/components/ui/form-controls";
import type { InstrumentSearchResult } from "@/features/market-data/contracts";
import {
  buyPortfolioAction,
  loadInstrumentPreviewAction,
  resetPortfolioAction,
  searchPortfolioInstrumentsAction,
  sellPortfolioAction,
} from "@/features/portfolio/actions";
import { parseQuantity, QUANTITY_SCALE, roundDivide } from "@/features/portfolio/decimal";
import type { InstrumentPreview, PortfolioView } from "@/features/portfolio/service";
import { formatPracticeCapitalMinor } from "@/features/rewards/presentation";

type Holding = PortfolioView["holdings"][number];

function percentFromBasisPoints(value: string | null, signed = true) {
  if (value === null) return "Unavailable";
  const basisPoints = BigInt(value);
  const sign = basisPoints > 0n && signed ? "+" : basisPoints < 0n ? "−" : "";
  const absolute = basisPoints < 0n ? -basisPoints : basisPoints;
  return `${sign}${absolute / 100n}.${(absolute % 100n).toString().padStart(2, "0")}%`;
}

function quotePrice(value: string | null, currency: string | null) {
  if (!value || !currency) return "Unavailable";
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 8 }).format(Number(value))} ${currency}`;
}

function quantityLabel(value: string) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 8 }).format(Number(value));
}

function timestamp(value: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function estimatedMinor(quantity: string, unitMinor: string) {
  try { return roundDivide(parseQuantity(quantity) * BigInt(unitMinor), QUANTITY_SCALE); }
  catch { return null; }
}

function parseQuantitySafe(value: string) {
  try { return parseQuantity(value); } catch { return 0n; }
}

export function PortfolioLab({ portfolio }: { portfolio: PortfolioView }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<readonly InstrumentSearchResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [selected, setSelected] = useState<InstrumentPreview | null>(null);
  const [sellHolding, setSellHolding] = useState<Holding | null>(null);
  const [quantity, setQuantity] = useState("0.25");
  const [feedback, setFeedback] = useState<{ state: "completed" | "warning"; message: string } | null>(null);
  const [searchPending, startSearch] = useTransition();
  const [previewPending, startPreview] = useTransition();
  const [mutationPending, startMutation] = useTransition();
  const searchRef = useRef<HTMLInputElement>(null);
  const resetDialog = useRef<HTMLDialogElement>(null);
  const tradeKey = useRef<string | null>(null);
  const resetKey = useRef<string | null>(null);

  useEffect(() => {
    const normalized = query.trim();
    if (!normalized) return;
    const timeout = window.setTimeout(() => startSearch(async () => {
      const response = await searchPortfolioInstrumentsAction(normalized);
      setResults(response.results);
      setActiveIndex(response.results.length ? 0 : -1);
      if (!response.ok) setFeedback({ state: "warning", message: response.message });
    }), 180);
    return () => window.clearTimeout(timeout);
  }, [query]);

  function chooseInstrument(instrumentId: string) {
    setResults([]); setQuery(""); setFeedback(null); setQuantity("0.25"); tradeKey.current = null;
    startPreview(async () => {
      const response = await loadInstrumentPreviewAction(instrumentId);
      if (response.ok) setSelected(response.preview);
      else setFeedback({ state: "warning", message: response.message });
    });
  }

  function runTrade(side: "BUY" | "SELL") {
    const instrumentId = side === "BUY" ? selected?.instrument.instrumentId : sellHolding?.instrumentId;
    if (!instrumentId) return;
    tradeKey.current ??= crypto.randomUUID();
    setFeedback(null);
    startMutation(async () => {
      const action = side === "BUY" ? buyPortfolioAction : sellPortfolioAction;
      const response = await action({ instrumentId, quantity, clientIdempotencyKey: tradeKey.current });
      if (!response.ok) { setFeedback({ state: "warning", message: response.message }); return; }
      setFeedback({ state: "completed", message: `${side === "BUY" ? "Purchase" : "Sale"} complete. Your portfolio now shows the committed trade.` });
      setSelected(null); setSellHolding(null); setQuantity("0.25"); tradeKey.current = null;
    });
  }

  function reset() {
    resetKey.current ??= crypto.randomUUID();
    setFeedback(null);
    startMutation(async () => {
      const response = await resetPortfolioAction({ clientIdempotencyKey: resetKey.current });
      if (!response.ok) { setFeedback({ state: "warning", message: response.message }); return; }
      resetDialog.current?.close(); resetKey.current = null;
      setSelected(null); setSellHolding(null);
      setFeedback({ state: "completed", message: "Portfolio reset. All earned Practice Capital is available again." });
    });
  }

  const buyEstimate = selected ? estimatedMinor(quantity, selected.estimatedUnitCostBaseMinor) : null;
  const heldUnits = sellHolding ? parseQuantitySafe(sellHolding.quantity) : 0n;
  const sellEstimate = sellHolding?.marketValueMinor && heldUnits > 0n
    ? roundDivide(BigInt(sellHolding.marketValueMinor) * parseQuantitySafe(quantity), heldUnits)
    : null;

  return <div className="mt-8 space-y-12">
    <section aria-labelledby="portfolio-summary" className="border-y border-border py-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-small font-semibold text-primary-hover">Educational portfolio</p><h2 id="portfolio-summary" className="mt-1 text-title font-semibold">Your capital at a glance</h2></div>
        <p className="text-small text-secondary">Sample prices · base currency {portfolio.baseCurrency}</p>
      </div>
      <dl className="mt-7 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
        <div><dt className="text-small text-secondary">Practice Capital earned</dt><dd className="mt-1 text-section font-bold tabular-nums" data-testid="portfolio-earned">{formatPracticeCapitalMinor(portfolio.earnedPracticeCapitalMinor)}</dd></div>
        <div><dt className="text-small text-secondary">Portfolio value</dt><dd className="mt-1 text-section font-bold tabular-nums" data-testid="portfolio-value">{portfolio.portfolioTotalMinor === null ? "Incomplete" : formatPracticeCapitalMinor(portfolio.portfolioTotalMinor)}</dd></div>
        <div><dt className="text-small text-secondary">Available cash</dt><dd className="mt-1 text-section font-bold tabular-nums" data-testid="portfolio-cash">{formatPracticeCapitalMinor(portfolio.availableCashMinor)}</dd></div>
        <div><dt className="text-small text-secondary">Investment gain/loss</dt><dd className="mt-1 text-section font-bold tabular-nums">{portfolio.investmentGainLossMinor === null ? "Incomplete" : formatPracticeCapitalMinor(portfolio.investmentGainLossMinor)}<span className="mt-1 block text-small font-normal text-secondary">{percentFromBasisPoints(portfolio.investmentGainLossBasisPoints)} vs contributed capital</span></dd></div>
      </dl>
      {!portfolio.valuationComplete && <Feedback state="warning" role="status" className="mt-6">Some sample quotes or FX rates are unavailable, so portfolio valuation is incomplete. Missing values are not counted as zero.</Feedback>}
    </section>

    {feedback && <Feedback state={feedback.state} role={feedback.state === "warning" ? "alert" : "status"}>{feedback.message}</Feedback>}

    <section aria-labelledby="find-investment" className="max-w-2xl">
      <h2 id="find-investment" className="text-title font-semibold">Search / Add investment</h2>
      <p className="mt-2 text-body text-secondary">Search the deterministic educational dataset by symbol or name.</p>
      <div className="relative mt-5">
        <label htmlFor="instrument-search" className="text-small font-semibold">Instrument</label>
        <div className="relative mt-2"><Search aria-hidden="true" className="pointer-events-none absolute top-3.5 left-4 size-5 text-secondary" /><Input ref={searchRef} id="instrument-search" role="combobox" aria-autocomplete="list" aria-expanded={results.length > 0} aria-controls="instrument-results" aria-activedescendant={activeIndex >= 0 ? `instrument-option-${activeIndex}` : undefined} autoComplete="off" value={query} placeholder="Try AAPL, Vanguard, or bond" className="pr-11 pl-12" onChange={(event) => { setQuery(event.target.value); if (!event.target.value.trim()) { setResults([]); setActiveIndex(-1); } }} onKeyDown={(event) => {
          if (!results.length) return;
          if (event.key === "ArrowDown") { event.preventDefault(); setActiveIndex((index) => (index + 1) % results.length); }
          if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex((index) => (index - 1 + results.length) % results.length); }
          if (event.key === "Enter" && activeIndex >= 0) { event.preventDefault(); chooseInstrument(results[activeIndex].instrumentId); }
          if (event.key === "Escape") { setResults([]); setActiveIndex(-1); }
        }} />{searchPending && <span className="absolute top-3 right-4 text-small text-secondary">Searching…</span>}</div>
        {results.length > 0 && <ul id="instrument-results" role="listbox" aria-label="Instrument search results" className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-surface border border-border bg-surface p-1 shadow-elevation-2">
          {results.map((result, index) => <li key={result.instrumentId}><button id={`instrument-option-${index}`} role="option" aria-selected={index === activeIndex} type="button" className="min-h-14 w-full rounded-control px-3 py-2 text-left hover:bg-primary-soft aria-selected:bg-primary-soft" onMouseDown={(event) => event.preventDefault()} onClick={() => chooseInstrument(result.instrumentId)}><span className="font-semibold">{result.symbol}</span><span className="ml-2 text-secondary">{result.name}</span><span className="block text-small text-secondary">{result.assetType} · {result.quoteCurrency}</span></button></li>)}
        </ul>}
      </div>
      {previewPending && <p role="status" className="mt-4 text-small text-secondary">Loading sample quote…</p>}
      {selected && <div className="mt-6 border-l-4 border-primary bg-primary-soft px-5 py-5">
        <div className="flex items-start justify-between gap-4"><div><p className="font-semibold">{selected.instrument.symbol} · {selected.instrument.name}</p><p className="mt-1 text-small text-secondary">{selected.instrument.assetType} · sample quote {quotePrice(selected.price, selected.instrument.quoteCurrency)}</p></div><IconButton aria-label="Close buy interaction" variant="ghost" onClick={() => setSelected(null)}><X aria-hidden="true" /></IconButton></div>
        <p className="mt-3 text-small text-secondary">Deterministic sample data · observed {timestamp(selected.quoteObservedAt)}</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2"><div><label htmlFor="buy-quantity" className="text-small font-semibold">Quantity</label><Input id="buy-quantity" inputMode="decimal" value={quantity} aria-describedby="buy-precision" onChange={(event) => { setQuantity(event.target.value); tradeKey.current = null; }} /></div><dl className="self-end"><dt className="text-small text-secondary">Estimated CZK cost</dt><dd className="text-title font-semibold tabular-nums">{buyEstimate === null ? "—" : formatPracticeCapitalMinor(buyEstimate)}</dd><dt className="mt-1 text-small text-secondary">Available cash {formatPracticeCapitalMinor(portfolio.availableCashMinor)}</dt></dl></div>
        <p id="buy-precision" className="mt-2 text-small text-secondary">Fractional quantities are supported to 8 decimal places.</p>
        <Button className="mt-5 w-full sm:w-auto" loading={mutationPending} onClick={() => runTrade("BUY")}>Buy</Button>
      </div>}
    </section>

    <section aria-labelledby="holdings-heading">
      <h2 id="holdings-heading" className="text-title font-semibold">Holdings</h2><p className="mt-2 text-small text-secondary">Allocation is each holding’s share of invested value; available cash is excluded.</p>
      {portfolio.holdings.length === 0 ? <div className="mt-5 border-y border-border py-8">
        {BigInt(portfolio.earnedPracticeCapitalMinor) > 0n ? <><h3 className="text-title font-semibold">Your Practice Capital is ready.</h3><p className="mt-2 text-body text-secondary">You’ve earned {formatPracticeCapitalMinor(portfolio.earnedPracticeCapitalMinor)}. Use it to experiment with an educational portfolio.</p><Button className="mt-5" onClick={() => searchRef.current?.focus()}>Find an investment</Button></> : <><h3 className="text-title font-semibold">Complete lessons to earn Practice Capital.</h3><p className="mt-2 text-body text-secondary">Your portfolio is ready when you are.</p><ButtonLink href="/learn" className="mt-5">Continue learning</ButtonLink></>}
      </div> : <><div className="mt-5 hidden md:block"><HoldingsTable holdings={portfolio.holdings} onSell={(holding) => { setSellHolding(holding); setQuantity(holding.quantity); tradeKey.current = null; }} /></div><HoldingsMobile holdings={portfolio.holdings} onSell={(holding) => { setSellHolding(holding); setQuantity(holding.quantity); tradeKey.current = null; }} /></>}
    </section>

    {sellHolding && <section aria-labelledby="sell-heading" className="max-w-2xl border-l-4 border-warning bg-warning-soft px-5 py-5">
      <div className="flex items-start justify-between gap-4"><div><h2 id="sell-heading" className="text-title font-semibold">Sell {sellHolding.symbol}</h2><p className="mt-1 text-small text-secondary">Held quantity {quantityLabel(sellHolding.quantity)} · sample price {quotePrice(sellHolding.currentPrice, sellHolding.currentPriceCurrency)}</p></div><IconButton aria-label="Close sell interaction" variant="ghost" onClick={() => setSellHolding(null)}><X aria-hidden="true" /></IconButton></div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2"><div><label htmlFor="sell-quantity" className="text-small font-semibold">Quantity to sell</label><Input id="sell-quantity" inputMode="decimal" value={quantity} onChange={(event) => { setQuantity(event.target.value); tradeKey.current = null; }} /></div><dl className="self-end"><dt className="text-small text-secondary">Estimated proceeds</dt><dd className="text-title font-semibold">{sellEstimate === null ? "—" : formatPracticeCapitalMinor(sellEstimate)}</dd></dl></div>
      <Button className="mt-5 w-full sm:w-auto" loading={mutationPending} onClick={() => runTrade("SELL")}>Sell</Button>
    </section>}

    {portfolio.holdings.length > 0 && <section aria-labelledby="allocation-heading"><h2 id="allocation-heading" className="text-title font-semibold">Allocation</h2><p className="mt-2 text-small text-secondary">Share of invested value, excluding available cash.</p><ul className="mt-5 max-w-3xl space-y-4">{portfolio.holdings.map((holding, index) => <li key={holding.instrumentId}><div className="mb-2 flex justify-between gap-4 text-small"><span><strong>{holding.symbol}</strong> · {holding.name}</span><span>{percentFromBasisPoints(holding.allocationBasisPoints, false)}</span></div><div className="h-3 overflow-hidden rounded-full bg-border" role="img" aria-label={`${holding.symbol}, ${percentFromBasisPoints(holding.allocationBasisPoints, false)} of invested value`}><div className={index % 3 === 0 ? "h-full bg-primary" : index % 3 === 1 ? "h-full bg-info" : "h-full bg-warning"} style={{ width: holding.allocationBasisPoints === null ? "0%" : `${Number(holding.allocationBasisPoints) / 100}%` }} /></div></li>)}</ul></section>}

    <section aria-labelledby="activity-heading"><h2 id="activity-heading" className="text-title font-semibold">Recent activity</h2>{portfolio.recentActivity.length === 0 ? <p className="mt-3 text-body text-secondary">Your immutable trade history will appear here after your first purchase.</p> : <ul className="mt-4 divide-y divide-border border-y border-border">{portfolio.recentActivity.map((trade) => <li key={trade.id} className="grid gap-1 py-4 text-small sm:grid-cols-[5rem_1fr_auto] sm:items-center"><strong>{trade.side === "BUY" ? "Buy" : "Sell"}</strong><span>{trade.symbol} · {quantityLabel(trade.quantity)} at {quotePrice(trade.unitPrice, trade.quoteCurrency)}</span><span className="tabular-nums text-secondary">{formatPracticeCapitalMinor(trade.grossAmountBaseMinor)} · {timestamp(trade.executedAt)}</span></li>)}</ul>}</section>

    <section className="border-t border-border pt-8"><h2 className="text-title font-semibold">Reset portfolio</h2><p className="mt-2 max-w-2xl text-body text-secondary">Start a new sandbox generation with all legitimately earned Practice Capital. Learning progress and prior trade history are retained.</p><Button variant="secondary" className="mt-5" onClick={() => resetDialog.current?.showModal()}>Reset portfolio</Button></section>
    <p className="border-t border-border pt-6 text-small text-secondary">This is a virtual educational portfolio using deterministic sample data. No real money is involved, and nothing here is investment advice.</p>

    <dialog ref={resetDialog} aria-labelledby="reset-title" className="m-auto w-[min(32rem,calc(100%-2rem))] rounded-panel border border-border bg-surface p-0 text-foreground shadow-elevation-2 backdrop:bg-foreground/35"><div className="p-6"><h2 id="reset-title" className="text-title font-semibold">Reset this portfolio?</h2><p className="mt-3 text-body text-secondary">Your holdings will clear and all earned Practice Capital will become available again. Learning progress and old trades remain recorded.</p><div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button variant="secondary" disabled={mutationPending} onClick={() => resetDialog.current?.close()}>Keep portfolio</Button><Button variant="danger" loading={mutationPending} onClick={reset}>Reset portfolio</Button></div></div></dialog>
  </div>;
}

function HoldingsTable({ holdings, onSell }: { holdings: Holding[]; onSell: (holding: Holding) => void }) {
  return <table className="w-full text-left"><caption className="sr-only">Current portfolio holdings</caption><thead><tr className="border-b border-border text-small text-secondary"><th className="py-3 pr-4 font-semibold">Instrument</th><th className="px-3 py-3 font-semibold">Quantity</th><th className="px-3 py-3 font-semibold">Average cost</th><th className="px-3 py-3 font-semibold">Sample price</th><th className="px-3 py-3 font-semibold">Market value</th><th className="px-3 py-3 font-semibold">Allocation</th><th className="px-3 py-3 font-semibold">Gain/loss</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{holdings.map((holding) => <tr key={holding.instrumentId} className="border-b border-border"><td className="py-4 pr-4"><strong>{holding.symbol}</strong><span className="block text-small text-secondary">{holding.name}</span></td><td className="px-3 py-4 tabular-nums">{quantityLabel(holding.quantity)}</td><td className="px-3 py-4 tabular-nums">{formatPracticeCapitalMinor(holding.averageCostBaseMinor)}</td><td className="px-3 py-4 tabular-nums">{quotePrice(holding.currentPrice, holding.currentPriceCurrency)}</td><td className="px-3 py-4 tabular-nums">{holding.marketValueMinor === null ? "Unavailable" : formatPracticeCapitalMinor(holding.marketValueMinor)}</td><td className="px-3 py-4 tabular-nums">{percentFromBasisPoints(holding.allocationBasisPoints, false)}</td><td className="px-3 py-4 tabular-nums">{holding.gainLossMinor === null ? "Unavailable" : formatPracticeCapitalMinor(holding.gainLossMinor)}</td><td className="py-4 pl-3"><Button variant="secondary" size="compact" onClick={() => onSell(holding)}>Sell</Button></td></tr>)}</tbody></table>;
}

function HoldingsMobile({ holdings, onSell }: { holdings: Holding[]; onSell: (holding: Holding) => void }) {
  return <ul className="mt-5 space-y-5 md:hidden" aria-label="Current portfolio holdings">{holdings.map((holding) => <li key={holding.instrumentId} className="border-y border-border py-5"><div className="flex items-start justify-between gap-4"><div><strong>{holding.symbol}</strong><span className="block text-small text-secondary">{holding.name}</span></div><Button variant="secondary" size="compact" onClick={() => onSell(holding)}>Sell</Button></div><dl className="mt-4 grid grid-cols-2 gap-4 text-small"><div><dt className="text-secondary">Quantity</dt><dd className="mt-1 font-semibold">{quantityLabel(holding.quantity)}</dd></div><div><dt className="text-secondary">Market value</dt><dd className="mt-1 font-semibold">{holding.marketValueMinor === null ? "Unavailable" : formatPracticeCapitalMinor(holding.marketValueMinor)}</dd></div><div><dt className="text-secondary">Average cost</dt><dd className="mt-1">{formatPracticeCapitalMinor(holding.averageCostBaseMinor)}</dd></div><div><dt className="text-secondary">Gain/loss</dt><dd className="mt-1">{holding.gainLossMinor === null ? "Unavailable" : formatPracticeCapitalMinor(holding.gainLossMinor)}</dd></div></dl></li>)}</ul>;
}
