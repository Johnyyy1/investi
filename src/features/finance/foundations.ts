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

/** The quoted cost between immediate buying and selling interest. */
export function bidAskSpread(bid: number, ask: number) {
  finiteNonnegative(bid, "Bid");
  positiveAmount(ask, "Ask");
  if (ask < bid) throw new FinancialInputError("Ask must be greater than or equal to bid.");
  return ask - bid;
}

/** A value at or above the supplied peak has no drawdown from that peak. */
export function drawdownFromPeak(peak: number, current: number) {
  positiveAmount(peak, "Peak value");
  finiteNonnegative(current, "Current value");
  return Math.max(0, (peak - current) / peak);
}

const PORTFOLIO_WEIGHT_TOLERANCE = 1e-10;

/**
 * Validates decimal portfolio weights: 0.6 represents a 60% allocation.
 * The tolerance accommodates ordinary floating-point sums without rounding inputs.
 */
export function validatePortfolioWeights(weights: readonly number[]) {
  if (weights.length === 0) throw new FinancialInputError("At least one portfolio weight is required.");
  for (const weight of weights) {
    if (!Number.isFinite(weight) || weight < 0 || weight > 1) throw new FinancialInputError("Each portfolio weight must be a finite number from 0 to 1.");
  }
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  if (Math.abs(total - 1) > PORTFOLIO_WEIGHT_TOLERANCE) throw new FinancialInputError("Portfolio weights must sum to 1.");
  return true;
}

/** Unrounded one-period portfolio return in decimal units, using matching weights and returns. */
export function portfolioWeightedReturn(weights: readonly number[], returns: readonly number[]) {
  validatePortfolioWeights(weights);
  if (weights.length !== returns.length) throw new FinancialInputError("Portfolio weights and returns must have the same length.");
  if (returns.some((returnValue) => !Number.isFinite(returnValue))) throw new FinancialInputError("Each asset return must be a finite number.");
  return weights.reduce((total, weight, index) => total + weight * returns[index], 0);
}
