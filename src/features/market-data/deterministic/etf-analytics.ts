import "server-only";

import type { Instrument } from "../contracts";
import { MarketDataError } from "../errors";
import type { EtfAllocation, EtfAnalyticsProvider, EtfDataset, EtfHolding, EtfHoldings, EtfInfo } from "../etf-analytics";
import { DETERMINISTIC_PROVIDER_ID, FIXTURE_RETRIEVED_AT } from "./fixtures";

const fundId = "IE-XETR:VWCE";
const info: EtfInfo = { expenseRatio: 0.0022, assetsUnderManagement: 14_800_000_000, assetsCurrency: "EUR", nav: 123.68, navCurrency: "EUR", inceptionDate: "2019-07-23", holdingsCount: 3_600 };
const holdings: readonly EtfHolding[] = [
  ["SALA", "Sample Atlas Devices", .041], ["SMRI", "Sample Meridian Software", .035], ["SNTH", "Sample Northstar Chips", .031],
  ["SGLB", "Sample Global Commerce", .026], ["SHLT", "Sample Health Systems", .021], ["SFNB", "Sample Financial Network", .019],
  ["SENE", "Sample Energy Group", .017], ["SIND", "Sample Industrial Works", .015], ["SFOO", "Sample Food Holdings", .014],
  ["SMED", "Sample Medical Research", .012], ["SINF", "Sample Infrastructure", .010], ["SCON", "Sample Consumer Brands", .009],
].map(([symbol, name, weight]) => ({ symbol: symbol as string, name: name as string, isin: null, weight: weight as number, marketValue: null, shares: null }));
const sectors: readonly EtfAllocation[] = [
  { name: "Technology", weight: .252 }, { name: "Financials", weight: .158 }, { name: "Industrials", weight: .132 },
  { name: "Healthcare", weight: .117 }, { name: "Consumer goods", weight: .104 }, { name: "Communication", weight: .077 },
  { name: "Energy", weight: .064 }, { name: "Materials", weight: .041 }, { name: "Utilities", weight: .032 }, { name: "Real estate", weight: .023 },
];
const countries: readonly EtfAllocation[] = [
  { name: "United States", weight: .581 }, { name: "Japan", weight: .071 }, { name: "United Kingdom", weight: .044 },
  { name: "China", weight: .038 }, { name: "Canada", weight: .031 }, { name: "France", weight: .027 },
  { name: "Germany", weight: .023 }, { name: "Switzerland", weight: .019 }, { name: "India", weight: .018 },
  { name: "Taiwan", weight: .016 },
];

/** Explicit educational sample values. They are not copies of a live ETF composition. */
export class DeterministicEtfAnalyticsProvider implements EtfAnalyticsProvider {
  readonly providerId = DETERMINISTIC_PROVIDER_ID;
  constructor(private readonly clock: () => Date = () => new Date(FIXTURE_RETRIEVED_AT)) {}
  private dataset<T>(instrument: Instrument, value: T): EtfDataset<T> {
    if (instrument.assetType !== "etf" || instrument.instrumentId !== fundId) throw new MarketDataError("ProviderUnavailable", "Sample ETF analytics are unavailable.", { instrumentId: instrument.instrumentId });
    return { instrumentId: instrument.instrumentId, value, asOf: "2026-01-15T12:00:00.000Z", retrievedAt: this.clock().toISOString(), provider: this.providerId, isDeterministic: true, completeness: "complete" };
  }
  async getEtfInfo(instrument: Instrument) { return this.dataset(instrument, info); }
  async getEtfHoldings(instrument: Instrument): Promise<EtfDataset<EtfHoldings>> { return this.dataset(instrument, { rows: holdings, totalCount: null }); }
  async getEtfSectors(instrument: Instrument) { return this.dataset(instrument, sectors); }
  async getEtfCountries(instrument: Instrument) { return this.dataset(instrument, countries); }
}
