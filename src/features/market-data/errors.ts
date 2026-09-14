import type { InstrumentId } from "./contracts";

export const marketDataErrorCodes = [
  "InstrumentNotFound",
  "UnsupportedInstrument",
  "UnsupportedAdjustment",
  "UnsupportedInterval",
  "UnsupportedTimeZone",
  "QuoteUnavailable",
  "HistoricalDataUnavailable",
  "FxUnavailable",
  "RateLimited",
  "ProviderUnavailable",
  "InvalidDateRange",
] as const;

export type MarketDataErrorCode = (typeof marketDataErrorCodes)[number];
export type MarketDataErrorContext = Readonly<Record<string, string | number | boolean | undefined>>;

/** Provider-neutral error safe for application code to inspect. */
export class MarketDataError extends Error {
  readonly code: MarketDataErrorCode;
  readonly context: MarketDataErrorContext;

  constructor(
    code: MarketDataErrorCode,
    message: string,
    context: MarketDataErrorContext = {},
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "MarketDataError";
    this.code = code;
    this.context = context;
  }
}

export function instrumentNotFound(instrumentId: InstrumentId) {
  return new MarketDataError("InstrumentNotFound", "The requested instrument was not found.", { instrumentId });
}

export function isMarketDataError(error: unknown): error is MarketDataError {
  return error instanceof MarketDataError;
}
