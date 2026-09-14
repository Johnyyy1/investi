import "server-only";

import type { Currency } from "@/features/market-data/contracts";
import { isMarketDataError } from "@/features/market-data/errors";
import { allocationBasisPoints, foldTrades, valuePortfolio, type HoldingValuation } from "./domain";
import { fxUnitsFromNumber, grossBaseMinor, parseQuantity, priceToDecimal, priceUnitsFromNumber, quantityToDecimal } from "./decimal";
import { loadPortfolioRows, marketData } from "./repository";

export interface PortfolioView {
  portfolioId: string;
  baseCurrency: Currency;
  openedAt: string;
  openingCapitalMinor: string;
  earnedPracticeCapitalMinor: string;
  availableCashMinor: string;
  holdingsMarketValueMinor: string | null;
  portfolioTotalMinor: string | null;
  investmentGainLossMinor: string | null;
  investmentGainLossBasisPoints: string | null;
  valuationComplete: boolean;
  holdings: Array<{
    instrumentId: string;
    symbol: string;
    name: string;
    assetType: string;
    quantity: string;
    averageCostBaseMinor: string;
    costBasisMinor: string;
    currentPrice: string | null;
    currentPriceCurrency: Currency | null;
    marketValueMinor: string | null;
    allocationBasisPoints: string | null;
    gainLossMinor: string | null;
    quoteObservedAt: string | null;
    unavailableReason?: "quote" | "fx";
  }>;
  recentActivity: Array<{
    id: string;
    side: "BUY" | "SELL";
    symbol: string;
    name: string;
    quantity: string;
    unitPrice: string;
    quoteCurrency: string;
    grossAmountBaseMinor: string;
    executedAt: string;
  }>;
}

export interface InstrumentPreview {
  instrument: Awaited<ReturnType<typeof marketData.getInstrumentMetadata>>;
  price: string;
  estimatedUnitCostBaseMinor: string;
  quoteObservedAt: string;
  provider: string;
  dataset: string;
}

export async function loadPortfolioView(userId: string): Promise<PortfolioView> {
  const rows = await loadPortfolioRows(userId);
  const folded = foldTrades(rows.earnedPracticeCapitalMinor, rows.trades);
  const quoteDetails = new Map<string, { price: string; currency: Currency }>();
  const valuations: HoldingValuation[] = await Promise.all(folded.holdings.map(async (holding) => {
    try {
      const quote = await marketData.getQuote(holding.instrumentId);
      if (quote.freshness.status !== "fresh") return { instrumentId: holding.instrumentId, marketValueMinor: null, quoteObservedAt: quote.observedAt, unavailableReason: "quote" as const };
      const fx = quote.currency === rows.portfolio.baseCurrency
        ? 1
        : (await marketData.getFxRate(quote.currency, rows.portfolio.baseCurrency as Currency, quote.observedAt)).rate;
      const priceUnits = priceUnitsFromNumber(quote.price);
      quoteDetails.set(holding.instrumentId, { price: priceToDecimal(priceUnits), currency: quote.currency });
      return {
        instrumentId: holding.instrumentId,
        marketValueMinor: grossBaseMinor(holding.quantityUnits, priceUnits, fxUnitsFromNumber(fx)),
        quoteObservedAt: quote.observedAt,
      };
    } catch (error) {
      const unavailableReason = isMarketDataError(error) && error.code === "FxUnavailable" ? "fx" : "quote";
      return { instrumentId: holding.instrumentId, marketValueMinor: null, quoteObservedAt: null, unavailableReason };
    }
  }));
  const valued = valuePortfolio(rows.earnedPracticeCapitalMinor, folded, valuations);
  const invested = valued.holdingsMarketValueMinor;
  return {
    portfolioId: rows.portfolio.id,
    baseCurrency: rows.portfolio.baseCurrency as Currency,
    openedAt: rows.portfolio.openedAt.toISOString(),
    openingCapitalMinor: rows.portfolio.openingCapitalMinor.toString(),
    earnedPracticeCapitalMinor: rows.earnedPracticeCapitalMinor.toString(),
    availableCashMinor: folded.cashMinor.toString(),
    holdingsMarketValueMinor: invested?.toString() ?? null,
    portfolioTotalMinor: valued.portfolioTotalMinor?.toString() ?? null,
    investmentGainLossMinor: valued.investmentGainLossMinor?.toString() ?? null,
    investmentGainLossBasisPoints: valued.investmentGainLossMinor === null || rows.earnedPracticeCapitalMinor === 0n
      ? null
      : ((valued.investmentGainLossMinor * 10_000n) / rows.earnedPracticeCapitalMinor).toString(),
    valuationComplete: valued.complete,
    holdings: valued.holdings.map((holding) => {
      const quote = quoteDetails.get(holding.instrumentId);
      return {
        instrumentId: holding.instrumentId,
        symbol: holding.symbol,
        name: holding.name,
        assetType: holding.assetType,
        quantity: quantityToDecimal(holding.quantityUnits),
        averageCostBaseMinor: holding.averageCostBaseMinor.toString(),
        costBasisMinor: holding.costBasisMinor.toString(),
        currentPrice: quote?.price ?? null,
        currentPriceCurrency: quote?.currency ?? null,
        marketValueMinor: holding.marketValueMinor?.toString() ?? null,
        allocationBasisPoints: holding.marketValueMinor === null || invested === null ? null : allocationBasisPoints(holding.marketValueMinor, invested).toString(),
        gainLossMinor: holding.gainLossMinor?.toString() ?? null,
        quoteObservedAt: holding.quoteObservedAt,
        unavailableReason: holding.unavailableReason,
      };
    }),
    recentActivity: rows.trades.slice(-8).reverse().map((trade) => ({
      id: trade.id,
      side: trade.side,
      symbol: trade.instrumentSymbol,
      name: trade.instrumentName,
      quantity: trade.quantity,
      unitPrice: trade.unitPrice,
      quoteCurrency: trade.quoteCurrency,
      grossAmountBaseMinor: trade.grossAmountBaseMinor.toString(),
      executedAt: trade.executedAt.toISOString(),
    })),
  };
}

export async function loadInstrumentPreview(instrumentId: string): Promise<InstrumentPreview | null> {
  const instrument = await marketData.getInstrumentMetadata(instrumentId);
  if (instrument.assetType === "cash" || instrument.assetType === "index") return null;
  const quote = await marketData.getQuote(instrumentId);
  if (quote.freshness.status !== "fresh") return null;
  const fx = quote.currency === "CZK" ? 1 : (await marketData.getFxRate(quote.currency, "CZK", quote.observedAt)).rate;
  return {
    instrument,
    price: priceToDecimal(priceUnitsFromNumber(quote.price)),
    estimatedUnitCostBaseMinor: grossBaseMinor(parseQuantity("1"), priceUnitsFromNumber(quote.price), fxUnitsFromNumber(fx)).toString(),
    quoteObservedAt: quote.observedAt,
    provider: quote.provenance.provider,
    dataset: quote.provenance.dataset,
  };
}
