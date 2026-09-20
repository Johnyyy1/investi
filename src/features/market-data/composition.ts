import "server-only";

import { InMemoryMarketDataCache } from "./cache";
import { FIXTURE_RETRIEVED_AT } from "./deterministic/fixtures";
import { DeterministicMarketDataProvider } from "./deterministic/provider";
import type { FmpClientOptions } from "./fmp/client";
import { FmpClient } from "./fmp/client";
import { FmpMarketDataProvider } from "./fmp/provider";
import type { FrankfurterClientOptions } from "./frankfurter/client";
import { createFrankfurterFxProvider, FRANKFURTER_FX_CACHE_MILLISECONDS } from "./frankfurter/service";
import { MarketDataError } from "./errors";
import { MarketDataService, type MarketDataServiceOptions } from "./service";

export type MarketDataProviderName = "deterministic" | "fmp";
export type FxDataProviderName = "deterministic" | "frankfurter";

export interface MarketDataCompositionOptions extends Omit<MarketDataServiceOptions, "fxProvider"> {
  provider: MarketDataProviderName | string;
  fxProvider?: FxDataProviderName | string;
  fmpApiKey?: string;
  fmpBaseUrl?: string;
  frankfurterBaseUrl?: string;
  fetch?: FmpClientOptions["fetch"];
  frankfurterFetch?: FrankfurterClientOptions["fetch"];
}

/** Pure composition boundary. Environment access is deliberately kept in environment.ts. */
export function createMarketDataService(options: MarketDataCompositionOptions) {
  const {
    provider,
    fxProvider: configuredFxProvider,
    fmpApiKey,
    fmpBaseUrl,
    frankfurterBaseUrl,
    fetch,
    frankfurterFetch,
    ...serviceOptions
  } = options;
  const fxProviderName = configuredFxProvider ?? (provider === "deterministic" ? "deterministic" : undefined);
  if (!fxProviderName) {
    throw new MarketDataError("ProviderConfiguration", "FX_DATA_PROVIDER must be set when live security data is selected.", {
      provider,
      operation: "configuration",
      reason: "missing-fx-provider",
    });
  }
  const clock = serviceOptions.clock ?? (provider === "deterministic" && fxProviderName === "deterministic"
    ? () => new Date(FIXTURE_RETRIEVED_AT)
    : () => new Date());

  const securityProvider = provider === "deterministic"
    ? new DeterministicMarketDataProvider(clock)
    : provider === "fmp"
      ? new FmpMarketDataProvider(new FmpClient({ apiKey: fmpApiKey, baseUrl: fmpBaseUrl, fetch }), clock)
      : undefined;
  if (!securityProvider) {
    throw new MarketDataError("ProviderConfiguration", "The configured market-data provider is not supported.", { provider });
  }

  const fxProvider = fxProviderName === "deterministic"
    ? provider === "deterministic" ? securityProvider : new DeterministicMarketDataProvider(clock)
    : fxProviderName === "frankfurter"
      ? createFrankfurterFxProvider({ baseUrl: frankfurterBaseUrl, fetch: frankfurterFetch, clock })
      : undefined;
  if (!fxProvider) {
    throw new MarketDataError("ProviderConfiguration", "The configured FX data provider is not supported.", { fxProvider: fxProviderName });
  }

  const externalData = provider === "fmp" || fxProviderName === "frankfurter";
  const cache = serviceOptions.cache ?? (externalData
    ? new InMemoryMarketDataCache({
        clock: () => clock().getTime(),
        ttls: fxProviderName === "frankfurter" ? { fxMilliseconds: FRANKFURTER_FX_CACHE_MILLISECONDS } : undefined,
      })
    : undefined);
  return new MarketDataService(securityProvider, { ...serviceOptions, ...(cache ? { cache } : {}), clock, fxProvider });
}
