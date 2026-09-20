import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    DATABASE_URL: z.url(),
    DETERMINISTIC_MARKET_NOW: z.string().datetime().optional(),
    FMP_API_KEY: z.string().min(1).optional(),
    FX_DATA_PROVIDER: z.enum(["deterministic", "frankfurter"]).optional(),
    MARKET_DATA_PROVIDER: z.enum(["deterministic", "fmp"]).default("deterministic"),
  },
  client: { NEXT_PUBLIC_APP_URL: z.url().optional() },
  experimental__runtimeEnv: { NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL },
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
  emptyStringAsUndefined: true,
});
