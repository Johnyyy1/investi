import "server-only";

import { MarketDataService, type MarketDataServiceOptions } from "../service";
import { FIXTURE_RETRIEVED_AT } from "./fixtures";
import { DeterministicMarketDataProvider } from "./provider";
import { DeterministicEquityFundamentalsProvider } from "./fundamentals";

/** Phase 4C composition root. Replace only this wiring when a real adapter is introduced. */
export function createDeterministicMarketDataService(options: MarketDataServiceOptions = {}) {
  const clock = options.clock ?? (() => new Date(FIXTURE_RETRIEVED_AT));
  return new MarketDataService(new DeterministicMarketDataProvider(clock), { ...options, clock, equityFundamentalsProvider: options.equityFundamentalsProvider ?? new DeterministicEquityFundamentalsProvider(clock) });
}
