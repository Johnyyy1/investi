import { describe, expect, it } from "vitest";

import { inspectMarketDataReadiness } from "./readiness";

describe("market-data readiness diagnostics", () => {
  it("reports FMP, Frankfurter, capabilities, and supported session calendars", () => {
    expect(inspectMarketDataReadiness({
      securityProvider: "fmp",
      fxProvider: "frankfurter",
      fmpApiKey: "server-only-test-secret",
    })).toEqual({
      ready: true,
      security: { provider: "fmp", configured: true, capabilities: ["search", "profile", "quote", "history"] },
      fx: { provider: "frankfurter", configured: true, requiresApiKey: false, capabilities: ["reference-rates"] },
      sessions: {
        calendars: [{
          id: "us-equities",
          configured: true,
          timeZone: "America/New_York",
          exchangeMics: ["XNAS", "XNYS", "XASE"],
          regularSession: "09:30-16:00",
          earlyClosesSupported: false,
        }],
        unknownExchangePolicy: "age-based-conservative",
      },
    });
  });

  it("reports a missing FMP key without exposing secret material", () => {
    const secret = "do-not-print-this-key";
    const configured = inspectMarketDataReadiness({ securityProvider: "fmp", fxProvider: "frankfurter", fmpApiKey: secret });
    expect(JSON.stringify(configured)).not.toContain(secret);
    expect(JSON.stringify(configured)).not.toContain("fmpApiKey");
    expect(inspectMarketDataReadiness({ securityProvider: "fmp", fxProvider: "frankfurter" })).toMatchObject({
      ready: false,
      security: { configured: false },
      fx: { configured: true, requiresApiKey: false },
    });
  });
});
