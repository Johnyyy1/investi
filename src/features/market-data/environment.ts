import "server-only";

import { env } from "@/lib/env";
import { createMarketDataService } from "./composition";
import type { MarketDataProviderName } from "./composition";

let configuredService: ReturnType<typeof createMarketDataService> | undefined;

/** Server-only application composition; importing this module never exposes provider secrets to clients. */
export function createConfiguredMarketDataService() {
  return createMarketDataService({
    provider: env.MARKET_DATA_PROVIDER,
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
