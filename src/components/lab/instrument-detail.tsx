"use client";

import { Check, ChevronRight, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type MouseEvent } from "react";
import { BuyReview } from "@/components/lab/buy-review";
import { InstrumentPriceChart } from "@/components/lab/instrument-price-chart";
import { Button, IconButton } from "@/components/ui/button";
import { Feedback } from "@/components/ui/feedback";
import { Input } from "@/components/ui/form-controls";
import type { ChartRange } from "@/features/instruments/history";
import { periodReturnLabel, periodStatistics } from "@/features/instruments/period-statistics";
import type { Instrument, MarketSessionState, QuoteUsabilityStatus } from "@/features/market-data/contracts";
import { buyPortfolioAction, loadInstrumentPreviewAction, sellPortfolioAction } from "@/features/portfolio/actions";
import { parseQuantity, roundDivide } from "@/features/portfolio/decimal";
import { gainLossState, showSampleDataIndicator } from "@/features/portfolio/presentation";
import { estimatedMinor, parseQuantitySafe } from "@/features/portfolio/order-presentation";
import type { InstrumentPreview, PortfolioView } from "@/features/portfolio/service";
import { formatPracticeCapitalMinor } from "@/features/rewards/presentation";

type QuoteView = { price: number; observedAt: string; status: QuoteUsabilityStatus; marketState: MarketSessionState };
type Holding = PortfolioView["holdings"][number];

