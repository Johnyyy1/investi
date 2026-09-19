import "server-only";

import type { FmpClientOptions } from "./fmp/client";
import { createFmpMarketDataService } from "./fmp/service";
import { createDeterministicMarketDataService } from "./deterministic/service";
import { MarketDataError } from "./errors";
import type { MarketDataServiceOptions } from "./service";

export type MarketDataProviderName = "deterministic" | "fmp";

export interface MarketDataCompositionOptions extends MarketDataServiceOptions {
  provider: MarketDataProviderName | string;
  fmpApiKey?: string;
  fmpBaseUrl?: string;
  fetch?: FmpClientOptions["fetch"];
}

/** Pure composition boundary. Environment access is deliberately kept in environment.ts. */
export function createMarketDataService(options: MarketDataCompositionOptions) {
  const { provider, fmpApiKey, fmpBaseUrl, fetch, ...serviceOptions } = options;
  if (provider === "deterministic") return createDeterministicMarketDataService(serviceOptions);
  if (provider === "fmp") {
    return createFmpMarketDataService({
      ...serviceOptions,
      apiKey: fmpApiKey,
      baseUrl: fmpBaseUrl,
      fetch,
    });
  }
  throw new MarketDataError("ProviderConfiguration", "The configured market-data provider is not supported.", { provider });
}
