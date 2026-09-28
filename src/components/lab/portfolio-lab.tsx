"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Ellipsis, Search, X } from "lucide-react";
import { useEffect, useRef, useState, useTransition, type MouseEvent, type RefObject } from "react";
import { Button, ButtonLink, IconButton } from "@/components/ui/button";
import { Feedback } from "@/components/ui/feedback";
import { Input } from "@/components/ui/form-controls";
import type { InstrumentSearchResult } from "@/features/market-data/contracts";
import { instrumentDetailHref } from "@/features/instruments/routes";
import {
  resetPortfolioAction,
  searchPortfolioInstrumentsAction,
  sellPortfolioAction,
} from "@/features/portfolio/actions";
import { roundDivide } from "@/features/portfolio/decimal";
import { parseQuantitySafe } from "@/features/portfolio/order-presentation";
import { gainLossState, portfolioDataSourceLabel, showSampleDataIndicator } from "@/features/portfolio/presentation";
import type { PortfolioView } from "@/features/portfolio/service";
import { formatPracticeCapitalMinor } from "@/features/rewards/presentation";

type Holding = PortfolioView["holdings"][number];
type Notice = { state: "completed" | "warning"; title: string; detail?: string };
type SearchState = "idle" | "loading" | "results" | "empty" | "error";

function percentFromBasisPoints(value: string | null, signed = true) {
  if (value === null) return "Nedostupné";
  const basisPoints = BigInt(value);
  const sign = basisPoints > 0n && signed ? "+" : basisPoints < 0n ? "−" : "";
  const absolute = basisPoints < 0n ? -basisPoints : basisPoints;
  const percentage = new Intl.NumberFormat("cs-CZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(absolute) / 100);
  return `${sign}${percentage} %`;
}

function signedMoney(value: string | null) {
  if (value === null) return "Nedostupné";
  const amount = BigInt(value);
  return `${amount > 0n ? "+" : ""}${formatPracticeCapitalMinor(value)}`;
}

function quotePrice(value: string | null, currency: string | null) {
  if (!value || !currency) return "Nedostupné";
  return `${new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 8 }).format(Number(value))} ${currency}`;
}

function quantityLabel(value: string) {
  return new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 8 }).format(Number(value));
}

