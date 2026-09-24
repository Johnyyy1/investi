export const CZECH_LOCALE = "cs-CZ";

export function formatDecimal(
  value: number | bigint,
  options: Intl.NumberFormatOptions = {},
) {
  return new Intl.NumberFormat(CZECH_LOCALE, options).format(value);
}

export function formatCurrency(
  value: number | bigint,
  currency: string,
  options: Intl.NumberFormatOptions = {},
) {
  return new Intl.NumberFormat(CZECH_LOCALE, {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  }).format(value);
}

/** Accepts a decimal ratio: 0.1246 is displayed as 12,46 %. */
export function formatPercentage(value: number, maximumFractionDigits = 2) {
  return new Intl.NumberFormat(CZECH_LOCALE, {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(value);
}

export function formatDate(
  value: Date | string,
  options: Intl.DateTimeFormatOptions = {},
) {
  return new Intl.DateTimeFormat(CZECH_LOCALE, {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    ...options,
  }).format(typeof value === "string" ? new Date(value) : value);
}
