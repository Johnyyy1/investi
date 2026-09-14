import "server-only";

import { randomUUID } from "node:crypto";
import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { lessonAward, portfolio, portfolioTrade, user } from "@/db/schema";
import { createDeterministicMarketDataService } from "@/features/market-data/deterministic/service";
import type { Currency, Instrument, Quote } from "@/features/market-data/contracts";
import { foldTrades, type LedgerTrade } from "./domain";
import {
  fxToDecimal,
  fxUnitsFromNumber,
  grossBaseMinor,
  parseQuantity,
  PortfolioInputError,
  priceToDecimal,
  priceUnitsFromNumber,
  quantityToDecimal,
} from "./decimal";

const BASE_CURRENCY: Currency = "CZK";
const marketData = createDeterministicMarketDataService();

type PortfolioRow = typeof portfolio.$inferSelect;
type TradeRow = typeof portfolioTrade.$inferSelect;

function asLedgerTrade(trade: TradeRow): LedgerTrade {
  return {
    instrumentId: trade.instrumentId,
    instrumentSymbol: trade.instrumentSymbol,
    instrumentName: trade.instrumentName,
    instrumentAssetType: trade.instrumentAssetType,
    side: trade.side,
    quantity: trade.quantity,
    grossAmountBaseMinor: trade.grossAmountBaseMinor,
    feeBaseMinor: trade.feeBaseMinor,
    cashDeltaBaseMinor: trade.cashDeltaBaseMinor,
  };
}

async function entitlement(query: Pick<typeof db, "select">, userId: string) {
  const [result] = await query.select({ total: sql<string>`coalesce(sum(${lessonAward.practiceCapitalMinor}), 0)::text` })
    .from(lessonAward).where(eq(lessonAward.userId, userId));
  return BigInt(result?.total ?? "0");
}

async function activePortfolio(query: Pick<typeof db, "select">, userId: string) {
  const [row] = await query.select().from(portfolio)
    .where(and(eq(portfolio.userId, userId), isNull(portfolio.closedAt)));
  return row;
}

interface ExecutionObservation {
  instrument: Instrument;
  quote: Quote;
  quantityUnits: bigint;
  priceUnits: bigint;
  fxUnits: bigint;
  grossMinor: bigint;
}

async function observeExecution(instrumentId: string, quantity: string): Promise<ExecutionObservation> {
  const quantityUnits = parseQuantity(quantity);
  const instrument = await marketData.getInstrumentMetadata(instrumentId);
  if (instrument.assetType === "cash" || instrument.assetType === "index") {
    throw new PortfolioInputError("InvalidInstrument", "Choose a stock, ETF, or bond for this educational portfolio.");
  }
  const quote = await marketData.getQuote(instrument.instrumentId);
  if (quote.freshness.status !== "fresh") {
    throw new PortfolioInputError("QuoteUnavailable", "The sample quote is not fresh enough to place this trade.");
  }
  const fx = quote.currency === BASE_CURRENCY
    ? 1
    : (await marketData.getFxRate(quote.currency, BASE_CURRENCY, quote.observedAt)).rate;
  const priceUnits = priceUnitsFromNumber(quote.price);
  const fxUnits = fxUnitsFromNumber(fx);
  const grossMinor = grossBaseMinor(quantityUnits, priceUnits, fxUnits);
  if (grossMinor <= 0n) throw new PortfolioInputError("InvalidQuantity", "This quantity is too small to produce a one-haléř trade value.");
  return { instrument, quote, quantityUnits, priceUnits, fxUnits, grossMinor };
}

function tradeValues(portfolioId: string, observation: ExecutionObservation, side: "BUY" | "SELL", clientIdempotencyKey: string, now: Date) {
  const feeBaseMinor = 0n;
  return {
    id: randomUUID(),
    portfolioId,
    instrumentId: observation.instrument.instrumentId,
    instrumentSymbol: observation.instrument.symbol,
    instrumentName: observation.instrument.name,
    instrumentAssetType: observation.instrument.assetType,
    side,
    quantity: quantityToDecimal(observation.quantityUnits),
    unitPrice: priceToDecimal(observation.priceUnits),
    quoteCurrency: observation.quote.currency,
    fxRateToBase: fxToDecimal(observation.fxUnits),
    grossAmountBaseMinor: observation.grossMinor,
    feeBaseMinor,
    cashDeltaBaseMinor: side === "BUY" ? -(observation.grossMinor + feeBaseMinor) : observation.grossMinor - feeBaseMinor,
    quoteObservedAt: new Date(observation.quote.observedAt),
    executedAt: now,
    marketDataProvider: observation.quote.provenance.provider,
    marketDataDataset: observation.quote.provenance.dataset,
    marketDataKind: observation.quote.provenance.dataKind,
    marketDataIsDeterministic: observation.quote.provenance.isDeterministic,
    clientIdempotencyKey,
  } as const;
}

const demoSeeds = [
  { instrumentId: "US-XNAS:AAPL", quantity: "1" },
  { instrumentId: "IE-XETR:VWCE", quantity: "1" },
] as const;

async function demoObservations() {
  return Promise.all(demoSeeds.map((seed) => observeExecution(seed.instrumentId, seed.quantity)));
}