function timestamp(value: string) {
  return new Intl.DateTimeFormat("cs-CZ", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function assetTypeLabel(value: string | null) {
  if (value === "equity") return "Akcie";
  if (value === "etf") return "ETF";
  if (value === "bond") return "Dluhopis";
  if (value === "cash") return "Hotovost";
  if (value === "index") return "Index";
  return "Instrument";
}

function unavailableLabel(reason: Holding["unavailableReason"]) {
  if (reason === "fx") return "Kurz CZK není dostupný";
  if (reason === "instrument") return "Tento zdroj data neposkytuje";
  if (reason === "rate-limit") return "Limit pro tržní data byl vyčerpán";
  if (reason === "provider") return "Poskytovatel tržních dat není dostupný";
  return "Aktuální cena není dostupná";
}

function executionUnavailableLabel(marketState: "open" | "closed" | "unknown") {
  return marketState === "closed"
    ? "Trh je nyní zavřený. Nové simulované investice vyžadují aktuální tržní cenu."
    : "Tato tržní cena není dostatečně čerstvá pro okamžité simulované provedení.";
}

function restoreTriggerFocus(trigger: HTMLButtonElement | null, fallback: HTMLButtonElement | null) {
  (trigger?.isConnected ? trigger : fallback?.isConnected ? fallback : null)?.focus();
}

function portfolioUiSignature(portfolio: PortfolioView) {
  return `${portfolio.availableCashMinor}|${portfolio.holdings.map(({ instrumentId, quantity, marketValueMinor }) => `${instrumentId}:${quantity}:${marketValueMinor}`).join("|")}`;
}

export function PortfolioLab({ portfolio }: { portfolio: PortfolioView }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<readonly InstrumentSearchResult[]>([]);
  const [searchState, setSearchState] = useState<SearchState>("idle");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [sellHolding, setSellHolding] = useState<Holding | null>(null);
  const [quantity, setQuantity] = useState("0.25");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [holdingMenu, setHoldingMenu] = useState<string | null>(null);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [, startSearch] = useTransition();
  const [mutationPending, startMutation] = useTransition();
  const searchRef = useRef<HTMLInputElement>(null);
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
    setQuery("");
    setResults([]);
    setSearchState("idle");
    setActiveIndex(-1);
    setSheetError(null);
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
    investDialog.current?.close();
    router.push(instrumentDetailHref(instrumentId));
  }

  function openSell(holding: Holding, trigger: HTMLButtonElement) {
    sellReturnFocus.current = trigger;
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

  const heldUnits = sellHolding ? parseQuantitySafe(sellHolding.quantity) : 0n;
  const sellEstimate = sellHolding?.marketValueMinor && heldUnits > 0n
    ? roundDivide(BigInt(sellHolding.marketValueMinor) * parseQuantitySafe(quantity), heldUnits)
    : null;

  function runSell() {
    if (mutationPending) return;
    const instrumentId = sellHolding?.instrumentId;
    const symbol = sellHolding?.symbol;
    if (!instrumentId || !symbol || !sellHolding?.usableForExecution) return;
    const completedQuantity = quantity;
    tradeKey.current ??= crypto.randomUUID();
    setSheetError(null);
    startMutation(async () => {
      const response = await sellPortfolioAction({ instrumentId, quantity, clientIdempotencyKey: tradeKey.current });
      if (!response.ok) { setSheetError(response.message); return; }
      focusAfterPortfolioChange.current = {
        signature: portfolioUiSignature(response.portfolio),
        targetId: sellReturnFocus.current?.id ?? `holding-actions-${instrumentId}`,
      };
      sellDialog.current?.close();
      setNotice({
        state: "completed",
        title: "Prodej dokončen",
        detail: `${quantityLabel(completedQuantity)} ${symbol}${sellEstimate === null ? "" : ` · ${formatPracticeCapitalMinor(sellEstimate)}`}`,
      });
      setSellHolding(null);
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
      setSellHolding(null);
      setNotice({ state: "completed", title: "Portfolio resetováno", detail: "Veškerý získaný virtuální kapitál je opět k dispozici." });
    });
  }

  return <>
    <header className="mt-1 flex flex-wrap items-end justify-between gap-5">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="break-words text-page-title font-bold tracking-[-0.025em]">Portfolio Lab</h1>
          {showSampleDataIndicator(portfolio.marketDataMode) ? <span className="rounded-pill border border-border bg-surface-muted px-2.5 py-1 text-microcopy font-semibold text-secondary">Ukázková data</span> : null}
        </div>
        <p className="mt-2 max-w-2xl text-small text-secondary">Investuj nanečisto se vzdělávacím kapitálem. Nejde o skutečné peníze.</p>
      </div>
      {(hasCapital || hasHoldings || portfolio.recentActivity.length > 0) ? <div className="flex w-full items-center gap-2 sm:w-auto">
        {hasCapital ? <Button id="portfolio-primary-invest" ref={primaryInvestRef} onClick={openInvest} className="min-w-0 flex-1 sm:flex-none"><span aria-hidden="true">+</span> Investovat</Button> : null}
        {(hasHoldings || portfolio.recentActivity.length > 0) ? <div className="relative shrink-0">
          <IconButton ref={optionsButtonRef} aria-label="Možnosti portfolia" variant="ghost" aria-haspopup="menu" aria-expanded={optionsOpen} onClick={() => setOptionsOpen((open) => !open)} onKeyDown={(event) => { if (event.key === "Escape") { setOptionsOpen(false); event.currentTarget.focus(); } }}><Ellipsis aria-hidden="true" className="size-5" /></IconButton>
          {optionsOpen ? <div role="menu" aria-label="Možnosti portfolia" className="absolute top-12 right-0 z-20 w-[min(13rem,calc(100vw-2rem))] rounded-control border border-border bg-surface p-1 shadow-elevation-2"><button type="button" role="menuitem" className="flex min-h-12 w-full items-center rounded-control px-4 text-left text-small font-semibold text-danger-ink hover:bg-danger-soft focus-visible:bg-danger-soft" onClick={openReset}>Resetovat portfolio</button></div> : null}
        </div> : null}
      </div> : null}
    </header>

    <div className="mt-5 space-y-7 lg:mt-6">
      <PortfolioHero portfolio={portfolio} />

      {notice ? <Feedback state={notice.state} role={notice.state === "warning" ? "alert" : "status"} className="max-w-xl shadow-elevation-1">
        <div className="flex items-start gap-3"><Check aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-success-ink" /><div className="min-w-0 flex-1 break-words"><p className="font-bold">{notice.title}</p>{notice.detail ? <p className="mt-0.5 text-small text-secondary">{notice.detail}</p> : null}</div><IconButton aria-label="Zavřít potvrzení" variant="ghost" className="-my-2 -mr-2 size-11 min-h-0 p-0" onClick={() => setNotice(null)}><X aria-hidden="true" /></IconButton></div>
      </Feedback> : null}

      {!portfolio.valuationComplete ? <Feedback state="warning" role="status">Oceněno je {portfolio.valuedHoldingsCount} z {portfolio.totalHoldingsCount} pozic. Nedostupné pozice se nepočítají jako nula, proto není celková hodnota portfolia úplná.</Feedback> : null}

      {!hasCapital ? <ZeroCapitalState /> : !hasHoldings ? <EmptyPortfolioState onInvest={openInvest} /> : <section aria-labelledby="holdings-heading" className="min-w-0 pt-1">
        <h2 id="holdings-heading" className="break-words text-section-title font-bold">Pozice</h2>
        <HoldingsList holdings={portfolio.holdings} openMenu={holdingMenu} onToggleMenu={(instrumentId) => setHoldingMenu((current) => current === instrumentId ? null : instrumentId)} onSell={openSell} />
      </section>}

      {portfolio.recentActivity.length > 0 ? <ActivityList activity={portfolio.recentActivity} /> : null}

    </div>

    <dialog ref={investDialog} aria-labelledby="invest-title" aria-describedby="invest-description" onClose={() => { resetInvestFlow(); restoreTriggerFocus(investReturnFocus.current, primaryInvestRef.current); requestAnimationFrame(() => restoreTriggerFocus(investReturnFocus.current, primaryInvestRef.current)); }} className="fixed inset-y-0 right-0 left-auto m-0 h-[100dvh] max-h-none w-full max-w-none overflow-y-auto border-0 border-l border-border bg-surface p-0 text-foreground shadow-elevation-2 backdrop:bg-foreground/35 sm:max-w-[34rem] sm:rounded-l-panel">
      <div className="flex min-h-full flex-col">
        <div className="sticky top-0 z-20 flex flex-wrap items-start justify-between gap-4 border-b border-border bg-surface/95 px-[min(1.25rem,5vw)] py-5 backdrop-blur sm:px-7">
          <div className="min-w-0 flex-1"><p className="whitespace-nowrap text-microcopy font-bold uppercase tracking-[0.12em] text-primary-hover">Objevuj</p><h2 id="invest-title" className="mt-1 break-words text-card-title font-bold">Investuj virtuální kapitál</h2><p id="invest-description" className="sr-only">Vyhledej investici a vyber instrument, jehož informace si chceš prohlédnout.</p></div>
          <IconButton aria-label="Zavřít výběr investice" variant="ghost" className="shrink-0" onClick={closeInvest}><X aria-hidden="true" /></IconButton>
        </div>

        <div className="flex-1 px-[min(1.25rem,5vw)] py-6 sm:px-7 sm:py-8">
          {sheetError ? <Feedback state="warning" role="alert" className="mb-5">{sheetError}</Feedback> : null}
          <SearchStep query={query} results={results} activeIndex={activeIndex} state={searchState} pending={searchState === "loading"} sourceMode={portfolio.marketDataMode} searchRef={searchRef} onQueryChange={(value) => { const normalized = value.trim(); searchRequest.current += 1; setQuery(value); setSheetError(null); setResults([]); setActiveIndex(-1); setSearchState(normalized.length >= 2 ? "loading" : "idle"); }} onActiveIndexChange={setActiveIndex} onChoose={chooseInstrument} />
        </div>
      </div>
    </dialog>

    <dialog ref={sellDialog} aria-labelledby="sell-heading" aria-describedby="sell-description" onClose={() => { setSellHolding(null); setSheetError(null); restoreTriggerFocus(sellReturnFocus.current, primaryInvestRef.current); requestAnimationFrame(() => restoreTriggerFocus(sellReturnFocus.current, primaryInvestRef.current)); }} onCancel={(event) => { if (mutationPending) event.preventDefault(); }} className="fixed inset-y-0 right-0 left-auto m-0 h-[100dvh] max-h-none w-full max-w-none overflow-y-auto border-0 border-l border-border bg-surface p-0 text-foreground shadow-elevation-2 backdrop:bg-foreground/35 sm:max-w-[31rem] sm:rounded-l-panel">
      {sellHolding ? <div className="flex min-h-full flex-col">
        <div className="sticky top-0 z-20 flex flex-wrap items-start justify-between gap-4 border-b border-border bg-surface/95 px-[min(1.25rem,5vw)] py-5 backdrop-blur sm:px-7"><div className="min-w-0 flex-1"><p className="text-microcopy font-bold uppercase tracking-[0.12em] text-secondary">Prodej investice</p><h2 id="sell-heading" className="mt-1 break-words text-card-title font-bold">Prodat {sellHolding.symbol}</h2><p id="sell-description" className="sr-only">Zvol množství instrumentu {sellHolding.symbol} k prodeji a zkontroluj odhad výnosu.</p></div><IconButton aria-label="Zavřít prodej" variant="ghost" className="shrink-0" disabled={mutationPending} onClick={closeSell}><X aria-hidden="true" /></IconButton></div>
        <div className="flex-1 px-[min(1.25rem,5vw)] py-6 sm:px-7 sm:py-8">
          {sheetError ? <Feedback state="warning" role="alert" className="mb-5">{sheetError}</Feedback> : null}
          <div className="rounded-surface bg-surface-muted p-[min(1.25rem,5vw)]"><p className="font-bold">{sellHolding.name}</p><dl className="mt-4 grid grid-cols-1 gap-4 text-small sm:grid-cols-2"><div><dt className="text-secondary">Držené množství</dt><dd className="mt-1 font-bold tabular-nums">{quantityLabel(sellHolding.quantity)} pozic</dd></div><div><dt className="text-secondary">Poslední tržní cena</dt><dd className="mt-1 font-bold tabular-nums">{quotePrice(sellHolding.currentPrice, sellHolding.currentPriceCurrency)}</dd></div></dl></div>
          {!sellHolding.usableForExecution && sellHolding.marketSessionState ? <Feedback state="warning" role="status" className="mt-5">{executionUnavailableLabel(sellHolding.marketSessionState)}</Feedback> : null}
          <div className="mt-7"><label htmlFor="sell-quantity" className="text-small font-bold">Množství k prodeji</label><Input id="sell-quantity" className="mt-2 tabular-nums" inputMode="decimal" value={quantity} onChange={(event) => { setQuantity(event.target.value); setSheetError(null); tradeKey.current = null; }} /></div>
          <dl className="mt-7 border-y border-border py-5"><div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2"><dt className="min-w-0 text-small text-secondary">Odhadovaný výnos</dt><dd className="min-w-0 break-words text-right text-card-title font-bold">{sellEstimate === null ? "—" : formatPracticeCapitalMinor(sellEstimate)}</dd></div></dl>
          <p className="mt-5 text-small text-secondary">Zobrazená hodnota je odhad. Server pro simulovaný prodej získá čerstvou referenční cenu instrumentu a referenční kurz FX k danému datu.</p>
        </div>
        <div className="sticky bottom-0 z-20 border-t border-border bg-surface/95 px-[min(1.25rem,5vw)] py-4 backdrop-blur sm:px-7"><Button className="w-full" loading={mutationPending} disabled={!sellHolding.usableForExecution || sellEstimate === null || parseQuantitySafe(quantity) <= 0n} onClick={runSell}>Prodat {sellHolding.symbol}</Button></div>
      </div> : null}
    </dialog>

    <dialog ref={resetDialog} aria-labelledby="reset-title" aria-describedby="reset-description" onClose={() => { setResetError(null); restoreTriggerFocus(resetReturnFocus.current, primaryInvestRef.current); requestAnimationFrame(() => restoreTriggerFocus(resetReturnFocus.current, primaryInvestRef.current)); }} onCancel={(event) => { if (mutationPending) event.preventDefault(); }} className="m-auto w-[min(32rem,92vw)] rounded-panel border border-border bg-surface p-0 text-foreground shadow-elevation-2 backdrop:bg-foreground/35">
      <div className="px-[min(1.5rem,6vw)] py-5 sm:px-[min(1.75rem,6vw)] sm:py-7"><h2 id="reset-title" className="text-card-title font-bold">Resetovat portfolio?</h2><p id="reset-description" className="mt-3 text-body text-secondary">Pozice se vymažou a veškerý získaný virtuální kapitál bude znovu dostupný. Postup v učení i dřívější obchody zůstanou zaznamenané.</p>{resetError ? <Feedback state="warning" role="alert" className="mt-5">{resetError}</Feedback> : null}<div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button variant="secondary" disabled={mutationPending} onClick={() => resetDialog.current?.close()}>Ponechat portfolio</Button><Button variant="danger" loading={mutationPending} onClick={reset}>Resetovat portfolio</Button></div></div>
    </dialog>
  </>;
}

function ZeroCapitalState() {
  return <section aria-labelledby="zero-capital-title" className="flex flex-wrap items-center justify-between gap-5 border-b border-border pb-7"><div><h2 id="zero-capital-title" className="text-card-title font-bold">Získej kapitál učením</h2><p className="mt-1 text-small text-secondary">Dokonči lekci a získej kapitál pro první investici.</p></div><ButtonLink href="/learn" className="w-full sm:w-auto">Pokračovat v učení</ButtonLink></section>;
}

function PortfolioHero({ portfolio }: { portfolio: PortfolioView }) {
  const gain = portfolio.investmentGainLossMinor === null ? null : BigInt(portfolio.investmentGainLossMinor);
  const state = gainLossState(portfolio.investmentGainLossMinor);
  const tone = state === "positive" ? "text-success-ink" : state === "negative" ? "text-danger-ink" : "text-secondary";
  const gainState = gain === null ? "Neúplný investiční zisk / ztráta" : gain > 0n ? "Investiční zisk" : gain < 0n ? "Investiční ztráta" : "Bez investičního zisku nebo ztráty";
  return <section aria-labelledby="portfolio-value-label" className="min-w-0 rounded-surface border border-border bg-surface px-5 py-6 shadow-elevation-1 sm:px-8 sm:py-8">
    <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)] lg:gap-10">
      <div className="flex min-w-0 flex-col justify-between">
        <div>
          <p id="portfolio-value-label" className="text-small font-semibold text-secondary">Hodnota portfolia</p>
          <p className="mt-2 break-words text-[clamp(2.5rem,2rem+2vw,4.25rem)] leading-none font-extrabold tracking-[-0.04em] tabular-nums" data-testid="portfolio-value">{portfolio.portfolioTotalMinor === null ? "—" : formatPracticeCapitalMinor(portfolio.portfolioTotalMinor)}</p>
          {portfolio.portfolioTotalMinor === null ? <p className="mt-2 text-small font-semibold text-warning-ink">Neúplné ocenění</p> : null}
          <p className={`mt-3 flex flex-wrap items-baseline gap-x-2 text-small tabular-nums ${tone}`} aria-label={`${gainState}: ${gain === null ? "Nedostupné" : `${signedMoney(portfolio.investmentGainLossMinor)} a ${percentFromBasisPoints(portfolio.investmentGainLossBasisPoints)} za celou dobu`}`}><span className="font-bold" data-testid="portfolio-gain-loss">{gain === null ? "Nedostupné" : <>{signedMoney(portfolio.investmentGainLossMinor)} <span aria-hidden="true">·</span> {percentFromBasisPoints(portfolio.investmentGainLossBasisPoints)}</>}</span>{gain === null ? null : <span>za celou dobu</span>}</p>
        </div>
        <dl className="mt-8 flex min-w-0 flex-wrap gap-x-5 gap-y-3 border-t border-border pt-4 text-small text-secondary"><div className="flex min-w-0 flex-wrap gap-x-1.5"><dd className="min-w-0 break-words font-bold text-foreground tabular-nums" data-testid="portfolio-cash">{formatPracticeCapitalMinor(portfolio.availableCashMinor)}</dd><dt>hotovost</dt></div><div className="flex min-w-0 flex-wrap gap-x-1.5"><dd className="min-w-0 break-words font-bold text-foreground tabular-nums" data-testid="portfolio-invested">{portfolio.holdingsMarketValueMinor === null ? "Neúplné" : formatPracticeCapitalMinor(portfolio.holdingsMarketValueMinor)}</dd><dt>investováno</dt></div><div className="flex min-w-0 flex-wrap gap-x-1.5"><dd className="font-bold text-foreground tabular-nums">{portfolio.holdings.length}</dd><dt>{portfolio.holdings.length === 1 ? "pozice" : "pozic"}</dt></div></dl>
      </div>
      <div className="flex min-w-0 flex-col border-t border-border pt-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-small font-semibold text-foreground">Výkonnost</h2><div aria-label="Období výkonnosti nejsou dostupná, dokud není k dispozici historie" className="flex flex-wrap gap-1 text-microcopy text-secondary">{["1M", "3M", "6M", "YTD", "1Y", "Max"].map((range) => <span key={range} className="px-1.5 py-1">{range}</span>)}</div></div><div className="mt-3 flex min-h-28 flex-1 items-center justify-center border-b border-border/70 px-4 text-center sm:min-h-32"><p className="text-microcopy text-secondary">Historie výkonnosti zatím není dostupná</p></div></div>
    </div>
  </section>;
}

