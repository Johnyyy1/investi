"use client";

import { ArrowLeft, Check, ChevronRight, Ellipsis, Search, X } from "lucide-react";
import { useEffect, useRef, useState, useTransition, type MouseEvent, type RefObject } from "react";
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
type Notice = { state: "completed" | "warning"; title: string; detail?: string };
type SearchState = "idle" | "loading" | "results" | "empty" | "error";

const allocationColors = ["bg-data-1", "bg-data-2", "bg-data-3", "bg-data-4"];

function percentFromBasisPoints(value: string | null, signed = true) {
  if (value === null) return "Unavailable";
  const basisPoints = BigInt(value);
  const sign = basisPoints > 0n && signed ? "+" : basisPoints < 0n ? "−" : "";
  const absolute = basisPoints < 0n ? -basisPoints : basisPoints;
  return `${sign}${absolute / 100n}.${(absolute % 100n).toString().padStart(2, "0")}%`;
}

function signedMoney(value: string | null) {
  if (value === null) return "Incomplete";
  const amount = BigInt(value);
  return `${amount > 0n ? "+" : ""}${formatPracticeCapitalMinor(value)}`;
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

function assetTypeLabel(value: string | null) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : "Security";
}

function dataSourceLabel(mode: PortfolioView["marketDataMode"]) {
  return mode === "sample" ? "Sample data" : "Market observations";
}

function unavailableLabel(reason: Holding["unavailableReason"]) {
  if (reason === "fx") return "CZK exchange rate unavailable";
  if (reason === "instrument") return "Unavailable from this data source";
  if (reason === "rate-limit") return "Market data rate limited";
  if (reason === "provider") return "Market-data provider unavailable";
  return "Current quote unavailable";
}

function restoreTriggerFocus(trigger: HTMLButtonElement | null, fallback: HTMLButtonElement | null) {
  (trigger?.isConnected ? trigger : fallback?.isConnected ? fallback : null)?.focus();
}

function portfolioUiSignature(portfolio: PortfolioView) {
  return `${portfolio.availableCashMinor}|${portfolio.holdings.map(({ instrumentId, quantity, marketValueMinor }) => `${instrumentId}:${quantity}:${marketValueMinor}`).join("|")}`;
}

