import type { PortfolioMarketDataMode } from "./market-data";

export function portfolioDataSourceLabel(mode: PortfolioMarketDataMode) {
  return mode === "sample" ? "Sample data" : "Market observations";
}

export function showSampleDataIndicator(mode: PortfolioMarketDataMode) {
  return mode === "sample";
}

export type GainLossState = "unavailable" | "positive" | "negative" | "neutral";

export function gainLossState(value: string | null): GainLossState {
  if (value === null) return "unavailable";
  const amount = BigInt(value);
  if (amount > 0n) return "positive";
  if (amount < 0n) return "negative";
  return "neutral";
}