function EmptyPortfolioState({ onInvest }: { onInvest: (event: MouseEvent<HTMLButtonElement>) => void }) {
  return <section aria-labelledby="empty-portfolio-title" className="flex flex-wrap items-center justify-between gap-5 border-b border-border pb-7"><div><h2 id="empty-portfolio-title" className="text-card-title font-bold">Portfolio je připravené</h2><p className="mt-1 text-small text-secondary">Proveď první investici a pozice uvidíš tady.</p></div><Button variant="secondary" className="w-full min-w-0 max-w-full whitespace-normal text-center sm:w-auto" onClick={onInvest}>Provést první investici</Button></section>;
}

function SearchStep({ query, results, activeIndex, state, pending, sourceMode, searchRef, onQueryChange, onActiveIndexChange, onChoose }: { query: string; results: readonly InstrumentSearchResult[]; activeIndex: number; state: SearchState; pending: boolean; sourceMode: PortfolioView["marketDataMode"]; searchRef: RefObject<HTMLInputElement | null>; onQueryChange: (value: string) => void; onActiveIndexChange: (index: number) => void; onChoose: (instrumentId: string) => void }) {
  return <section aria-labelledby="search-investments-title"><h3 id="search-investments-title" className="text-section-title font-bold">Najdi investici</h3><p className="mt-2 text-body text-secondary">Hledej podle názvu společnosti, fondu, dluhopisu nebo tickeru.</p><div className="relative mt-6"><label htmlFor="instrument-search" className="text-small font-bold">Hledat investice</label><div className="relative mt-2"><Search aria-hidden="true" className="pointer-events-none absolute top-3.5 left-4 size-5 text-secondary" /><Input ref={searchRef} id="instrument-search" role="combobox" aria-autocomplete="list" aria-expanded={results.length > 0} aria-controls="instrument-results" aria-activedescendant={activeIndex >= 0 ? `instrument-option-${activeIndex}` : undefined} aria-busy={pending || undefined} autoComplete="off" value={query} placeholder="Hledat akcie, ETF, dluhopisy…" className="pr-12 pl-12" onChange={(event) => onQueryChange(event.target.value)} onKeyDown={(event) => { if (!results.length) return; if (event.key === "ArrowDown") { event.preventDefault(); onActiveIndexChange((activeIndex + 1) % results.length); } if (event.key === "ArrowUp") { event.preventDefault(); onActiveIndexChange((activeIndex - 1 + results.length) % results.length); } if (event.key === "Enter" && activeIndex >= 0) { event.preventDefault(); onChoose(results[activeIndex].instrumentId); } if (event.key === "Escape") { event.stopPropagation(); onActiveIndexChange(-1); } }} />{pending ? <span className="absolute top-3.5 right-4 text-small text-secondary">…</span> : null}</div></div>{results.length > 0 ? <ul id="instrument-results" role="listbox" aria-label="Výsledky hledání instrumentů" className="mt-3 divide-y divide-border overflow-hidden rounded-surface border border-border bg-surface shadow-elevation-1">{results.map((result, index) => { const exchange = result.exchangeMic ?? result.exchangeCode; return <li key={result.instrumentId} id={`instrument-option-${index}`} role="option" aria-selected={index === activeIndex} aria-label={`${result.symbol} ${result.name}, ${assetTypeLabel(result.assetType)}, ${exchange ?? "burza není dostupná"}, ${result.quoteCurrency}`} className="aria-selected:bg-primary-soft"><button type="button" tabIndex={-1} className="flex min-h-16 w-full flex-col items-start gap-2 px-4 py-3 text-left hover:bg-primary-soft sm:flex-row sm:items-center sm:justify-between" onMouseDown={(event) => event.preventDefault()} onClick={() => onChoose(result.instrumentId)}><span className="w-full min-w-0 sm:w-auto"><strong className="block">{result.symbol}</strong><span className="block truncate text-small text-secondary">{result.name}</span></span><span className="w-full shrink-0 text-left text-microcopy text-secondary sm:w-auto sm:text-right"><span className="block font-semibold">{assetTypeLabel(result.assetType)} · {result.quoteCurrency}</span><span className="block">{exchange ? `${exchange} · ` : ""}{portfolioDataSourceLabel(sourceMode)}</span></span></button></li>; })}</ul> : state === "empty" ? <p role="status" className="mt-5 text-small text-secondary">Žádné investice nenalezeny. Zkus jiný název společnosti nebo ticker.</p> : state === "loading" ? <p role="status" className="mt-5 text-small text-secondary">Hledám tržní data…</p> : state === "error" ? null : <div className="mt-8 border-t border-border pt-6"><p className="text-small font-bold">Zkus hledat</p><p className="mt-1 text-small text-secondary">Zadej alespoň dva znaky názvu společnosti nebo tickeru.</p></div>}</section>;
}

