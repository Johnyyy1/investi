import "server-only";

import { env } from "@/lib/env";
import { MarketDataError } from "./errors";
import { createMarketDataService } from "./composition";
import type { FxDataProviderName, MarketDataProviderName } from "./composition";

let configuredService: ReturnType<typeof createMarketDataService> | undefined;

/** Server-only application composition; importing this module never exposes provider secrets to clients. */
export function createConfiguredMarketDataService() {
  return createMarketDataService({
    provider: env.MARKET_DATA_PROVIDER,
    fxProvider: env.FX_DATA_PROVIDER,
    fmpApiKey: env.FMP_API_KEY,
  });
}

/** Process-local singleton used by application features so cache/coalescing state is shared. */
export function getConfiguredMarketDataService() {
  configuredService ??= createConfiguredMarketDataService();
  return configuredService;
}

export function getConfiguredMarketDataProviderName(): MarketDataProviderName {
  return env.MARKET_DATA_PROVIDER;
}

export function getConfiguredFxDataProviderName(): FxDataProviderName {
  if (env.FX_DATA_PROVIDER) return env.FX_DATA_PROVIDER;
  if (env.MARKET_DATA_PROVIDER === "deterministic") return "deterministic";
  throw new MarketDataError("ProviderConfiguration", "FX_DATA_PROVIDER must be configured when MARKET_DATA_PROVIDER=fmp.", {
    provider: env.MARKET_DATA_PROVIDER,
    operation: "configuration",
    reason: "missing-fx-provider",
  });
}
