export type MetricSignal = "neutral" | "positive" | "caution" | "unavailable" | "not-meaningful";

export type EquityMetricId =
  | "market-cap" | "pe" | "ps" | "pb" | "ev-ebitda" | "p-fcf"
  | "gross-margin" | "operating-margin" | "net-margin" | "roe" | "roic"
  | "debt-equity" | "current-ratio" | "net-debt-ebitda"
  | "revenue" | "net-income" | "fcf" | "eps";

export type MetricPresentation = { signal: MetricSignal; context?: string };

/** Broad teaching references for individual metrics, never an investment rating. */
export function equityMetricSignal(id: EquityMetricId, value: number | null, status?: "not-meaningful", netCashConfirmed = false): MetricPresentation {
  if (status === "not-meaningful") return { signal: "not-meaningful" };
  if (value === null || !Number.isFinite(value)) return { signal: "unavailable" };

  switch (id) {
    case "gross-margin":
      return value < 0 ? { signal: "caution", context: "Negative gross margin means direct costs exceeded revenue." } : { signal: "neutral" };
    case "operating-margin":
    case "roe":
      return marginSignal(value, 0.15, id === "roe" ? "ROE" : "Operating margin");
    case "net-margin":
    case "roic":
      return marginSignal(value, 0.10, id === "roic" ? "ROIC" : "Net margin");
    case "debt-equity":
      if (value < 0) return { signal: "neutral", context: "Negative shareholders' equity makes this ratio difficult to interpret on its own." };
      if (value <= 0.5) return { signal: "positive", context: "Within Investi's broad low-leverage reference range of 0–0.5×." };
      return value > 2 ? { signal: "caution", context: "Above Investi's broad leverage reference range of 2×." } : { signal: "neutral" };
    case "current-ratio":
      if (value < 1) return { signal: "caution", context: "Below 1× means current liabilities exceed current assets." };
      if (value >= 1.5 && value <= 3) return { signal: "positive", context: "Within Investi's broad 1.5–3× liquidity reference range." };
      return { signal: "neutral", ...(value > 3 ? { context: "More liquidity is not automatically better; industry context matters." } : {}) };
    case "net-debt-ebitda":
      if (value < 0) return netCashConfirmed
        ? { signal: "positive", context: "Net cash relative to positive EBITDA is confirmed by the source data." }
        : { signal: "neutral", context: "A negative ratio can reflect net cash or negative EBITDA; check the underlying figures." };
      if (value <= 2) return { signal: "positive", context: "Within Investi's broad 0–2× net-debt reference range." };
      return value > 4 ? { signal: "caution", context: "Above Investi's broad net-debt reference range of 4×." } : { signal: "neutral" };
    case "revenue":
      return value < 0 ? { signal: "caution", context: "Negative reported revenue is unusual; check the source and reporting context." } : { signal: "neutral" };
    case "net-income":
    case "fcf":
    case "eps":
      return value < 0 ? { signal: "caution", context: "A negative reported figure indicates a loss or cash outflow for this fiscal year." } : { signal: "neutral" };
    default:
      return { signal: "neutral" };
  }
}

function marginSignal(value: number, positiveAt: number, label: string): MetricPresentation {
  if (value < 0) return { signal: "caution", context: `Negative ${label} means a loss on this measure.` };
  return value >= positiveAt
    ? { signal: "positive", context: `Above Investi's broad ${Math.round(positiveAt * 100)}% educational reference.` }
    : { signal: "neutral" };
}
