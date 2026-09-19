import "server-only";

import { env } from "@/lib/env";
import { createMarketDataService } from "./composition";

/** Server-only application composition; importing this module never exposes provider secrets to clients. */
export function createConfiguredMarketDataService() {
  return createMarketDataService({
    provider: env.MARKET_DATA_PROVIDER,
    fmpApiKey: env.FMP_API_KEY,
  });
}