function HoldingsList({ holdings, openMenu, onToggleMenu, onSell }: { holdings: Holding[]; openMenu: string | null; onToggleMenu: (instrumentId: string) => void; onSell: (holding: Holding, trigger: HTMLButtonElement) => void }) {
  return <>
    <div className="mt-4 hidden border-y border-border lg:block">
      <table className="w-full table-fixed text-left text-small" aria-label="Aktuální pozice v portfoliu">
        <thead className="text-microcopy text-secondary"><tr><th scope="col" className="w-[29%] py-3 pr-4 font-semibold">Aktivum</th><th scope="col" className="w-[17%] px-2 py-3 text-right font-semibold">Cena</th><th scope="col" className="w-[21%] px-2 py-3 text-right font-semibold">Hodnota</th><th scope="col" className="w-[14%] px-2 py-3 text-right font-semibold">Váha</th><th scope="col" className="w-[15%] px-2 py-3 text-right font-semibold">Zisk / ztráta</th><th scope="col" className="w-12 py-3"><span className="sr-only">Akce</span></th></tr></thead>
        <tbody className="divide-y divide-border">{holdings.map((holding) => <tr key={holding.instrumentId} data-testid={`holding-${holding.symbol}`}>
          <th scope="row" className="py-3.5 pr-4 align-top font-normal"><InstrumentIdentity holding={holding} /></th>
          <td className="px-2 py-3.5 text-right align-top"><MarketPrice holding={holding} /></td>
          <td className="px-2 py-3.5 text-right align-top"><p className="font-bold tabular-nums">{holding.marketValueMinor === null ? "Nedostupné" : formatPracticeCapitalMinor(holding.marketValueMinor)}</p><p className="mt-0.5 text-microcopy text-secondary tabular-nums">{quantityLabel(holding.quantity)} pozic</p>{holding.marketValueMinor === null ? <p className="mt-1 text-microcopy font-semibold text-warning-ink">{unavailableLabel(holding.unavailableReason)}</p> : null}</td>
          <td className="px-2 py-3.5 text-right align-top font-semibold tabular-nums">{percentFromBasisPoints(holding.allocationBasisPoints, false)}</td>
          <td className="px-2 py-3.5 text-right align-top"><GainLossValue value={holding.gainLossMinor} /></td>
          <td className="relative py-2 text-right align-top"><HoldingActions holding={holding} open={openMenu === holding.instrumentId} onToggle={onToggleMenu} onSell={onSell} /></td>
        </tr>)}</tbody>
      </table>
    </div>
    <ul className="mt-4 divide-y divide-border border-y border-border lg:hidden" aria-label="Aktuální pozice v portfoliu">{holdings.map((holding) => <li key={holding.instrumentId} data-testid={`holding-mobile-${holding.symbol}`} className="relative py-3.5 pr-12"><InstrumentIdentity holding={holding} /><dl className="mt-3 grid grid-cols-2 gap-x-5 gap-y-3 text-small"><div><dt className="text-microcopy text-secondary">Hodnota</dt><dd className="mt-0.5 font-bold tabular-nums">{holding.marketValueMinor === null ? "Nedostupné" : formatPracticeCapitalMinor(holding.marketValueMinor)}</dd><dd className="text-microcopy text-secondary tabular-nums">{quantityLabel(holding.quantity)} pozic</dd></div><div><dt className="text-microcopy text-secondary">Zisk / ztráta</dt><dd className="mt-0.5"><GainLossValue value={holding.gainLossMinor} /></dd></div><div><dt className="text-microcopy text-secondary">Cena</dt><dd className="mt-0.5"><MarketPrice holding={holding} /></dd></div><div><dt className="text-microcopy text-secondary">Váha</dt><dd className="mt-0.5 font-semibold tabular-nums">{percentFromBasisPoints(holding.allocationBasisPoints, false)}</dd></div></dl>{holding.marketValueMinor === null ? <p className="mt-3 text-microcopy font-semibold text-warning-ink">{unavailableLabel(holding.unavailableReason)}</p> : null}<div className="absolute top-3 right-0"><HoldingActions holding={holding} idSuffix="-mobile" open={openMenu === holding.instrumentId} onToggle={onToggleMenu} onSell={onSell} /></div></li>)}</ul>
  </>;
}

