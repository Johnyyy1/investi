import { FinancialInputError } from "./returns";

function finiteNonnegative(value: number, label: string) {
  if (!Number.isFinite(value) || value < 0) throw new FinancialInputError(`${label} must be a finite, nonnegative number.`);
}
function positiveShares(total: number) {
  finiteNonnegative(total, "Total shares");
  if (total === 0) throw new FinancialInputError("Total shares must be greater than zero.");
}
/** Percentage units: 100 of 1,000,000 equal shares returns 0.01, not 0.0001. */
export function ownershipPercentage(owned: number, total: number) {
  positiveShares(total);
  finiteNonnegative(owned, "Owned shares");
  if (owned > total) throw new FinancialInputError("Owned shares cannot exceed total shares.");
  return owned / total * 100;
}
/** Market equity value for a company with one share class; no debt/cash adjustments. */
export function marketCapitalization(sharePrice: number, sharesOutstanding: number) {
  positiveShares(sharesOutstanding);
  finiteNonnegative(sharePrice, "Share price");
  const result = sharePrice * sharesOutstanding;
  if (!Number.isFinite(result)) throw new FinancialInputError("The market value is too large. Use smaller inputs.");
  return result;
}
