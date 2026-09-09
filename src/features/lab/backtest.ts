import { compoundPeriods, FinancialInputError } from "@/features/finance/returns";
import { drawdownFromPeak } from "@/features/finance/foundations";

function positive(value: number, label: string) {
  if (!Number.isFinite(value) || value <= 0) throw new FinancialInputError(`${label} must be greater than zero.`);
}
export function calculateCagr(start: number, end: number, years: number) {
  positive(start, "Starting value"); positive(years, "Duration");
  if (!Number.isFinite(end) || end < 0) throw new FinancialInputError("Ending value must be nonnegative.");
  const value = (end / start) ** (1 / years) - 1;
  if (!Number.isFinite(value)) throw new FinancialInputError("CAGR is too large to calculate.");
  return value;
}
/** Positive loss magnitude, sampled at the supplied observations, including the initial value. */
export function calculateMaxDrawdown(values: readonly number[]) {
  positive(values[0], "Starting value");
  let peak = values[0], maximum = 0;
  for (const value of values) { peak = Math.max(peak, value); maximum = Math.max(maximum, drawdownFromPeak(peak, value)); }
  return maximum;
}
/** Sample standard deviation of simple periodic returns, annualized by sqrt(periodsPerYear). */
export function calculateVolatility(returns: readonly number[], periodsPerYear: number) {
  positive(periodsPerYear, "Periods per year");
  if (returns.length < 2 || returns.some((value) => !Number.isFinite(value) || value < -1)) throw new FinancialInputError("At least two valid returns are required.");
  const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const variance = returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (returns.length - 1);
  const volatility = Math.sqrt(variance * periodsPerYear);
  if (!Number.isFinite(volatility)) throw new FinancialInputError("Volatility is too large to calculate.");
  return volatility;
}
export function calculateGrowthSeries(initial: number, returns: readonly number[]) {
  const values = [initial, ...compoundPeriods(initial, returns).map((period) => period.endValue)];
  if (values.some((value) => !Number.isFinite(value))) throw new FinancialInputError("Growth is too large to calculate.");
  return values;
}
export function calculateBacktestMetrics(initial: number, returns: readonly number[], periodsPerYear = 12) {
  const values = calculateGrowthSeries(initial, returns);
  const volatility = calculateVolatility(returns, periodsPerYear);
  return { values, finalValue: values.at(-1)!, cagr: calculateCagr(initial, values.at(-1)!, returns.length / periodsPerYear), maxDrawdown: calculateMaxDrawdown(values), volatility };
}
export type MonthlyObservation = { month: string; stocks: number; bonds: number; cash: number };
export function selectMonthlySample(data: readonly MonthlyObservation[], startYear: number, endYear: number) {
  if (!Number.isInteger(startYear) || !Number.isInteger(endYear) || startYear > endYear) throw new FinancialInputError("Choose a start year before or equal to the end year.");
  const selected = data.filter((row) => row.month >= `${startYear}-01` && row.month <= `${endYear}-12`);
  if (selected.length !== (endYear - startYear + 1) * 12) throw new FinancialInputError("The dataset needs a complete monthly observation for this period.");
  selected.forEach((row, index) => {
    const month = `${startYear + Math.floor(index / 12)}-${String(index % 12 + 1).padStart(2, "0")}`;
    if (row.month !== month || [row.stocks, row.bonds, row.cash].some((value) => !Number.isFinite(value) || value < -1)) throw new FinancialInputError("The dataset has missing, duplicate, unordered, or invalid observations.");
  });
  return selected;
}
