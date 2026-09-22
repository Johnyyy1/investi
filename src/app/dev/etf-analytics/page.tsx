import { notFound } from "next/navigation";
import { EtfAnalytics } from "@/components/lab/etf-analytics";
import { PageFrame } from "@/components/shell/page-frame";
import { createDeterministicMarketDataService } from "@/features/market-data/deterministic/service";

export const metadata = { title: "ETF analytics preview · Development", robots: { index: false, follow: false } };

/** Development-only visual fixture for partial dataset and failure review. */
export default async function EtfAnalyticsPreview({ searchParams }: { searchParams: Promise<{ state?: string }> }) {
  if (process.env.NODE_ENV !== "development") notFound();
  const { state } = await searchParams;
  const sample = await createDeterministicMarketDataService().getEtfAnalytics("IE-XETR:VWCE");
  const snapshot = state === "failure" ? null : state === "partial" ? { ...sample, countries: null, unavailableDatasets: ["countries" as const] } : sample;
  return <PageFrame width="wide" className="max-w-[80rem] py-8"><h1 className="break-words text-page-title font-bold">Sample ETF analytics preview</h1><EtfAnalytics snapshot={snapshot} message={state === "failure" ? "Fund composition is unavailable right now." : null} /></PageFrame>;
}