export function PortfolioLab({ portfolio }: { portfolio: PortfolioView }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<readonly InstrumentSearchResult[]>([]);
  const [searchState, setSearchState] = useState<SearchState>("idle");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [selected, setSelected] = useState<InstrumentPreview | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [sellHolding, setSellHolding] = useState<Holding | null>(null);
  const [quantity, setQuantity] = useState("0.25");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [holdingMenu, setHoldingMenu] = useState<string | null>(null);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [, startSearch] = useTransition();
  const [previewPending, startPreview] = useTransition();
  const [mutationPending, startMutation] = useTransition();
  const searchRef = useRef<HTMLInputElement>(null);
  const orderHeadingRef = useRef<HTMLHeadingElement>(null);
  const investDialog = useRef<HTMLDialogElement>(null);
  const sellDialog = useRef<HTMLDialogElement>(null);
  const resetDialog = useRef<HTMLDialogElement>(null);
  const investReturnFocus = useRef<HTMLButtonElement | null>(null);
  const sellReturnFocus = useRef<HTMLButtonElement | null>(null);
  const resetReturnFocus = useRef<HTMLButtonElement | null>(null);
  const optionsButtonRef = useRef<HTMLButtonElement>(null);
  const primaryInvestRef = useRef<HTMLButtonElement>(null);
  const tradeKey = useRef<string | null>(null);
  const resetKey = useRef<string | null>(null);
  const searchRequest = useRef(0);
  const previewRequest = useRef(0);
  const focusAfterPortfolioChange = useRef<{ signature: string; targetId: string } | null>(null);
  const hasCapital = BigInt(portfolio.earnedPracticeCapitalMinor) > 0n;
  const hasHoldings = portfolio.holdings.length > 0;

  useEffect(() => {
    if (!notice || notice.state !== "completed") return;
    const timeout = window.setTimeout(() => setNotice(null), 6000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  useEffect(() => {
    const normalized = query.trim();
    const request = ++searchRequest.current;
    if (normalized.length < 2) return;
    const timeout = window.setTimeout(() => startSearch(async () => {
      const response = await searchPortfolioInstrumentsAction(normalized);
      if (request !== searchRequest.current) return;
      setResults(response.results);
      setActiveIndex(response.results.length ? 0 : -1);
      if (!response.ok) {
        setSearchState("error");
        setSheetError(response.message);
      } else {
        setSearchState(response.results.length ? "results" : "empty");
      }
    }), 250);
    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    const pending = focusAfterPortfolioChange.current;
    if (!pending || portfolioUiSignature(portfolio) !== pending.signature) return;
    focusAfterPortfolioChange.current = null;
    const target = document.getElementById(pending.targetId) as HTMLButtonElement | null;
    restoreTriggerFocus(target, primaryInvestRef.current);
  }, [portfolio]);

  function resetInvestFlow() {
    searchRequest.current += 1;
    previewRequest.current += 1;
    setQuery("");
    setResults([]);
    setSearchState("idle");
    setActiveIndex(-1);
    setSelected(null);
    setReviewing(false);
    setQuantity("0.25");
    setSheetError(null);
    tradeKey.current = null;
  }

  function openInvest(event: MouseEvent<HTMLButtonElement>) {
    investReturnFocus.current = event.currentTarget;
    resetInvestFlow();
    investDialog.current?.showModal();
    requestAnimationFrame(() => searchRef.current?.focus());
  }

  function closeInvest() {
    if (!mutationPending) investDialog.current?.close();
  }

  function chooseInstrument(instrumentId: string) {
    const request = ++previewRequest.current;
    setResults([]);
    setSearchState("idle");
    setQuery("");
    setSheetError(null);
    setQuantity("0.25");
    setReviewing(false);
    tradeKey.current = null;
    startPreview(async () => {
      const response = await loadInstrumentPreviewAction(instrumentId);
      if (request !== previewRequest.current) return;
      if (response.ok) {
        setSelected(response.preview);
        requestAnimationFrame(() => orderHeadingRef.current?.focus({ preventScroll: true }));
      } else setSheetError(response.message);
    });
  }

  function returnToSearch() {
    previewRequest.current += 1;
    setSelected(null);
    setReviewing(false);
    setSheetError(null);
    requestAnimationFrame(() => searchRef.current?.focus());
  }

  function openSell(holding: Holding, trigger: HTMLButtonElement) {
    sellReturnFocus.current = document.getElementById(`holding-actions-${holding.instrumentId}`) as HTMLButtonElement | null ?? trigger;
    setHoldingMenu(null);
    setSellHolding(holding);
    setQuantity(holding.quantity);
    setSheetError(null);
    tradeKey.current = null;
    sellDialog.current?.showModal();
  }

  function closeSell() {
    if (!mutationPending) sellDialog.current?.close();
  }

  const buyEstimate = selected ? estimatedMinor(quantity, selected.estimatedUnitCostBaseMinor) : null;
  const heldUnits = sellHolding ? parseQuantitySafe(sellHolding.quantity) : 0n;
  const sellEstimate = sellHolding?.marketValueMinor && heldUnits > 0n
    ? roundDivide(BigInt(sellHolding.marketValueMinor) * parseQuantitySafe(quantity), heldUnits)
    : null;

  function runTrade(side: "BUY" | "SELL") {
    if (mutationPending) return;
    const instrumentId = side === "BUY" ? selected?.instrument.instrumentId : sellHolding?.instrumentId;
    const symbol = side === "BUY" ? selected?.instrument.symbol : sellHolding?.symbol;
    const estimate = side === "BUY" ? buyEstimate : sellEstimate;
    if (!instrumentId || !symbol) return;
    const completedQuantity = quantity;
    tradeKey.current ??= crypto.randomUUID();
    setSheetError(null);
    startMutation(async () => {
      const action = side === "BUY" ? buyPortfolioAction : sellPortfolioAction;
      const response = await action({ instrumentId, quantity, clientIdempotencyKey: tradeKey.current });
      if (!response.ok) { setSheetError(response.message); return; }
      focusAfterPortfolioChange.current = {
        signature: portfolioUiSignature(response.portfolio),
        targetId: side === "BUY" ? "portfolio-primary-invest" : `holding-actions-${instrumentId}`,
      };
      if (side === "BUY") investDialog.current?.close();
      else sellDialog.current?.close();
      setNotice({
        state: "completed",
        title: side === "BUY" ? "Investment added" : "Investment sold",
        detail: `${quantityLabel(completedQuantity)} ${symbol}${estimate === null ? "" : ` · ${formatPracticeCapitalMinor(estimate)}`}`,
      });
      setSelected(null);
      setSellHolding(null);
      setReviewing(false);
      setQuantity("0.25");
      tradeKey.current = null;
    });
  }

  function openReset(event: MouseEvent<HTMLButtonElement>) {
    resetReturnFocus.current = optionsButtonRef.current ?? event.currentTarget;
    setOptionsOpen(false);
    setResetError(null);
    resetDialog.current?.showModal();
  }

  function reset() {
    if (mutationPending) return;
    resetKey.current ??= crypto.randomUUID();
    setResetError(null);
    startMutation(async () => {
      const response = await resetPortfolioAction({ clientIdempotencyKey: resetKey.current });
      if (!response.ok) { setResetError(response.message); return; }
      focusAfterPortfolioChange.current = { signature: portfolioUiSignature(response.portfolio), targetId: "portfolio-primary-invest" };
      resetDialog.current?.close();
      resetKey.current = null;
      setSelected(null);
      setSellHolding(null);
      setNotice({ state: "completed", title: "Portfolio reset", detail: "All earned Practice Capital is available again." });
    });
  }

  return <>
    <header className="mt-3 flex flex-wrap items-start justify-between gap-5">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="break-words text-page-title font-bold tracking-[-0.025em]">Portfolio Lab</h1>
          <span className="rounded-pill border border-info/35 bg-info-soft px-3 py-1 text-microcopy font-bold text-info-ink">{dataSourceLabel(portfolio.marketDataMode)}</span>
        </div>
        <p className="mt-3 max-w-2xl text-small text-secondary">A virtual educational portfolio. No real money is involved.</p>
      </div>
      {hasCapital ? <Button id="portfolio-primary-invest" ref={primaryInvestRef} onClick={openInvest} className="w-full sm:w-auto"><span aria-hidden="true">+</span> Invest</Button> : null}
    </header>

    <div className="mt-8 space-y-10 lg:mt-10">
      {notice ? <Feedback state={notice.state} role={notice.state === "warning" ? "alert" : "status"} className="max-w-xl shadow-elevation-1">
        <div className="flex items-start gap-3"><Check aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-success-ink" /><div className="min-w-0 flex-1 break-words"><p className="font-bold">{notice.title}</p>{notice.detail ? <p className="mt-0.5 text-small text-secondary">{notice.detail}</p> : null}</div><IconButton aria-label="Dismiss confirmation" variant="ghost" className="-my-2 -mr-2 size-11 min-h-0 p-0" onClick={() => setNotice(null)}><X aria-hidden="true" /></IconButton></div>
      </Feedback> : null}

      {!hasCapital ? <ZeroCapitalState portfolio={portfolio} /> : <>
        <PortfolioSummary portfolio={portfolio} />
        {!portfolio.valuationComplete ? <Feedback state="warning" role="status">{portfolio.valuedHoldingsCount} of {portfolio.totalHoldingsCount} positions currently valued. Unavailable positions are not counted as zero, so the portfolio total is incomplete.</Feedback> : null}

        {!hasHoldings ? <EmptyPortfolioState earned={portfolio.earnedPracticeCapitalMinor} onInvest={openInvest} /> : <section aria-labelledby="holdings-heading" className="grid gap-8 border-t border-border pt-8 lg:grid-cols-[minmax(0,1.8fr)_minmax(16rem,0.8fr)] lg:gap-12">
          <div className="min-w-0">
            <div className="flex flex-wrap items-end justify-between gap-4"><div className="min-w-0"><p className="break-words text-microcopy font-bold uppercase tracking-[0.12em] text-secondary">Your portfolio</p><h2 id="holdings-heading" className="mt-1 break-words text-section-title font-bold">Holdings</h2></div><span className="break-words text-small text-secondary">{portfolio.holdings.length} {portfolio.holdings.length === 1 ? "investment" : "investments"}</span></div>
            <HoldingsList holdings={portfolio.holdings} openMenu={holdingMenu} onToggleMenu={(instrumentId) => setHoldingMenu((current) => current === instrumentId ? null : instrumentId)} onSell={openSell} />
          </div>
          <AllocationSummary holdings={portfolio.holdings} />
        </section>}

        {portfolio.recentActivity.length > 0 ? <ActivityList activity={portfolio.recentActivity} /> : null}

        {(hasHoldings || portfolio.recentActivity.length > 0) ? <div className="relative flex justify-end border-t border-border pt-5">
          <Button ref={optionsButtonRef} variant="ghost" size="compact" aria-haspopup="menu" aria-expanded={optionsOpen} onClick={() => setOptionsOpen((open) => !open)} onKeyDown={(event) => { if (event.key === "Escape") { setOptionsOpen(false); event.currentTarget.focus(); } }}><Ellipsis aria-hidden="true" className="size-5" />Portfolio options</Button>
          {optionsOpen ? <div role="menu" aria-label="Portfolio options" className="absolute right-0 bottom-12 z-10 min-w-52 rounded-control border border-border bg-surface p-1 shadow-elevation-2"><button type="button" role="menuitem" className="flex min-h-12 w-full items-center rounded-control px-4 text-left text-small font-semibold text-danger-ink hover:bg-danger-soft focus-visible:bg-danger-soft" onClick={openReset}>Reset portfolio</button></div> : null}
        </div> : null}
      </>}
    </div>

    <dialog ref={investDialog} aria-labelledby="invest-title" aria-describedby="invest-description" onClose={() => { resetInvestFlow(); restoreTriggerFocus(investReturnFocus.current, primaryInvestRef.current); requestAnimationFrame(() => restoreTriggerFocus(investReturnFocus.current, primaryInvestRef.current)); }} onCancel={(event) => { if (mutationPending) event.preventDefault(); }} className="fixed inset-y-0 right-0 left-auto m-0 h-[100dvh] max-h-none w-full max-w-none overflow-y-auto border-0 border-l border-border bg-surface p-0 text-foreground shadow-elevation-2 backdrop:bg-foreground/35 sm:max-w-[34rem] sm:rounded-l-panel">
      <div className="flex min-h-full flex-col">
        <div className="sticky top-0 z-20 flex flex-wrap items-start justify-between gap-4 border-b border-border bg-surface/95 px-[min(1.25rem,5vw)] py-5 backdrop-blur sm:px-7">
          <div className="min-w-0 flex-1"><p className="whitespace-nowrap text-microcopy font-bold uppercase tracking-[0.12em] text-primary-hover">{selected ? reviewing ? "Step 3 of 3" : "Step 2 of 3" : "Step 1 of 3"}</p><h2 id="invest-title" className="mt-1 break-words text-card-title font-bold">Invest Practice Capital</h2><p id="invest-description" className="sr-only">Search for an investment, choose a quantity, review it, then confirm your purchase.</p></div>
          <IconButton aria-label="Close investment flow" variant="ghost" className="shrink-0" disabled={mutationPending} onClick={closeInvest}><X aria-hidden="true" /></IconButton>
        </div>

        <div className="flex-1 px-[min(1.25rem,5vw)] py-6 sm:px-7 sm:py-8">
          {sheetError ? <Feedback state="warning" role="alert" className="mb-5">{sheetError}</Feedback> : null}
          {!selected ? <SearchStep query={query} results={results} activeIndex={activeIndex} state={searchState} pending={searchState === "loading" || previewPending} sourceMode={portfolio.marketDataMode} searchRef={searchRef} onQueryChange={(value) => { const normalized = value.trim(); searchRequest.current += 1; setQuery(value); setSheetError(null); setResults([]); setActiveIndex(-1); setSearchState(normalized.length >= 2 ? "loading" : "idle"); }} onActiveIndexChange={setActiveIndex} onChoose={chooseInstrument} /> : reviewing ? <BuyReview preview={selected} quantity={quantity} estimate={buyEstimate} availableCash={portfolio.availableCashMinor} onBack={() => { setReviewing(false); requestAnimationFrame(() => orderHeadingRef.current?.focus()); }} /> : <BuyOrder preview={selected} quantity={quantity} estimate={buyEstimate} availableCash={portfolio.availableCashMinor} headingRef={orderHeadingRef} onBack={returnToSearch} onQuantityChange={(value) => { setQuantity(value); setSheetError(null); tradeKey.current = null; }} />}
        </div>

        {selected ? <div className="sticky bottom-0 z-20 border-t border-border bg-surface/95 px-[min(1.25rem,5vw)] py-4 backdrop-blur sm:px-7">
          {reviewing ? <Button className="w-full" loading={mutationPending} onClick={() => runTrade("BUY")}>Confirm buy {selected.instrument.symbol}</Button> : <Button className="w-full" disabled={buyEstimate === null || parseQuantitySafe(quantity) <= 0n} onClick={() => { setReviewing(true); setSheetError(null); }}>Review order <ChevronRight aria-hidden="true" className="size-4" /></Button>}
        </div> : null}
      </div>
    </dialog>

    <dialog ref={sellDialog} aria-labelledby="sell-heading" aria-describedby="sell-description" onClose={() => { setSellHolding(null); setSheetError(null); restoreTriggerFocus(sellReturnFocus.current, primaryInvestRef.current); requestAnimationFrame(() => restoreTriggerFocus(sellReturnFocus.current, primaryInvestRef.current)); }} onCancel={(event) => { if (mutationPending) event.preventDefault(); }} className="fixed inset-y-0 right-0 left-auto m-0 h-[100dvh] max-h-none w-full max-w-none overflow-y-auto border-0 border-l border-border bg-surface p-0 text-foreground shadow-elevation-2 backdrop:bg-foreground/35 sm:max-w-[31rem] sm:rounded-l-panel">
      {sellHolding ? <div className="flex min-h-full flex-col">
        <div className="sticky top-0 z-20 flex flex-wrap items-start justify-between gap-4 border-b border-border bg-surface/95 px-[min(1.25rem,5vw)] py-5 backdrop-blur sm:px-7"><div className="min-w-0 flex-1"><p className="text-microcopy font-bold uppercase tracking-[0.12em] text-secondary">Sell investment</p><h2 id="sell-heading" className="mt-1 break-words text-card-title font-bold">Sell {sellHolding.symbol}</h2><p id="sell-description" className="sr-only">Choose the quantity of {sellHolding.symbol} to sell and review the estimated proceeds.</p></div><IconButton aria-label="Close sell flow" variant="ghost" className="shrink-0" disabled={mutationPending} onClick={closeSell}><X aria-hidden="true" /></IconButton></div>
        <div className="flex-1 px-[min(1.25rem,5vw)] py-6 sm:px-7 sm:py-8">
          {sheetError ? <Feedback state="warning" role="alert" className="mb-5">{sheetError}</Feedback> : null}
          <div className="rounded-surface bg-surface-muted p-[min(1.25rem,5vw)]"><p className="font-bold">{sellHolding.name}</p><dl className="mt-4 grid grid-cols-1 gap-4 text-small sm:grid-cols-2"><div><dt className="text-secondary">Held</dt><dd className="mt-1 font-bold tabular-nums">{quantityLabel(sellHolding.quantity)} shares</dd></div><div><dt className="text-secondary">Current observed price</dt><dd className="mt-1 font-bold tabular-nums">{quotePrice(sellHolding.currentPrice, sellHolding.currentPriceCurrency)}</dd></div></dl></div>
          <div className="mt-7"><label htmlFor="sell-quantity" className="text-small font-bold">Quantity to sell</label><Input id="sell-quantity" className="mt-2 tabular-nums" inputMode="decimal" value={quantity} onChange={(event) => { setQuantity(event.target.value); setSheetError(null); tradeKey.current = null; }} /></div>
          <dl className="mt-7 border-y border-border py-5"><div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2"><dt className="min-w-0 text-small text-secondary">Estimated proceeds</dt><dd className="min-w-0 break-words text-right text-card-title font-bold">{sellEstimate === null ? "—" : formatPracticeCapitalMinor(sellEstimate)}</dd></div></dl>
          <p className="mt-5 text-small text-secondary">The displayed value is an estimate. The server obtains a fresh security reference price and a dated reference FX rate for the simulated sale.</p>
        </div>
        <div className="sticky bottom-0 z-20 border-t border-border bg-surface/95 px-[min(1.25rem,5vw)] py-4 backdrop-blur sm:px-7"><Button className="w-full" loading={mutationPending} disabled={sellEstimate === null || parseQuantitySafe(quantity) <= 0n} onClick={() => runTrade("SELL")}>Sell {sellHolding.symbol}</Button></div>
      </div> : null}
    </dialog>

    <dialog ref={resetDialog} aria-labelledby="reset-title" aria-describedby="reset-description" onClose={() => { setResetError(null); restoreTriggerFocus(resetReturnFocus.current, primaryInvestRef.current); requestAnimationFrame(() => restoreTriggerFocus(resetReturnFocus.current, primaryInvestRef.current)); }} onCancel={(event) => { if (mutationPending) event.preventDefault(); }} className="m-auto w-[min(32rem,92vw)] rounded-panel border border-border bg-surface p-0 text-foreground shadow-elevation-2 backdrop:bg-foreground/35">
      <div className="px-[min(1.5rem,6vw)] py-5 sm:px-[min(1.75rem,6vw)] sm:py-7"><h2 id="reset-title" className="text-card-title font-bold">Reset this portfolio?</h2><p id="reset-description" className="mt-3 text-body text-secondary">Your holdings will clear and all earned Practice Capital will become available again. Learning progress and old trades remain recorded.</p>{resetError ? <Feedback state="warning" role="alert" className="mt-5">{resetError}</Feedback> : null}<div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button variant="secondary" disabled={mutationPending} onClick={() => resetDialog.current?.close()}>Keep portfolio</Button><Button variant="danger" loading={mutationPending} onClick={reset}>Reset portfolio</Button></div></div>
    </dialog>
  </>;
}

function ZeroCapitalState({ portfolio }: { portfolio: PortfolioView }) {
  return <section aria-labelledby="zero-capital-title" className="overflow-hidden rounded-panel border border-border bg-surface shadow-elevation-1"><div className="px-5 py-8 sm:px-8 sm:py-10"><p className="text-small font-bold text-primary-hover">Practice Capital <span data-testid="portfolio-earned">{formatPracticeCapitalMinor(portfolio.earnedPracticeCapitalMinor)}</span></p><h2 id="zero-capital-title" className="mt-3 text-section-title font-bold">Build capital by learning</h2><p className="mt-3 max-w-xl text-body text-secondary">Complete lessons to earn Practice Capital before building your educational portfolio.</p><ButtonLink href="/learn" className="mt-6 w-full sm:w-auto">Continue learning</ButtonLink></div></section>;
}

function PortfolioSummary({ portfolio }: { portfolio: PortfolioView }) {
  const gain = portfolio.investmentGainLossMinor === null ? null : BigInt(portfolio.investmentGainLossMinor);
  const tone = gain === null || gain === 0n ? "text-secondary" : gain > 0n ? "text-success-ink" : "text-danger-ink";
  return <section aria-labelledby="portfolio-value-label" className="border-y border-border py-7 sm:py-9"><div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(20rem,0.8fr)] lg:items-end"><div><p id="portfolio-value-label" className="text-small font-bold text-secondary">Portfolio value</p><p className="mt-2 break-words text-[clamp(2.75rem,2.2rem+2vw,4.5rem)] leading-none font-extrabold tracking-[-0.04em] tabular-nums" data-testid="portfolio-value">{portfolio.portfolioTotalMinor === null ? "Incomplete" : formatPracticeCapitalMinor(portfolio.portfolioTotalMinor)}</p><div className={`mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1 tabular-nums ${tone}`}><span className="text-body font-bold">{signedMoney(portfolio.investmentGainLossMinor)} · {percentFromBasisPoints(portfolio.investmentGainLossBasisPoints)}</span><span className="text-small text-secondary">Investment gain/loss · percentage of Practice Capital earned</span></div></div><dl className="grid grid-cols-2 gap-x-5 gap-y-6 border-t border-border pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8"><div><dt className="text-small text-secondary">Available cash</dt><dd className="mt-1 break-words text-card-title font-bold tabular-nums" data-testid="portfolio-cash">{formatPracticeCapitalMinor(portfolio.availableCashMinor)}</dd></div><div><dt className="text-small text-secondary">Practice Capital earned</dt><dd className="mt-1 break-words text-card-title font-bold tabular-nums" data-testid="portfolio-earned">{formatPracticeCapitalMinor(portfolio.earnedPracticeCapitalMinor)}</dd></div></dl></div></section>;
}

function EmptyPortfolioState({ earned, onInvest }: { earned: string; onInvest: (event: MouseEvent<HTMLButtonElement>) => void }) {
  return <section aria-labelledby="empty-portfolio-title" className="overflow-hidden rounded-panel border border-primary/25 bg-surface shadow-elevation-1"><div className="grid gap-7 px-5 py-8 sm:px-8 sm:py-10 md:grid-cols-[minmax(0,1.25fr)_minmax(16rem,0.75fr)] md:items-center"><div><p className="text-small font-bold text-primary-hover">Your Practice Capital is ready</p><h2 id="empty-portfolio-title" className="mt-2 text-section-title font-bold">Build your first educational portfolio</h2><p className="mt-3 text-body text-secondary">You’ve earned {formatPracticeCapitalMinor(earned)} to explore how investing works.</p><Button className="mt-6 w-full sm:w-auto" onClick={onInvest}>Make your first investment</Button></div><ol className="space-y-4 text-small"><li className="flex gap-3"><span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-soft font-bold text-primary-hover">1</span><span className="pt-0.5">Find an investment</span></li><li className="flex gap-3"><span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-soft font-bold text-primary-hover">2</span><span className="pt-0.5">Choose how much to invest</span></li><li className="flex gap-3"><span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-soft font-bold text-primary-hover">3</span><span className="pt-0.5">See it become part of your portfolio</span></li></ol></div></section>;
}

function SearchStep({ query, results, activeIndex, state, pending, sourceMode, searchRef, onQueryChange, onActiveIndexChange, onChoose }: { query: string; results: readonly InstrumentSearchResult[]; activeIndex: number; state: SearchState; pending: boolean; sourceMode: PortfolioView["marketDataMode"]; searchRef: RefObject<HTMLInputElement | null>; onQueryChange: (value: string) => void; onActiveIndexChange: (index: number) => void; onChoose: (instrumentId: string) => void }) {
  return <section aria-labelledby="search-investments-title"><h3 id="search-investments-title" className="text-section-title font-bold">Find an investment</h3><p className="mt-2 text-body text-secondary">Search by company, fund, bond, or ticker symbol.</p><div className="relative mt-6"><label htmlFor="instrument-search" className="text-small font-bold">Search investments</label><div className="relative mt-2"><Search aria-hidden="true" className="pointer-events-none absolute top-3.5 left-4 size-5 text-secondary" /><Input ref={searchRef} id="instrument-search" role="combobox" aria-autocomplete="list" aria-expanded={results.length > 0} aria-controls="instrument-results" aria-activedescendant={activeIndex >= 0 ? `instrument-option-${activeIndex}` : undefined} aria-busy={pending || undefined} autoComplete="off" value={query} placeholder="Search stocks, ETFs, bonds…" className="pr-12 pl-12" onChange={(event) => onQueryChange(event.target.value)} onKeyDown={(event) => { if (!results.length) return; if (event.key === "ArrowDown") { event.preventDefault(); onActiveIndexChange((activeIndex + 1) % results.length); } if (event.key === "ArrowUp") { event.preventDefault(); onActiveIndexChange((activeIndex - 1 + results.length) % results.length); } if (event.key === "Enter" && activeIndex >= 0) { event.preventDefault(); onChoose(results[activeIndex].instrumentId); } if (event.key === "Escape") { event.stopPropagation(); onActiveIndexChange(-1); } }} />{pending ? <span className="absolute top-3.5 right-4 text-small text-secondary">…</span> : null}</div></div>{results.length > 0 ? <ul id="instrument-results" role="listbox" aria-label="Instrument search results" className="mt-3 divide-y divide-border overflow-hidden rounded-surface border border-border bg-surface shadow-elevation-1">{results.map((result, index) => { const exchange = result.exchangeMic ?? result.exchangeCode; return <li key={result.instrumentId} id={`instrument-option-${index}`} role="option" aria-selected={index === activeIndex} aria-label={`${result.symbol} ${result.name}, ${assetTypeLabel(result.assetType)}, ${exchange ?? "exchange unavailable"}, ${result.quoteCurrency}`} className="aria-selected:bg-primary-soft"><button type="button" tabIndex={-1} className="flex min-h-16 w-full flex-col items-start gap-2 px-4 py-3 text-left hover:bg-primary-soft sm:flex-row sm:items-center sm:justify-between" onMouseDown={(event) => event.preventDefault()} onClick={() => onChoose(result.instrumentId)}><span className="w-full min-w-0 sm:w-auto"><strong className="block">{result.symbol}</strong><span className="block truncate text-small text-secondary">{result.name}</span></span><span className="w-full shrink-0 text-left text-microcopy text-secondary sm:w-auto sm:text-right"><span className="block font-semibold">{assetTypeLabel(result.assetType)} · {result.quoteCurrency}</span><span className="block">{exchange ? `${exchange} · ` : ""}{dataSourceLabel(sourceMode)}</span></span></button></li>; })}</ul> : state === "empty" ? <p role="status" className="mt-5 text-small text-secondary">No investments found. Try another company name or symbol.</p> : state === "loading" ? <p role="status" className="mt-5 text-small text-secondary">Searching market data…</p> : state === "error" ? null : <div className="mt-8 border-t border-border pt-6"><p className="text-small font-bold">Try a search</p><p className="mt-1 text-small text-secondary">Enter at least two characters from a company name or ticker.</p></div>}</section>;
}

function BuyOrder({ preview, quantity, estimate, availableCash, headingRef, onBack, onQuantityChange }: { preview: InstrumentPreview; quantity: string; estimate: bigint | null; availableCash: string; headingRef: RefObject<HTMLHeadingElement | null>; onBack: () => void; onQuantityChange: (value: string) => void }) {
  return <section aria-labelledby="buy-order-title"><button type="button" className="mb-5 inline-flex min-h-11 items-center gap-2 text-small font-bold text-primary-hover" onClick={onBack}><ArrowLeft aria-hidden="true" className="size-4" />Back to search</button><h3 id="buy-order-title" ref={headingRef} tabIndex={-1} className="text-section-title font-bold focus-visible:!outline-none">Choose quantity</h3><div className="mt-5 rounded-surface bg-surface-muted p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0 flex-1"><p className="break-words text-card-title font-bold">{preview.instrument.name}</p><p className="mt-1 text-small text-secondary">{preview.instrument.symbol} · {assetTypeLabel(preview.instrument.assetType)}{preview.instrument.exchangeMic ? ` · ${preview.instrument.exchangeMic}` : ""}</p></div><span className="shrink-0 rounded-pill border border-info/35 bg-info-soft px-3 py-1 text-microcopy font-bold text-info-ink">{dataSourceLabel(preview.marketDataMode)}</span></div><dl className="mt-5 grid grid-cols-2 gap-4 text-small"><div className="min-w-0"><dt className="text-secondary">Observed reference price</dt><dd className="mt-1 break-words font-bold tabular-nums">{quotePrice(preview.price, preview.instrument.quoteCurrency)}</dd><dd className="mt-1 text-microcopy text-secondary">As of {timestamp(preview.quoteObservedAt)}</dd>{preview.instrument.quoteCurrency !== "CZK" ? <dd className="mt-1 text-microcopy text-secondary">Reference FX date {preview.fxReferenceDate}</dd> : null}</div><div className="min-w-0"><dt className="text-secondary">Available cash</dt><dd className="mt-1 break-words font-bold tabular-nums">{formatPracticeCapitalMinor(availableCash)}</dd></div></dl></div><div className="mt-7"><label htmlFor="buy-quantity" className="text-small font-bold">Quantity</label><Input id="buy-quantity" className="mt-2 tabular-nums" inputMode="decimal" value={quantity} aria-describedby="buy-precision" onChange={(event) => onQuantityChange(event.target.value)} /><p id="buy-precision" className="mt-2 text-small text-secondary">Fractional quantities are supported to 8 decimal places.</p></div><dl className="mt-7 border-y border-border py-5"><div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2"><dt className="min-w-0 text-small text-secondary">Estimated cost</dt><dd className="min-w-0 break-words text-right text-card-title font-bold tabular-nums">{estimate === null ? "—" : formatPracticeCapitalMinor(estimate)}</dd></div></dl></section>;
}

function BuyReview({ preview, quantity, estimate, availableCash, onBack }: { preview: InstrumentPreview; quantity: string; estimate: bigint | null; availableCash: string; onBack: () => void }) {
  return <section aria-labelledby="buy-review-title"><button type="button" className="mb-5 inline-flex min-h-11 items-center gap-2 text-small font-bold text-primary-hover" onClick={onBack}><ArrowLeft aria-hidden="true" className="size-4" />Edit order</button><h3 id="buy-review-title" className="text-section-title font-bold">Review your investment</h3><p className="mt-2 text-body text-secondary">Check the details before adding it to your portfolio.</p><div className="mt-6 overflow-hidden rounded-surface border border-border"><div className="bg-surface-muted px-5 py-4"><p className="break-words font-bold">{preview.instrument.name}</p><p className="break-words text-small text-secondary">{preview.instrument.symbol} · {assetTypeLabel(preview.instrument.assetType)} · {dataSourceLabel(preview.marketDataMode)}</p></div><dl className="divide-y divide-border px-5 text-small"><div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 py-4"><dt className="min-w-0 text-secondary">Quantity</dt><dd className="min-w-0 break-words text-right font-bold tabular-nums">{quantityLabel(quantity)}</dd></div><div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 py-4"><dt className="min-w-0 text-secondary">Observed reference price</dt><dd className="min-w-0 break-words text-right font-bold tabular-nums">{quotePrice(preview.price, preview.instrument.quoteCurrency)}</dd></div><div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 py-4"><dt className="min-w-0 text-secondary">Estimated cost</dt><dd className="min-w-0 break-words text-right font-bold tabular-nums">{estimate === null ? "—" : formatPracticeCapitalMinor(estimate)}</dd></div><div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 py-4"><dt className="min-w-0 text-secondary">Available cash</dt><dd className="min-w-0 break-words text-right font-bold tabular-nums">{formatPracticeCapitalMinor(availableCash)}</dd></div></dl></div><p className="mt-5 break-words text-small text-secondary">Portfolio Lab simulates immediate execution using a fresh current/last security price and a dated reference FX rate. It does not model broker FX execution, bid/ask, spreads, or slippage; the final observations may differ from this estimate.</p></section>;
}

function HoldingsList({ holdings, openMenu, onToggleMenu, onSell }: { holdings: Holding[]; openMenu: string | null; onToggleMenu: (instrumentId: string) => void; onSell: (holding: Holding, trigger: HTMLButtonElement) => void }) {
  return <ul className="mt-5 divide-y divide-border border-y border-border" aria-label="Current portfolio holdings">{holdings.map((holding) => <li key={holding.instrumentId} data-testid={`holding-${holding.symbol}`} className="relative py-5"><div className="grid gap-5 pr-14 sm:grid-cols-[minmax(0,1.2fr)_minmax(8rem,0.7fr)_minmax(7rem,0.65fr)] sm:items-start"><div className="min-w-0"><strong className="text-card-title">{holding.symbol}</strong><span className="mt-0.5 block truncate text-small text-secondary">{holding.name}</span><span className="mt-2 block text-small tabular-nums">{quantityLabel(holding.quantity)} shares</span>{holding.marketValueMinor === null ? <span className="mt-2 block text-microcopy font-semibold text-warning-ink">{unavailableLabel(holding.unavailableReason)}</span> : null}</div><div><p className="text-microcopy text-secondary">Market value</p><p className="mt-1 font-bold tabular-nums">{holding.marketValueMinor === null ? "Unavailable" : formatPracticeCapitalMinor(holding.marketValueMinor)}</p><p className="mt-1 text-microcopy text-secondary">Allocation {percentFromBasisPoints(holding.allocationBasisPoints, false)}</p></div><div><p className="text-microcopy text-secondary">Gain/loss</p><p className="mt-1 font-bold tabular-nums">{holding.gainLossMinor === null ? "Unavailable" : signedMoney(holding.gainLossMinor)}</p></div></div><details className="group mt-4"><summary className="inline-flex min-h-11 cursor-pointer list-none items-center text-small font-bold text-primary-hover [&::-webkit-details-marker]:hidden">Investment details <ChevronRight aria-hidden="true" className="ml-1 size-4 transition-transform group-open:rotate-90" /></summary><dl className="mt-2 grid gap-4 rounded-control bg-surface-muted p-4 text-small sm:grid-cols-2"><div><dt className="text-secondary">Average cost</dt><dd className="mt-1 font-semibold tabular-nums">{formatPracticeCapitalMinor(holding.averageCostBaseMinor)}</dd></div><div><dt className="text-secondary">Current observed price</dt><dd className="mt-1 font-semibold tabular-nums">{quotePrice(holding.currentPrice, holding.currentPriceCurrency)}</dd>{holding.quoteObservedAt ? <dd className="mt-1 text-microcopy text-secondary">As of {timestamp(holding.quoteObservedAt)}{holding.quoteFreshness === "stale" ? " · cached/stale observation" : ""}</dd> : null}</div>{holding.currentPriceCurrency && holding.currentPriceCurrency !== "CZK" && holding.fxReferenceDate ? <div className="sm:col-span-2"><dt className="text-secondary">CZK conversion</dt><dd className="mt-1 text-microcopy text-secondary">Reference FX rate dated {holding.fxReferenceDate}{holding.fxProvider ? ` · ${holding.fxProvider}` : ""}</dd></div> : null}</dl></details><div className="absolute top-5 right-0"><IconButton id={`holding-actions-${holding.instrumentId}`} aria-label={`Actions for ${holding.symbol}`} variant="ghost" aria-haspopup="menu" aria-expanded={openMenu === holding.instrumentId} onClick={() => onToggleMenu(holding.instrumentId)} onKeyDown={(event) => { if (event.key === "Escape") { onToggleMenu(holding.instrumentId); event.currentTarget.focus(); } }}><Ellipsis aria-hidden="true" /></IconButton>{openMenu === holding.instrumentId ? <div role="menu" aria-label={`Actions for ${holding.symbol}`} className="absolute top-12 right-0 z-10 min-w-36 rounded-control border border-border bg-surface p-1 shadow-elevation-2"><button type="button" role="menuitem" className="flex min-h-12 w-full items-center rounded-control px-4 text-left text-small font-semibold hover:bg-surface-muted focus-visible:bg-surface-muted" onClick={(event) => onSell(holding, event.currentTarget)}>Sell</button></div> : null}</div></li>)}</ul>;
}

function AllocationSummary({ holdings }: { holdings: Holding[] }) {
  return <aside aria-labelledby="allocation-heading" className="min-w-0 lg:border-l lg:border-border lg:pl-8"><p className="text-microcopy font-bold uppercase tracking-[0.12em] text-secondary">Portfolio mix</p><h2 id="allocation-heading" className="mt-1 text-card-title font-bold">Allocation</h2><p className="mt-2 text-small text-secondary">Share of invested value, excluding cash.</p><ul className="mt-5 space-y-4">{holdings.map((holding, index) => <li key={holding.instrumentId}><div className="flex items-center gap-3"><span aria-hidden="true" className={`size-3 shrink-0 rounded-full ${allocationColors[index % allocationColors.length]}`} /><span className="min-w-0 flex-1 truncate text-small font-bold">{holding.symbol}</span><span className="text-small font-semibold tabular-nums">{percentFromBasisPoints(holding.allocationBasisPoints, false)}</span></div>{holdings.length > 1 ? <div className="mt-2 ml-6 h-1.5 overflow-hidden rounded-pill bg-border" role="img" aria-label={`${holding.symbol}, ${percentFromBasisPoints(holding.allocationBasisPoints, false)} of invested value`}><div className={`h-full rounded-pill ${allocationColors[index % allocationColors.length]}`} style={{ width: holding.allocationBasisPoints === null ? "0%" : `${Number(holding.allocationBasisPoints) / 100}%` }} /></div> : null}</li>)}</ul></aside>;
}

function ActivityList({ activity }: { activity: PortfolioView["recentActivity"] }) {
  return <section aria-labelledby="activity-heading" className="border-t border-border pt-8"><div className="flex flex-wrap items-end justify-between gap-4"><div className="min-w-0"><p className="break-words text-microcopy font-bold uppercase tracking-[0.12em] text-secondary">Transactions</p><h2 id="activity-heading" className="mt-1 break-words text-card-title font-bold">Recent activity</h2></div><span className="break-words text-small text-secondary">Latest {activity.length}</span></div><ul className="mt-4 divide-y divide-border border-y border-border">{activity.map((trade) => <li key={trade.id} className="grid gap-2 py-4 text-small sm:grid-cols-[4.5rem_minmax(0,1fr)_auto] sm:items-center"><strong className={trade.side === "BUY" ? "text-primary-hover" : "text-warning-ink"}>{trade.side}</strong><span><span className="font-bold">{trade.symbol}</span><span className="ml-2 text-secondary">{quantityLabel(trade.quantity)} shares</span></span><span className="tabular-nums sm:text-right"><strong>{formatPracticeCapitalMinor(trade.grossAmountBaseMinor)}</strong><span className="mt-0.5 block text-microcopy text-secondary">{timestamp(trade.executedAt)}</span></span></li>)}</ul></section>;
}