function dateTime(value: string) { return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
function nativePrice(value: number, currency: string) { return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 8 }).format(value)} ${currency}`; }
function quantity(value: string) { return new Intl.NumberFormat("en-US", { maximumFractionDigits: 8 }).format(Number(value)); }
function assetTypeLabel(value: Instrument["assetType"]) { return value === "etf" ? "ETF" : value.charAt(0).toUpperCase() + value.slice(1); }
function quoteState(quote: QuoteView) {
  if (quote.status === "unavailable") return "Price unavailable";
  if (quote.status === "stale") return "Stale observation";
  if (quote.marketState === "closed" || quote.status === "closed-market-reference") return "Market closed";
  if (quote.marketState === "open") return "Market open";
  return null;
}
function signedMoney(value: string | null) {
  if (value === null) return "Unavailable";
  return `${BigInt(value) > 0n ? "+" : ""}${formatPracticeCapitalMinor(value)}`;
}
function sellEstimate(holding: Holding, amount: string) {
  if (holding.marketValueMinor === null) return null;
  try { return roundDivide(BigInt(holding.marketValueMinor) * parseQuantity(amount), parseQuantity(holding.quantity)); }
  catch { return null; }
}

export function InstrumentDetailView({ instrument, quote, quoteMessage, points, historyMessage, historyPartial, range, portfolio: initialPortfolio }: { instrument: Instrument; quote: QuoteView | null; quoteMessage: string | null; points: { date: string; close: number }[]; historyMessage: string | null; historyPartial: boolean; range: ChartRange; portfolio: PortfolioView }) {
  const router = useRouter();
  const [portfolio, setPortfolio] = useState(initialPortfolio);
  const [preview, setPreview] = useState<InstrumentPreview | null>(null);
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [amount, setAmount] = useState("0.25");
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loadingPreview, startPreview] = useTransition();
  const [pending, startTrade] = useTransition();
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const orderHeading = useRef<HTMLHeadingElement>(null);
  const tradeKey = useRef<string | null>(null);
  const holding = portfolio.holdings.find((item) => item.instrumentId === instrument.instrumentId);
  const buyEstimate = preview ? estimatedMinor(amount, preview.estimatedUnitCostBaseMinor) : null;
  const estimatedProceeds = holding ? sellEstimate(holding, amount) : null;
  const canInvest = BigInt(portfolio.earnedPracticeCapitalMinor) > 0n && instrument.assetType !== "cash" && instrument.assetType !== "index";
  const period = periodStatistics(points);
  const periodReturn = period?.returnPercent;

  function closeDialog() { if (!pending) dialog.current?.close(); }
  function openBuy(event: MouseEvent<HTMLButtonElement>) {
    trigger.current = event.currentTarget;
    setSide("BUY"); setPreview(null); setAmount("0.25"); setError(null); setReviewing(false); tradeKey.current = null;
    dialog.current?.showModal();
    startPreview(async () => {
      const response = await loadInstrumentPreviewAction(instrument.instrumentId);
      if (response.ok) { setPreview(response.preview); requestAnimationFrame(() => orderHeading.current?.focus()); }
      else setError(response.message);
    });
  }
  function openSell(event: MouseEvent<HTMLButtonElement>) {
    if (!holding) return;
    trigger.current = event.currentTarget;
    setSide("SELL"); setAmount(holding.quantity); setError(null); setReviewing(false); tradeKey.current = null;
    dialog.current?.showModal();
  }
  function execute() {
    if (pending) return;
    tradeKey.current ??= crypto.randomUUID();
    const completedAmount = amount;
    startTrade(async () => {
      const action = side === "BUY" ? buyPortfolioAction : sellPortfolioAction;
      const response = await action({ instrumentId: instrument.instrumentId, quantity: completedAmount, clientIdempotencyKey: tradeKey.current });
      if (!response.ok) { setError(response.message); return; }
      setPortfolio(response.portfolio);
      setNotice(`${side === "BUY" ? "Investment added" : "Investment sold"} · ${quantity(completedAmount)} ${instrument.symbol}`);
      tradeKey.current = null;
      dialog.current?.close();
      router.refresh();
    });
  }

  return <>
    <header className="mt-3 border-b border-border pb-7 sm:mt-5 sm:pb-8">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-5">
        <div className="min-w-0"><div className="flex flex-wrap items-center gap-3"><h1 className="break-words text-page-title font-bold tracking-[-0.025em]">{instrument.name}</h1>{showSampleDataIndicator(portfolio.marketDataMode) ? <span className="rounded-pill border border-border bg-surface-muted px-2.5 py-1 text-microcopy font-semibold text-secondary">Sample data</span> : null}</div><p className="mt-2 text-small font-semibold text-secondary">{instrument.symbol} · {assetTypeLabel(instrument.assetType)}{instrument.exchangeMic ? ` · ${instrument.exchangeMic}` : ""}</p></div>
        {canInvest ? <Button onClick={openBuy} className="w-full sm:w-auto">+ Invest</Button> : null}
      </div>
      <div className="mt-7"><p className="text-microcopy font-semibold uppercase tracking-[0.11em] text-secondary">{quote?.status === "fresh" && quote.marketState === "open" ? "Current price" : "Last market price"}</p>{quote && quote.status !== "unavailable" ? <><p className="mt-1 break-words text-[clamp(2.25rem,5vw,3.5rem)] leading-tight font-bold tracking-[-0.035em] tabular-nums">{nativePrice(quote.price, instrument.quoteCurrency)}</p><p className="mt-2 text-small text-secondary">{quoteState(quote) ? `${quoteState(quote)} · ` : ""}Last observation {dateTime(quote.observedAt)}</p></> : <p role="status" className="mt-2 text-small text-secondary">{quoteMessage ?? "The current market price is unavailable."}</p>}{periodReturn !== null && periodReturn !== undefined ? <p className="mt-4 text-small font-semibold">Selected {periodReturnLabel(range)} <span className={`ml-1 font-bold tabular-nums ${periodReturn > 0 ? "text-success-ink" : periodReturn < 0 ? "text-danger-ink" : ""}`}>{periodReturn > 0 ? "+" : ""}{periodReturn.toFixed(2)}%</span></p> : null}</div>
    </header>

    {notice ? <Feedback state="completed" role="status" className="mt-6 flex items-center justify-between gap-3"><span className="flex items-center gap-2"><Check aria-hidden="true" className="size-5 text-success-ink" />{notice}</span><IconButton aria-label="Dismiss confirmation" variant="ghost" className="size-10 min-h-0 p-0" onClick={() => setNotice(null)}><X aria-hidden="true" /></IconButton></Feedback> : null}

    <div className="mt-7"><InstrumentPriceChart instrumentId={instrument.instrumentId} range={range} points={points} currency={instrument.quoteCurrency} message={historyMessage} partial={historyPartial} /></div>

    {holding ? <section aria-labelledby="position-heading" className="mt-8 border-t border-border pt-7"><div className="flex flex-wrap items-center justify-between gap-4"><h2 id="position-heading" className="text-section-title font-bold">Your position</h2><div className="flex w-full flex-wrap gap-2 sm:w-auto">{canInvest ? <Button size="compact" onClick={openBuy}>Invest more</Button> : null}<Button size="compact" variant="secondary" onClick={openSell}>Sell</Button></div></div><dl className="mt-5 grid gap-4 text-small sm:grid-cols-4"><div><dt className="text-secondary">Quantity</dt><dd className="mt-1 font-bold tabular-nums">{quantity(holding.quantity)} shares</dd></div><div><dt className="text-secondary">Market value</dt><dd className="mt-1 font-bold tabular-nums">{holding.marketValueMinor === null ? "Unavailable" : formatPracticeCapitalMinor(holding.marketValueMinor)}</dd></div><div><dt className="text-secondary">Gain/loss</dt><dd className={`mt-1 font-bold tabular-nums ${gainLossState(holding.gainLossMinor) === "positive" ? "text-success-ink" : gainLossState(holding.gainLossMinor) === "negative" ? "text-danger-ink" : ""}`}>{signedMoney(holding.gainLossMinor)}</dd></div><div><dt className="text-secondary">Portfolio weight</dt><dd className="mt-1 font-bold tabular-nums">{holding.allocationBasisPoints === null ? "Unavailable" : `${(Number(holding.allocationBasisPoints) / 100).toFixed(2)}%`}</dd></div></dl></section> : null}

    <section aria-labelledby="instrument-facts-heading" className="mt-8 border-t border-border pt-7"><h2 id="instrument-facts-heading" className="text-card-title font-bold">Instrument details</h2><dl className="mt-4 grid gap-4 text-small sm:grid-cols-3"><div><dt className="text-secondary">Asset type</dt><dd className="mt-1 font-semibold">{assetTypeLabel(instrument.assetType)}</dd></div><div><dt className="text-secondary">Exchange</dt><dd className="mt-1 font-semibold">{instrument.exchangeMic ?? "Not available"}</dd></div><div><dt className="text-secondary">Quote currency</dt><dd className="mt-1 font-semibold">{instrument.quoteCurrency}</dd></div></dl></section>

    <dialog ref={dialog} aria-labelledby="instrument-order-title" aria-describedby="instrument-order-description" onClose={() => { setError(null); setReviewing(false); trigger.current?.focus(); requestAnimationFrame(() => trigger.current?.focus()); }} onCancel={(event) => { if (pending) event.preventDefault(); }} className="fixed inset-y-0 right-0 left-auto m-0 h-[100dvh] max-h-none w-full max-w-none overflow-y-auto border-0 border-l border-border bg-surface p-0 text-foreground shadow-elevation-2 backdrop:bg-foreground/35 sm:max-w-[34rem] sm:rounded-l-panel">
      <div className="flex min-h-full flex-col"><div className="sticky top-0 z-20 flex items-start justify-between gap-4 border-b border-border bg-surface/95 px-[min(1.25rem,5vw)] py-5 backdrop-blur sm:px-7"><div className="min-w-0"><p className="text-microcopy font-bold uppercase tracking-[0.12em] text-primary-hover">{side === "BUY" ? reviewing ? "Step 2 of 2" : "Step 1 of 2" : "Sell investment"}</p><h2 id="instrument-order-title" className="mt-1 break-words text-card-title font-bold">{side === "BUY" ? `Invest in ${instrument.symbol}` : `Sell ${instrument.symbol}`}</h2><p id="instrument-order-description" className="sr-only">{side === "BUY" ? "Choose a quantity, review, then confirm your investment." : "Choose a quantity to sell."}</p></div><IconButton aria-label="Close order" variant="ghost" disabled={pending} onClick={closeDialog}><X aria-hidden="true" /></IconButton></div>
      <div className="flex-1 px-[min(1.25rem,5vw)] py-6 sm:px-7 sm:py-8">{error ? <Feedback state="warning" role="alert" className="mb-5">{error}</Feedback> : null}
        {side === "BUY" && loadingPreview ? <p role="status" className="text-small text-secondary">Loading current market observation…</p> : side === "BUY" && !preview ? null : side === "BUY" && reviewing && preview ? <BuyReview preview={preview} quantity={amount} estimate={buyEstimate} availableCash={portfolio.availableCashMinor} onBack={() => { setReviewing(false); setError(null); requestAnimationFrame(() => orderHeading.current?.focus()); }} /> : <><h3 ref={orderHeading} tabIndex={-1} className="text-section-title font-bold focus-visible:outline-none">Choose quantity</h3><p className="mt-2 text-small text-secondary">{instrument.name} · {instrument.symbol}</p><div className="mt-6 rounded-surface bg-surface-muted p-5 text-small"><p className="text-secondary">Last market price</p><p className="mt-1 font-bold tabular-nums">{preview ? `${preview.price} ${instrument.quoteCurrency}` : quote && quote.status !== "unavailable" ? nativePrice(quote.price, instrument.quoteCurrency) : "Unavailable"}</p>{preview && !preview.usableForExecution ? <p role="status" className="mt-3 text-warning-ink">A fresh market observation is required to invest.</p> : null}</div><label htmlFor="instrument-order-quantity" className="mt-7 block text-small font-bold">Quantity {side === "SELL" ? "to sell" : ""}</label><Input id="instrument-order-quantity" inputMode="decimal" className="mt-2 tabular-nums" value={amount} onChange={(event) => { setAmount(event.target.value); setError(null); tradeKey.current = null; }} /><p className="mt-2 text-small text-secondary">Fractional quantities are supported to 8 decimal places.</p><dl className="mt-7 border-y border-border py-5 text-small"><div className="flex flex-wrap items-baseline justify-between gap-3"><dt className="text-secondary">{side === "BUY" ? "Estimated cost" : "Estimated proceeds"}</dt><dd className="font-bold tabular-nums">{side === "BUY" ? buyEstimate === null ? "—" : formatPracticeCapitalMinor(buyEstimate) : estimatedProceeds === null ? "—" : formatPracticeCapitalMinor(estimatedProceeds)}</dd></div>{side === "BUY" ? <div className="mt-3 flex flex-wrap items-baseline justify-between gap-3"><dt className="text-secondary">Available cash</dt><dd className="font-bold tabular-nums">{formatPracticeCapitalMinor(portfolio.availableCashMinor)}</dd></div> : null}</dl>{side === "SELL" ? <p className="mt-5 text-small text-secondary">The displayed value is an estimate. The server obtains a fresh security reference price and a dated reference FX rate for the simulated sale.</p> : null}</>}
      </div>
      {(side === "SELL" && holding || side === "BUY" && preview) ? <div className="sticky bottom-0 z-20 border-t border-border bg-surface/95 px-[min(1.25rem,5vw)] py-4 backdrop-blur sm:px-7">{side === "SELL" ? <Button className="w-full" loading={pending} disabled={!holding?.usableForExecution || estimatedProceeds === null || parseQuantitySafe(amount) <= 0n} onClick={execute}>Sell {instrument.symbol}</Button> : reviewing ? <Button className="w-full" loading={pending} disabled={!preview?.usableForExecution} onClick={execute}>Confirm buy {instrument.symbol}</Button> : <Button className="w-full" disabled={!preview?.usableForExecution || buyEstimate === null || parseQuantitySafe(amount) <= 0n} onClick={() => setReviewing(true)}>Review order <ChevronRight aria-hidden="true" className="size-4" /></Button>}</div> : null}
      </div>
    </dialog>
  </>;
}
