import "server-only";

import {
  getConfiguredFxDataProviderName,
  getConfiguredMarketDataProviderName,
  getConfiguredMarketDataService,
} from "@/features/market-data/environment";
import type { PortfolioMarketDataGateway } from "./market-data";

/** The sole Portfolio Lab market-data composition point. */
export const portfolioMarketData: PortfolioMarketDataGateway = {
  provider: getConfiguredMarketDataProviderName(),
  fxProvider: getConfiguredFxDataProviderName(),
  service: getConfiguredMarketDataService(),
};
