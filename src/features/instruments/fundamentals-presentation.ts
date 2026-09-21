import type { Currency } from "@/features/market-data/contracts";

const decimal = (digits: number) => new Intl.NumberFormat("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });

export function formatMagnitude(value: number | null, currency: Currency | null): string {
  if (value === null || !Number.isFinite(value) || !currency) return "—";
  const absolute = Math.abs(value);
  const [scale, suffix] = absolute >= 1e12 ? [1e12, "T"] : absolute >= 1e9 ? [1e9, "B"] : absolute >= 1e6 ? [1e6, "M"] : [1, ""];
  return `${decimal(scale === 1 ? 0 : 1).format(value / scale)}${suffix} ${currency}`;
}

export function formatMultiple(value: number | null, digits = 1): string {
  return value === null || !Number.isFinite(value) ? "—" : `${decimal(digits).format(value)}×`;
}

export function formatPercent(value: number | null): string {
  return value === null || !Number.isFinite(value) ? "—" : `${decimal(1).format(value * 100)}%`;
}

export function formatPerShare(value: number | null, currency: Currency | null): string {
  return value === null || !Number.isFinite(value) || !currency ? "—" : `${decimal(2).format(value)} ${currency}`;
}