function InstrumentIdentity({ holding }: { holding: Holding }) {
  return <div className="min-w-0"><Link href={instrumentDetailHref(holding.instrumentId)} className="block truncate font-bold text-primary-hover underline-offset-2 hover:underline focus-visible:underline">{holding.name}</Link><span className="mt-0.5 block truncate text-microcopy font-semibold text-secondary">{holding.symbol} · {assetTypeLabel(holding.assetType)}</span></div>;
}

function MarketPrice({ holding }: { holding: Holding }) {
  return <><span className="font-semibold tabular-nums">{quotePrice(holding.currentPrice, holding.currentPriceCurrency)}</span>{holding.quoteUsability === "closed-market-reference" ? <span className="block text-microcopy text-secondary">Trh zavřený</span> : holding.quoteUsability === "stale" ? <span className="block text-microcopy text-secondary">Zastaralá cena</span> : null}</>;
}

function GainLossValue({ value }: { value: string | null }) {
  const state = gainLossState(value);
  const tone = state === "positive" ? "text-success-ink" : state === "negative" ? "text-danger-ink" : "text-secondary";
  const label = state === "positive" ? "Zisk" : state === "negative" ? "Ztráta" : state === "neutral" ? "Beze změny" : "Nedostupné";
  return <span className={`font-bold tabular-nums ${tone}`} aria-label={`${label}: ${signedMoney(value)}`}>{signedMoney(value)}</span>;
}

