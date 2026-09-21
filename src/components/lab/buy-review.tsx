"use client";

import { ArrowLeft } from "lucide-react";
import { portfolioDataSourceLabel } from "@/features/portfolio/presentation";
import type { InstrumentPreview } from "@/features/portfolio/service";
import { formatPracticeCapitalMinor } from "@/features/rewards/presentation";

function quantityLabel(value: string) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 8 }).format(Number(value));
}
function quotePrice(value: string, currency: string) {
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 8 }).format(Number(value))} ${currency}`;
}
function assetTypeLabel(value: string) { return value.charAt(0).toUpperCase() + value.slice(1); }

export function BuyReview({ preview, quantity, estimate, availableCash, onBack }: { preview: InstrumentPreview; quantity: string; estimate: bigint | null; availableCash: string; onBack: () => void }) {
  return <section aria-labelledby="buy-review-title">
    <button type="button" className="mb-5 inline-flex min-h-11 items-center gap-2 text-small font-bold text-primary-hover" onClick={onBack}><ArrowLeft aria-hidden="true" className="size-4" />Edit order</button>
    <h3 id="buy-review-title" className="text-section-title font-bold">Review your investment</h3>
    <p className="mt-2 text-body text-secondary">Check the details before adding it to your portfolio.</p>
    <div className="mt-6 overflow-hidden rounded-surface border border-border">
      <div className="bg-surface-muted px-5 py-4"><p className="break-words font-bold">{preview.instrument.name}</p><p className="break-words text-small text-secondary">{preview.instrument.symbol} · {assetTypeLabel(preview.instrument.assetType)} · {portfolioDataSourceLabel(preview.marketDataMode)}</p></div>
      <dl className="divide-y divide-border px-5 text-small">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 py-4"><dt className="min-w-0 text-secondary">Quantity</dt><dd className="min-w-0 break-words text-right font-bold tabular-nums">{quantityLabel(quantity)}</dd></div>
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 py-4"><dt className="min-w-0 text-secondary">Observed reference price</dt><dd className="min-w-0 break-words text-right font-bold tabular-nums">{quotePrice(preview.price, preview.instrument.quoteCurrency)}</dd></div>
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 py-4"><dt className="min-w-0 text-secondary">Estimated cost</dt><dd className="min-w-0 break-words text-right font-bold tabular-nums">{estimate === null ? "—" : formatPracticeCapitalMinor(estimate)}</dd></div>
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 py-4"><dt className="min-w-0 text-secondary">Available cash</dt><dd className="min-w-0 break-words text-right font-bold tabular-nums">{formatPracticeCapitalMinor(availableCash)}</dd></div>
      </dl>
    </div>
    <p className="mt-5 break-words text-small text-secondary">Portfolio Lab simulates immediate execution using a fresh current/last security price and a dated reference FX rate. It does not model broker FX execution, bid/ask, spreads, or slippage; the final observations may differ from this estimate.</p>
  </section>;
}
