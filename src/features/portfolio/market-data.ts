import "server-only";

import type { Currency, FxRate, Instrument, Quote, QuoteFreshnessStatus, UtcTimestamp } from "@/features/market-data/contracts";
import type { FxDataProviderName, MarketDataProviderName } from "@/features/market-data/composition";
import { isMarketDataError, MarketDataError } from "@/features/market-data/errors";
import type { MarketDataService } from "@/features/market-data/service";
import {
  fxUnitsFromNumber,
  grossBaseMinor,
  parseQuantity,
  PortfolioInputError,
  priceToDecimal,
  priceUnitsFromNumber,
} from "./decimal";

export interface PortfolioMarketDataGateway {
  provider: MarketDataProviderName;
  fxProvider: FxDataProviderName;
  service: MarketDataService;
}

export type PortfolioMarketDataMode = "sample" | "market";
export type ValuationUnavailableReason = "quote" | "fx" | "instrument" | "rate-limit" | "provider";

export interface PortfolioExecutionObservation {
  instrument: Instrument;
  quote: Quote;
  quantityUnits: bigint;
  priceUnits: bigint;
  fxUnits: bigint;
  grossMinor: bigint;
  fx: FxRate;
}

export interface PortfolioHoldingMarketObservation {
  instrumentId: string;
  marketValueMinor: bigint | null;
  currentPrice: string | null;
  currentPriceCurrency: Currency | null;
  quoteObservedAt: UtcTimestamp | null;
  quoteRetrievedAt: UtcTimestamp | null;
  quoteFreshness: QuoteFreshnessStatus | null;
  fxReferenceDate: string | null;
  fxRetrievedAt: UtcTimestamp | null;
  fxProvider: string | null;
  unavailableReason?: ValuationUnavailableReason;
}

export interface PortfolioInstrumentPreview {
  instrument: Instrument;
  price: string;
  estimatedUnitCostBaseMinor: string;
  quoteObservedAt: UtcTimestamp;
  quoteRetrievedAt: UtcTimestamp;
  fxReferenceDate: string;
  fxProvider: string;
  provider: string;
  dataset: string;
  marketDataMode: PortfolioMarketDataMode;
}

export function marketDataMode(gateway: PortfolioMarketDataGateway): PortfolioMarketDataMode {
  return gateway.provider === "deterministic" ? "sample" : "market";
}

export function assertCompatibleInstrumentId(gateway: PortfolioMarketDataGateway, instrumentId: string) {
  const fmpIdentity = instrumentId.startsWith("FMP:");
  const compatible = gateway.provider === "fmp" ? fmpIdentity : !fmpIdentity;
  if (!compatible) {
    throw new MarketDataError("UnsupportedInstrument", "This persisted instrument belongs to a different market-data provider.", {
      configuredProvider: gateway.provider,
      instrumentId,
    });
  }
}

function assertTradeable(instrument: Instrument) {
  if (instrument.assetType === "cash" || instrument.assetType === "index") {
    throw new PortfolioInputError("InvalidInstrument", "Choose a stock, ETF, or bond for this educational portfolio.");
  }
}

function assertQuoteMatchesInstrument(instrument: Instrument, quote: Quote) {
  if (quote.instrumentId !== instrument.instrumentId || quote.currency !== instrument.quoteCurrency) {
    throw new MarketDataError("MalformedProviderResponse", "The quote does not match the resolved instrument.", {
      instrumentId: instrument.instrumentId,
      operation: "portfolio-execution",
    });
  }
}

export async function observePortfolioExecution(
  gateway: PortfolioMarketDataGateway,
  instrumentId: string,
  quantity: string,
  baseCurrency: Currency,
): Promise<PortfolioExecutionObservation> {
  assertCompatibleInstrumentId(gateway, instrumentId);
  const quantityUnits = parseQuantity(quantity);
  const instrument = await gateway.service.getInstrumentMetadata(instrumentId);
  assertTradeable(instrument);
  const quote = await gateway.service.getQuote(instrument.instrumentId);
  assertQuoteMatchesInstrument(instrument, quote);
  if (quote.freshness.status !== "fresh") {
    throw new PortfolioInputError("QuoteUnavailable", "The current market observation is not fresh enough to simulate this trade.");
  }
  const fx = await gateway.service.getFxRate(quote.currency, baseCurrency, quote.observedAt);
  const priceUnits = priceUnitsFromNumber(quote.price);
  const fxUnits = fxUnitsFromNumber(fx.rate);
  const grossMinor = grossBaseMinor(quantityUnits, priceUnits, fxUnits);
  if (grossMinor <= 0n) throw new PortfolioInputError("InvalidQuantity", "This quantity is too small to produce a one-haléř trade value.");
  return {
    instrument,
    quote,
    quantityUnits,
    priceUnits,
    fxUnits,
    grossMinor,
    fx,
  };
}

