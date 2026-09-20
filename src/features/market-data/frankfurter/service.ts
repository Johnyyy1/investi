import "server-only";

import type { FrankfurterClientOptions } from "./client";
import { FrankfurterClient } from "./client";
import { FrankfurterFxProvider, type FrankfurterClock } from "./provider";

export const FRANKFURTER_FX_CACHE_MILLISECONDS = 60 * 60 * 1_000;

export interface FrankfurterFxProviderOptions {
  baseUrl?: string;
  fetch?: FrankfurterClientOptions["fetch"];
  clock?: FrankfurterClock;
}

/** Provider factory used by the multi-provider application composition root. */
export function createFrankfurterFxProvider(options: FrankfurterFxProviderOptions = {}) {
  const clock = options.clock ?? (() => new Date());
  return new FrankfurterFxProvider(new FrankfurterClient({
    baseUrl: options.baseUrl,
    fetch: options.fetch,
  }), clock);
}
