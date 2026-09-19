import "server-only";

import { InMemoryMarketDataCache } from "../cache";
import { MarketDataService, type MarketDataServiceOptions } from "../service";
import { FmpClient, type FmpClientOptions } from "./client";
import { FmpMarketDataProvider } from "./provider";

export interface FmpMarketDataServiceOptions extends MarketDataServiceOptions {
  apiKey?: string;
  baseUrl?: string;
  fetch?: FmpClientOptions["fetch"];
}

/** Explicit FMP composition root; callers choose it instead of receiving a hidden fallback. */
export function createFmpMarketDataService(options: FmpMarketDataServiceOptions = {}) {
  const { apiKey, baseUrl, fetch: fetchImplementation, ...serviceOptions } = options;
  const clock = serviceOptions.clock ?? (() => new Date());
  const cache = serviceOptions.cache ?? new InMemoryMarketDataCache({ clock: () => clock().getTime() });
  const client = new FmpClient({ apiKey, baseUrl, fetch: fetchImplementation });
  return new MarketDataService(new FmpMarketDataProvider(client, clock), { ...serviceOptions, cache, clock });
}