export async function loadPortfolioInstrumentPreview(
  gateway: PortfolioMarketDataGateway,
  instrumentId: string,
): Promise<PortfolioInstrumentPreview | null> {
  assertCompatibleInstrumentId(gateway, instrumentId);
  const instrument = await gateway.service.getInstrumentMetadata(instrumentId);
  if (instrument.assetType === "cash" || instrument.assetType === "index") return null;
  const quote = await gateway.service.getQuote(instrumentId);
  assertQuoteMatchesInstrument(instrument, quote);
  if (quote.freshness.status !== "fresh") return null;
  const fx = await gateway.service.getFxRate(quote.currency, "CZK", quote.observedAt);
  return {
    instrument,
    price: priceToDecimal(priceUnitsFromNumber(quote.price)),
    estimatedUnitCostBaseMinor: grossBaseMinor(parseQuantity("1"), priceUnitsFromNumber(quote.price), fxUnitsFromNumber(fx.rate)).toString(),
    quoteObservedAt: quote.observedAt,
    quoteRetrievedAt: quote.retrievedAt,
    fxReferenceDate: fx.referenceDate,
    fxProvider: fx.provenance.provider,
    provider: quote.provenance.provider,
    dataset: quote.provenance.dataset,
    marketDataMode: quote.provenance.isDeterministic ? "sample" : "market",
  };
}

function failureReason(error: unknown, operation: "quote" | "fx"): ValuationUnavailableReason {
  if (!isMarketDataError(error)) return "provider";
  if (error.code === "RateLimited") return "rate-limit";
  if (error.code === "InstrumentNotFound" || error.code === "UnsupportedInstrument") return "instrument";
  if (error.code === "FxUnavailable") return "fx";
  if (["ProviderAuthentication", "ProviderConfiguration", "ProviderUnavailable", "MalformedProviderResponse"].includes(error.code)) return "provider";
  return operation;
}

function unavailableHolding(instrumentId: string, reason: ValuationUnavailableReason): PortfolioHoldingMarketObservation {
  return {
    instrumentId,
    marketValueMinor: null,
    currentPrice: null,
    currentPriceCurrency: null,
    quoteObservedAt: null,
    quoteRetrievedAt: null,
    quoteFreshness: null,
    fxReferenceDate: null,
    fxRetrievedAt: null,
    fxProvider: null,
    unavailableReason: reason,
  };
}

export async function observePortfolioHoldingValue(
  gateway: PortfolioMarketDataGateway,
  holding: { instrumentId: string; quantityUnits: bigint },
  baseCurrency: Currency,
): Promise<PortfolioHoldingMarketObservation> {
  try {
    assertCompatibleInstrumentId(gateway, holding.instrumentId);
  } catch (error) {
    return unavailableHolding(holding.instrumentId, failureReason(error, "quote"));
  }

  let quote: Quote;
  try {
    quote = await gateway.service.getQuote(holding.instrumentId);
    if (quote.freshness.status === "unavailable") return unavailableHolding(holding.instrumentId, "quote");
  } catch (error) {
    return unavailableHolding(holding.instrumentId, failureReason(error, "quote"));
  }

  try {
    // Current valuation uses the current reference FX fixing independently from the security observation.
    const fx = await gateway.service.getFxRate(quote.currency, baseCurrency, quote.retrievedAt);
    const priceUnits = priceUnitsFromNumber(quote.price);
    return {
      instrumentId: holding.instrumentId,
      marketValueMinor: grossBaseMinor(holding.quantityUnits, priceUnits, fxUnitsFromNumber(fx.rate)),
      currentPrice: priceToDecimal(priceUnits),
      currentPriceCurrency: quote.currency,
      quoteObservedAt: quote.observedAt,
      quoteRetrievedAt: quote.retrievedAt,
      quoteFreshness: quote.freshness.status,
      fxReferenceDate: fx.referenceDate,
      fxRetrievedAt: fx.retrievedAt,
      fxProvider: fx.provenance.provider,
    };
  } catch (error) {
    return unavailableHolding(holding.instrumentId, failureReason(error, "fx"));
  }
}
