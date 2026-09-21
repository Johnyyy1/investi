import "server-only";

import type {
  CorporateAction,
  Currency,
  HistoricalPricePoint,
  Instrument,
  InstrumentId,
} from "../contracts";

export const DETERMINISTIC_PROVIDER_ID = "investi-deterministic";
export const DETERMINISTIC_DATASET = "investi-education-market-v1";
export const FIXTURE_OBSERVED_AT = "2026-01-16T20:45:00.000Z";
export const FIXTURE_RETRIEVED_AT = "2026-01-16T20:50:00.000Z";

export const deterministicInstruments: readonly Instrument[] = [
  { instrumentId: "US-XNAS:AAPL", symbol: "AAPL", name: "Apple Inc.", assetType: "equity", exchangeMic: "XNAS", quoteCurrency: "USD", equityProfile: { sector: "Technology", industry: "Consumer devices", country: "US", marketCap: 2_850_000_000_000 } },
  { instrumentId: "US-XNAS:MSFT", symbol: "MSFT", name: "Microsoft Corporation", assetType: "equity", exchangeMic: "XNAS", quoteCurrency: "USD", equityProfile: { sector: "Technology", industry: "Software", country: "US", marketCap: 2_240_000_000_000 } },
  { instrumentId: "US-XNAS:NVDA", symbol: "NVDA", name: "NVIDIA Corporation", assetType: "equity", exchangeMic: "XNAS", quoteCurrency: "USD", equityProfile: { sector: "Technology", industry: "Semiconductors", country: "US", marketCap: 1_920_000_000_000 } },
  { instrumentId: "IE-XETR:VWCE", symbol: "VWCE", name: "Vanguard FTSE All-World UCITS ETF", assetType: "etf", exchangeMic: "XETR", quoteCurrency: "EUR" },
  { instrumentId: "CZ-XPRA:CZGB35", symbol: "CZGB35", name: "Czech Government Bond 2035", assetType: "bond", exchangeMic: "XPRA", quoteCurrency: "CZK" },
  { instrumentId: "CASH:CZK", symbol: "CZK", name: "Czech Koruna Cash", assetType: "cash", exchangeMic: null, quoteCurrency: "CZK" },
  { instrumentId: "US-XCBO:SPX", symbol: "SPX", name: "S&P 500 Index", assetType: "index", exchangeMic: "XCBO", quoteCurrency: "USD" },
];

export const deterministicPrices: Readonly<Record<InstrumentId, number>> = {
  "US-XNAS:AAPL": 114,
  "US-XNAS:MSFT": 212,
  "US-XNAS:NVDA": 178,
  "IE-XETR:VWCE": 124,
  "CZ-XPRA:CZGB35": 100.6,
  "CASH:CZK": 1,
  "US-XCBO:SPX": 5_140,
};

const dates = ["2026-01-05", "2026-01-06", "2026-01-07", "2026-01-08", "2026-01-09", "2026-01-12", "2026-01-13", "2026-01-14", "2026-01-15", "2026-01-16"];

// Synthetic weekday history makes the 1M and 1Y educational chart views distinct.
// It is used only by the deterministic provider and is not a claim of real trading activity.
function sampleAaplHistory(): readonly HistoricalPricePoint[] {
  const points: HistoricalPricePoint[] = [];
  const end = Date.parse("2025-12-31T00:00:00.000Z");
  let index = 0;
  for (let time = Date.parse("2025-01-02T00:00:00.000Z"); time <= end; time += 86_400_000) {
    const date = new Date(time);
    if (date.getUTCDay() === 0 || date.getUTCDay() === 6) continue;
    const close = Number((88 + index * 0.052 + Math.sin(index * 0.13) * 3.2 + Math.sin(index * 0.037) * 2).toFixed(2));
    points.push({ date: date.toISOString().slice(0, 10), open: close, high: close, low: close, close });
    index += 1;
  }
  return [...points, ...bars([100, 102, 99, 95, 98, 104, 108, 106, 111, 114])];
}

function bars(closes: readonly (number | null)[], withVolume = true): readonly HistoricalPricePoint[] {
  return closes.flatMap((close, index) => {
    if (close === null) return [];
    const open = Number((close * (index % 2 === 0 ? 0.995 : 1.004)).toFixed(4));
    return [{
      date: dates[index],
      open,
      high: Number((Math.max(open, close) * 1.006).toFixed(4)),
      low: Number((Math.min(open, close) * 0.994).toFixed(4)),
      close,
      ...(withVolume ? { volume: 1_000_000 + index * 37_000 } : {}),
    }];
  });
}

export interface DeterministicHistoryFixture {
  points: readonly HistoricalPricePoint[];
  completeness: "complete" | "partial";
}

export const deterministicHistory: Readonly<Record<InstrumentId, DeterministicHistoryFixture>> = {
  "US-XNAS:AAPL": { points: sampleAaplHistory(), completeness: "complete" },
  "US-XNAS:MSFT": { points: bars([200, 201, 203, 202, 205, 207, 206, 208, 210, 212]), completeness: "complete" },
  "US-XNAS:NVDA": { points: bars([150, 158, 153, 143, 147, 160, 168, 164, 172, 178]), completeness: "complete" },
  "IE-XETR:VWCE": { points: bars([120, 120.5, 119.8, 118.5, 119.4, 121, 122.2, 121.8, 123, 124]), completeness: "complete" },
  "CZ-XPRA:CZGB35": { points: bars([100.2, 100.25, null, 100.3, 100.35, 100.4, 100.38, 100.45, 100.5, 100.6]), completeness: "partial" },
  "CASH:CZK": { points: bars([1, 1, 1, 1, 1, 1, 1, 1, 1, 1], false), completeness: "complete" },
  "US-XCBO:SPX": { points: bars([5_000, 5_040, 4_980, 4_890, 4_950, 5_020, 5_090, 5_060, 5_110, 5_140], false), completeness: "complete" },
};

export const deterministicFxRates: Readonly<Record<string, number>> = {
  "USD:CZK": 22.75,
  "EUR:CZK": 24.9,
};

export const deterministicCorporateActions: readonly CorporateAction[] = [
  {
    actionId: "sample-aapl-dividend-2026-01",
    instrumentId: "US-XNAS:AAPL",
    type: "dividend",
    exDate: "2026-01-09",
    payDate: "2026-01-15",
    amount: 0.25,
    currency: "USD" satisfies Currency,
  },
];
