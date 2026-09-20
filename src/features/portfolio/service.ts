import "server-only";

import type { Currency } from "@/features/market-data/contracts";
import { allocationBasisPoints, foldTrades, valuePortfolio, type HoldingValuation } from "./domain";
import { quantityToDecimal } from "./decimal";
import { portfolioMarketData } from "./environment";
import {
  loadPortfolioInstrumentPreview,
  marketDataMode,
  observePortfolioHoldingValue,
  type PortfolioInstrumentPreview,
  type ValuationUnavailableReason,
} from "./market-data";
import { loadPortfolioRows } from "./repository";

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
  valuedHoldingsCount: number;
  totalHoldingsCount: number;
  marketDataMode: "sample" | "market";
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
    quoteRetrievedAt: string | null;
    quoteFreshness: "fresh" | "stale" | "unavailable" | null;
    fxObservedAt: string | null;
    fxRetrievedAt: string | null;
    unavailableReason?: ValuationUnavailableReason;
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

export type InstrumentPreview = PortfolioInstrumentPreview;

export async function loadPortfolioView(userId: string): Promise<PortfolioView> {
  const rows = await loadPortfolioRows(userId);
  const folded = foldTrades(rows.earnedPracticeCapitalMinor, rows.trades);
  const observations = await Promise.all(folded.holdings.map((holding) => observePortfolioHoldingValue(
    portfolioMarketData,
    holding,
    rows.portfolio.baseCurrency as Currency,
  )));
  const observationByInstrument = new Map(observations.map((observation) => [observation.instrumentId, observation]));
  const valuations: HoldingValuation[] = observations.map((observation) => ({
    instrumentId: observation.instrumentId,
    marketValueMinor: observation.marketValueMinor,
    quoteObservedAt: observation.quoteObservedAt,
    unavailableReason: observation.unavailableReason,
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
    valuedHoldingsCount: observations.filter(({ marketValueMinor }) => marketValueMinor !== null).length,
    totalHoldingsCount: folded.holdings.length,
    marketDataMode: marketDataMode(portfolioMarketData),
    holdings: valued.holdings.map((holding) => {
      const observation = observationByInstrument.get(holding.instrumentId);
      return {
        instrumentId: holding.instrumentId,
        symbol: holding.symbol,
        name: holding.name,
        assetType: holding.assetType,
        quantity: quantityToDecimal(holding.quantityUnits),
        averageCostBaseMinor: holding.averageCostBaseMinor.toString(),
        costBasisMinor: holding.costBasisMinor.toString(),
        currentPrice: observation?.currentPrice ?? null,
        currentPriceCurrency: observation?.currentPriceCurrency ?? null,
        marketValueMinor: holding.marketValueMinor?.toString() ?? null,
        allocationBasisPoints: holding.marketValueMinor === null || invested === null ? null : allocationBasisPoints(holding.marketValueMinor, invested).toString(),
        gainLossMinor: holding.gainLossMinor?.toString() ?? null,
        quoteObservedAt: holding.quoteObservedAt,
        quoteRetrievedAt: observation?.quoteRetrievedAt ?? null,
        quoteFreshness: observation?.quoteFreshness ?? null,
        fxObservedAt: observation?.fxObservedAt ?? null,
        fxRetrievedAt: observation?.fxRetrievedAt ?? null,
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
  return loadPortfolioInstrumentPreview(portfolioMarketData, instrumentId);
}
