import type { EtfHolding, EtfHoldings } from "@/features/market-data/etf-analytics";

export function sortedHoldings(holdings: readonly EtfHolding[]): EtfHolding[] {
  return [...holdings].sort((a, b) => b.weight - a.weight || a.name.localeCompare(b.name) || (a.symbol ?? "").localeCompare(b.symbol ?? ""));
}

export function etfConcentration(holdings: EtfHoldings) {
  const sorted = sortedHoldings(holdings.rows);
  return {
    largestWeight: sorted[0]?.weight ?? null,
    topTenWeight: sorted.length >= 10 ? sorted.slice(0, 10).reduce((sum, holding) => sum + holding.weight, 0) : null,
    returnedCount: sorted.length,
    totalCount: holdings.totalCount,
  };
}

export function formatEtfPercent(value: number | null, digits = 1): string {
  return value === null ? "—" : `${new Intl.NumberFormat("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value * 100)}%`;
}