function HoldingActions({ holding, idSuffix = "", open, onToggle, onSell }: { holding: Holding; idSuffix?: string; open: boolean; onToggle: (instrumentId: string) => void; onSell: (holding: Holding, trigger: HTMLButtonElement) => void }) {
  const actionId = `holding-actions-${holding.instrumentId}${idSuffix}`;
  return <><IconButton id={actionId} aria-label={`Akce pro ${holding.symbol}`} variant="ghost" className="size-11 min-h-0 p-0" aria-haspopup="menu" aria-expanded={open} onClick={() => onToggle(holding.instrumentId)} onKeyDown={(event) => { if (event.key === "Escape") { onToggle(holding.instrumentId); event.currentTarget.focus(); } }}><Ellipsis aria-hidden="true" /></IconButton>{open ? <div role="menu" aria-label={`Akce pro ${holding.symbol}`} className="absolute top-11 right-0 z-10 min-w-36 rounded-control border border-border bg-surface p-1 text-left shadow-elevation-2"><button type="button" role="menuitem" className="flex min-h-12 w-full items-center rounded-control px-4 text-left text-small font-semibold hover:bg-surface-muted focus-visible:bg-surface-muted" onClick={(event) => onSell(holding, document.getElementById(actionId) as HTMLButtonElement | null ?? event.currentTarget)}>Prodat</button></div> : null}</>;
}

function ActivityList({ activity }: { activity: PortfolioView["recentActivity"] }) {
  return <section aria-labelledby="activity-heading" className="border-t border-border pt-6">
    <h2 id="activity-heading" className="text-card-title font-bold">Poslední aktivita</h2>
    <ul className="mt-3 divide-y divide-border border-y border-border">{activity.map((trade) => <li key={trade.id} className="grid gap-x-4 gap-y-1 py-3 text-small sm:grid-cols-[4rem_minmax(0,1fr)_auto] sm:items-center">
      <strong className={trade.side === "BUY" ? "text-primary-hover" : "text-warning-ink"}>{trade.side === "BUY" ? "Koupit" : "Prodat"}</strong>
      <span className="min-w-0"><span className="font-bold">{trade.symbol}</span><span className="ml-2 text-secondary">{trade.name} · {quantityLabel(trade.quantity)} pozic</span></span>
      <span className="tabular-nums sm:text-right"><strong>{formatPracticeCapitalMinor(trade.grossAmountBaseMinor)}</strong><span className="ml-2 text-microcopy text-secondary sm:ml-0 sm:block">{timestamp(trade.executedAt)}</span></span>
    </li>)}</ul>
  </section>;
}