/** Lazy, idempotent generation creation. New demo identities receive one seeded ledger. */
export async function getOrCreateActivePortfolio(userId: string) {
  const existing = await activePortfolio(db, userId);
  if (existing) return existing;
  const [owner] = await db.select({ isAnonymous: user.isAnonymous }).from(user).where(eq(user.id, userId));
  if (!owner) throw new PortfolioInputError("PortfolioUnavailable", "Your portfolio could not be opened.");
  const seedObservations = owner.isAnonymous ? await demoObservations() : [];

  return db.transaction(async (tx) => {
    const [lockedOwner] = await tx.select({ isAnonymous: user.isAnonymous }).from(user).where(eq(user.id, userId)).for("update");
    if (!lockedOwner) throw new PortfolioInputError("PortfolioUnavailable", "Your portfolio could not be opened.");
    const current = await activePortfolio(tx, userId);
    if (current) return current;
    const openingCapitalMinor = await entitlement(tx, userId);
    const now = new Date();
    const created: PortfolioRow = {
      id: randomUUID(), userId, baseCurrency: BASE_CURRENCY, openedAt: now, closedAt: null,
      resetFromPortfolioId: null, resetIdempotencyKey: null, openingCapitalMinor,
    };
    await tx.insert(portfolio).values(created);
    if (lockedOwner.isAnonymous && seedObservations.length > 0) {
      const seeds = seedObservations.map((observation, index) => tradeValues(created.id, observation, "BUY", `demo-seed-v1-${index + 1}`, now));
      const total = seeds.reduce((sum, trade) => sum - trade.cashDeltaBaseMinor, 0n);
      if (total <= openingCapitalMinor) await tx.insert(portfolioTrade).values(seeds);
    }
    return created;
  });
}

export async function executeTrade(userId: string, input: {
  instrumentId: string;
  quantity: string;
  side: "BUY" | "SELL";
  clientIdempotencyKey: string;
}) {
  const observation = await observeExecution(input.instrumentId, input.quantity);
  return db.transaction(async (tx) => {
    const [owner] = await tx.select({ id: user.id }).from(user).where(eq(user.id, userId)).for("update");
    if (!owner) throw new PortfolioInputError("PortfolioUnavailable", "Your portfolio could not be found.");
    let current = await activePortfolio(tx, userId);
    if (!current) {
      const openingCapitalMinor = await entitlement(tx, userId);
      const [created] = await tx.insert(portfolio).values({
        id: randomUUID(), userId, baseCurrency: BASE_CURRENCY, openedAt: new Date(), openingCapitalMinor,
      }).returning();
      current = created;
    }
    const [duplicate] = await tx.select().from(portfolioTrade).where(and(
      eq(portfolioTrade.portfolioId, current.id),
      eq(portfolioTrade.clientIdempotencyKey, input.clientIdempotencyKey),
    ));
    if (duplicate) return { trade: duplicate, duplicate: true };

    const [earned, trades] = await Promise.all([
      entitlement(tx, userId),
      tx.select().from(portfolioTrade).where(eq(portfolioTrade.portfolioId, current.id)).orderBy(asc(portfolioTrade.executedAt), asc(portfolioTrade.id)),
    ]);
    const folded = foldTrades(earned, trades.map(asLedgerTrade));
    if (input.side === "BUY" && observation.grossMinor > folded.cashMinor) {
      throw new PortfolioInputError("InsufficientCash", "You do not have enough available Practice Capital for this trade.");
    }
    if (input.side === "SELL") {
      const holding = folded.holdings.find(({ instrumentId }) => instrumentId === input.instrumentId);
      if (!holding || observation.quantityUnits > holding.quantityUnits) {
        throw new PortfolioInputError("Oversell", "You cannot sell more than the quantity you hold.");
      }
    }
    const values = tradeValues(current.id, observation, input.side, input.clientIdempotencyKey, new Date());
    const [trade] = await tx.insert(portfolioTrade).values(values).returning();
    return { trade, duplicate: false };
  });
}

export async function resetActivePortfolio(userId: string, clientIdempotencyKey: string) {
  return db.transaction(async (tx) => {
    const [owner] = await tx.select({ id: user.id }).from(user).where(eq(user.id, userId)).for("update");
    if (!owner) throw new PortfolioInputError("PortfolioUnavailable", "Your portfolio could not be found.");
    const [duplicate] = await tx.select().from(portfolio).where(and(
      eq(portfolio.userId, userId), eq(portfolio.resetIdempotencyKey, clientIdempotencyKey),
    ));
    if (duplicate) return { portfolio: duplicate, duplicate: true };
    const current = await activePortfolio(tx, userId);
    const now = new Date();
    if (current) await tx.update(portfolio).set({ closedAt: now }).where(and(eq(portfolio.id, current.id), eq(portfolio.userId, userId)));
    const openingCapitalMinor = await entitlement(tx, userId);
    const [created] = await tx.insert(portfolio).values({
      id: randomUUID(), userId, baseCurrency: BASE_CURRENCY, openedAt: now,
      resetFromPortfolioId: current?.id ?? null, resetIdempotencyKey: clientIdempotencyKey, openingCapitalMinor,
    }).returning();
    return { portfolio: created, duplicate: false };
  });
}

export async function loadPortfolioRows(userId: string) {
  const current = await getOrCreateActivePortfolio(userId);
  const [earnedPracticeCapitalMinor, trades] = await Promise.all([
    entitlement(db, userId),
    db.select().from(portfolioTrade).where(eq(portfolioTrade.portfolioId, current.id)).orderBy(asc(portfolioTrade.executedAt), asc(portfolioTrade.id)),
  ]);
  return { portfolio: current, earnedPracticeCapitalMinor, trades };
}

export { marketData };
