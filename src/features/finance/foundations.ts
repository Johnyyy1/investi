import { cumulativeReturn, FinancialInputError } from "./returns";

function finiteNonnegative(value: number, label: string) {
  if (!Number.isFinite(value) || value < 0) throw new FinancialInputError(`${label} musí být konečné nezáporné číslo.`);
}
function positiveShares(total: number) {
  finiteNonnegative(total, "Celkový počet akcií");
  if (total === 0) throw new FinancialInputError("Celkový počet akcií musí být větší než nula.");
}
/** Percentage units: 100 of 1,000,000 equal shares returns 0.01, not 0.0001. */
export function ownershipPercentage(owned: number, total: number) {
  positiveShares(total);
  finiteNonnegative(owned, "Počet vlastněných akcií");
  if (owned > total) throw new FinancialInputError("Počet vlastněných akcií nemůže překročit celkový počet akcií.");
  return owned / total * 100;
}
/** Market equity value for a company with one share class; no debt/cash adjustments. */
export function marketCapitalization(sharePrice: number, sharesOutstanding: number) {
  positiveShares(sharesOutstanding);
  finiteNonnegative(sharePrice, "Cena akcie");
  const result = sharePrice * sharesOutstanding;
  if (!Number.isFinite(result)) throw new FinancialInputError("Tržní hodnota je příliš vysoká. Použij menší hodnoty.");
  return result;
}

/** Educational display math. Persisted portfolio accounting uses exact decimal/minor-unit helpers. */
export function positionValue(quantity: number, marketPrice: number) {
  finiteNonnegative(quantity, "Počet");
  finiteNonnegative(marketPrice, "Tržní cena");
  const value = quantity * marketPrice;
  if (!Number.isFinite(value)) throw new FinancialInputError("Hodnota pozice je příliš vysoká. Použij menší hodnoty.");
  return value;
}

export function growthFactor(returnValue: number) {
  if (!Number.isFinite(returnValue) || returnValue < -1) throw new FinancialInputError("Výnos musí být konečný a nemůže být nižší než −100 %.");
  return 1 + returnValue;
}

export function compoundReturn(returns: readonly number[]) {
  return cumulativeReturn(returns);
}

export function portfolioWeight(position: number, portfolio: number) {
  finiteNonnegative(position, "Hodnota pozice");
  positiveAmount(portfolio, "Hodnota portfolia");
  if (position > portfolio) throw new FinancialInputError("Hodnota pozice nemůže překročit hodnotu portfolia.");
  return position / portfolio;
}

export function weightedContribution(weight: number, assetReturn: number) {
  if (!Number.isFinite(weight) || weight < 0 || weight > 1) throw new FinancialInputError("Váha musí být konečné číslo od 0 do 1.");
  if (!Number.isFinite(assetReturn) || assetReturn < -1) throw new FinancialInputError("Výnos aktiva musí být konečný a nemůže být nižší než −100 %.");
  return weight * assetReturn;
}

export function immediateExecutionPrice(side: "buy" | "sell", bid: number, ask: number) {
  bidAskSpread(bid, ask);
  return side === "buy" ? ask : bid;
}

function positiveAmount(value: number, label: string) {
  if (!Number.isFinite(value) || value <= 0) throw new FinancialInputError(`${label} musí být konečné číslo větší než nula.`);
}

/** Coupon rates are decimal units: 0.05 represents a 5% annual coupon rate. */
export function annualCoupon(principal: number, couponRate: number) {
  positiveAmount(principal, "Jistina");
  finiteNonnegative(couponRate, "Kupónová sazba");
  const result = principal * couponRate;
  if (!Number.isFinite(result)) throw new FinancialInputError("Roční kupón je příliš vysoký. Použij menší hodnoty.");
  return result;
}

/** Simplified nominal cash flows only; this is not a bond yield or total-return calculation. */
export function simpleBondCashflows(principal: number, couponRate: number, years: number) {
  positiveAmount(years, "Počet let");
  const coupon = annualCoupon(principal, couponRate);
  const totalCoupon = coupon * years;
  if (!Number.isFinite(totalCoupon)) throw new FinancialInputError("Celkové kupónové platby jsou příliš vysoké. Použij menší hodnoty.");
  const totalCashReceived = principal + totalCoupon;
  if (!Number.isFinite(totalCashReceived)) throw new FinancialInputError("Celková přijatá hotovost je příliš vysoká. Použij menší hodnoty.");
  return { annualCoupon: coupon, totalCouponPayments: totalCoupon, principalAtMaturity: principal, totalCashReceived };
}

export function totalCouponPayments(principal: number, couponRate: number, years: number) {
  return simpleBondCashflows(principal, couponRate, years).totalCouponPayments;
}

/** The quoted cost between immediate buying and selling interest. */
export function bidAskSpread(bid: number, ask: number) {
  finiteNonnegative(bid, "Bid");
  positiveAmount(ask, "Ask");
  if (ask < bid) throw new FinancialInputError("Ask musí být větší nebo roven bidu.");
  return ask - bid;
}

/** A value at or above the supplied peak has no drawdown from that peak. */
export function drawdownFromPeak(peak: number, current: number) {
  positiveAmount(peak, "Vrcholová hodnota");
  finiteNonnegative(current, "Aktuální hodnota");
  return Math.max(0, (peak - current) / peak);
}

const PORTFOLIO_WEIGHT_TOLERANCE = 1e-10;

/**
 * Validates decimal portfolio weights: 0.6 represents a 60% allocation.
 * The tolerance accommodates ordinary floating-point sums without rounding inputs.
 */
export function validatePortfolioWeights(weights: readonly number[]) {
  if (weights.length === 0) throw new FinancialInputError("Je potřeba alespoň jedna váha portfolia.");
  for (const weight of weights) {
    if (!Number.isFinite(weight) || weight < 0 || weight > 1) throw new FinancialInputError("Každá váha portfolia musí být konečné číslo od 0 do 1.");
  }
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  if (Math.abs(total - 1) > PORTFOLIO_WEIGHT_TOLERANCE) throw new FinancialInputError("Součet vah portfolia musí být 1.");
  return true;
}

/** Unrounded one-period portfolio return in decimal units, using matching weights and returns. */
export function portfolioWeightedReturn(weights: readonly number[], returns: readonly number[]) {
  validatePortfolioWeights(weights);
  if (weights.length !== returns.length) throw new FinancialInputError("Váhy portfolia a výnosy musí mít stejný počet hodnot.");
  if (returns.some((returnValue) => !Number.isFinite(returnValue))) throw new FinancialInputError("Každý výnos aktiva musí být konečné číslo.");
  return weights.reduce((total, weight, index) => total + weight * returns[index], 0);
}
