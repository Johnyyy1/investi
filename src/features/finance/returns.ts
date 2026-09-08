export class FinancialInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FinancialInputError";
  }
}

function assertFinite(value: number, label: string) {
  if (!Number.isFinite(value)) {
    throw new FinancialInputError(`${label} must be a finite number.`);
  }
}

function assertStartingPrice(start: number) {
  assertFinite(start, "Starting price");
  if (start <= 0) {
    throw new FinancialInputError("Starting price must be greater than zero.");
  }
}

function assertEndingPrice(end: number) {
  assertFinite(end, "Ending price");
  if (end < 0) {
    throw new FinancialInputError("Ending price cannot be negative.");
  }
}

function assertSimpleReturn(returnValue: number) {
  assertFinite(returnValue, "Period return");
  if (returnValue < -1) {
    throw new FinancialInputError("A simple return cannot be below -100%.");
  }
}

/** The unrounded change in price units. */
export function absoluteChange(start: number, end: number) {
  assertStartingPrice(start);
  assertEndingPrice(end);
  return end - start;
}

/** The unrounded simple return expressed as a decimal (0.15 represents 15%). */
export function simpleReturn(start: number, end: number) {
  assertStartingPrice(start);
  assertEndingPrice(end);
  return end / start - 1;
}

/** Unrounded period returns for each consecutive pair in a price series. */
export function consecutiveSimpleReturns(prices: readonly number[]) {
  if (prices.length < 2) {
    throw new FinancialInputError("At least two prices are required to calculate period returns.");
  }
  return prices.slice(1).map((currentPrice, index) => simpleReturn(prices[index], currentPrice));
}

/** Unrounded compounded return; an empty series has the identity return of zero. */
export function cumulativeReturn(returns: readonly number[]) {
  return returns.reduce((growthFactor, returnValue) => {
    assertSimpleReturn(returnValue);
    return growthFactor * (1 + returnValue);
  }, 1) - 1;
}

/** Ending value after applying each unrounded period return in sequence. */
export function compoundValue(startValue: number, returns: readonly number[]) {
  assertStartingPrice(startValue);
  return startValue * (1 + cumulativeReturn(returns));
}

export type CompoundingPeriod = {
  period: number;
  startValue: number;
  returnValue: number;
  change: number;
  endValue: number;
};

/** Period-by-period values for explaining a compounded sequence. */
export function compoundPeriods(startValue: number, returns: readonly number[]): CompoundingPeriod[] {
  assertStartingPrice(startValue);
  let currentValue = startValue;
  return returns.map((returnValue, index) => {
    assertSimpleReturn(returnValue);
    const endValue = currentValue * (1 + returnValue);
    const period = { period: index + 1, startValue: currentValue, returnValue, change: endValue - currentValue, endValue };
    currentValue = endValue;
    return period;
  });
}

/** Required gain after a positive loss magnitude, e.g. 0.5 loss requires 1.0 gain. */
export function recoveryReturn(loss: number) {
  assertFinite(loss, "Loss");
  if (loss < 0 || loss >= 1) {
    throw new FinancialInputError("Loss must be at least 0% and less than 100%.");
  }
  return 1 / (1 - loss) - 1;
}

/** Parses user-entered price strings without treating an empty field as zero. */
export function parsePrice(value: string, label: string) {
  if (value.trim() === "") {
    throw new FinancialInputError(`${label} is required.`);
  }
  const parsed = Number(value);
  assertFinite(parsed, label);
  return parsed;
}
