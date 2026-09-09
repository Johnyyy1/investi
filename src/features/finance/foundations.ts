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

function positiveAmount(value: number, label: string) {
  if (!Number.isFinite(value) || value <= 0) throw new FinancialInputError(`${label} must be a finite number greater than zero.`);
}

/** Coupon rates are decimal units: 0.05 represents a 5% annual coupon rate. */
export function annualCoupon(principal: number, couponRate: number) {
  positiveAmount(principal, "Principal");
  finiteNonnegative(couponRate, "Coupon rate");
  const result = principal * couponRate;
  if (!Number.isFinite(result)) throw new FinancialInputError("The annual coupon is too large. Use smaller inputs.");
  return result;
}

/** Simplified nominal cash flows only; this is not a bond yield or total-return calculation. */
export function simpleBondCashflows(principal: number, couponRate: number, years: number) {
  positiveAmount(years, "Years");
  const coupon = annualCoupon(principal, couponRate);
  const totalCoupon = coupon * years;
  if (!Number.isFinite(totalCoupon)) throw new FinancialInputError("The total coupon payments are too large. Use smaller inputs.");
  const totalCashReceived = principal + totalCoupon;
  if (!Number.isFinite(totalCashReceived)) throw new FinancialInputError("The total cash received is too large. Use smaller inputs.");
  return { annualCoupon: coupon, totalCouponPayments: totalCoupon, principalAtMaturity: principal, totalCashReceived };
}

export function totalCouponPayments(principal: number, couponRate: number, years: number) {
  return simpleBondCashflows(principal, couponRate, years).totalCouponPayments;
}
