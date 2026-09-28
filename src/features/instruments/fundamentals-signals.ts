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
      return value < 0 ? { signal: "caution", context: "Záporná hrubá marže znamená, že přímé náklady převýšily tržby." } : { signal: "neutral" };
    case "operating-margin":
    case "roe":
      return marginSignal(value, 0.15, id === "roe" ? "ROE" : "provozní marže");
    case "net-margin":
    case "roic":
      return marginSignal(value, 0.10, id === "roic" ? "ROIC" : "čistá marže");
    case "debt-equity":
      if (value < 0) return { signal: "neutral", context: "Záporný vlastní kapitál akcionářů ztěžuje samostatnou interpretaci tohoto poměru." };
      if (value <= 0.5) return { signal: "positive", context: "V širokém orientačním rozmezí nízkého zadlužení investi 0–0,5×." };
      return value > 2 ? { signal: "caution", context: "Nad širokým orientačním rozmezím zadlužení investi 2×." } : { signal: "neutral" };
    case "current-ratio":
      if (value < 1) return { signal: "caution", context: "Hodnota pod 1× znamená, že krátkodobé závazky převyšují oběžná aktiva." };
      if (value >= 1.5 && value <= 3) return { signal: "positive", context: "V širokém orientačním rozmezí likvidity investi 1,5–3×." };
      return { signal: "neutral", ...(value > 3 ? { context: "Vyšší likvidita není automaticky lepší; záleží na kontextu odvětví." } : {}) };
    case "net-debt-ebitda":
      if (value < 0) return netCashConfirmed
        ? { signal: "positive", context: "Zdrojová data potvrzují čistou hotovost vůči kladné EBITDA." }
        : { signal: "neutral", context: "Záporný poměr může znamenat čistou hotovost nebo zápornou EBITDA; zkontroluj podkladové hodnoty." };
      if (value <= 2) return { signal: "positive", context: "V širokém orientačním rozmezí čistého dluhu investi 0–2×." };
      return value > 4 ? { signal: "caution", context: "Nad širokým orientačním rozmezím čistého dluhu investi 4×." } : { signal: "neutral" };
    case "revenue":
      return value < 0 ? { signal: "caution", context: "Záporné vykázané tržby jsou neobvyklé; zkontroluj zdroj a kontext výkazu." } : { signal: "neutral" };
    case "net-income":
    case "fcf":
    case "eps":
      return value < 0 ? { signal: "caution", context: "Záporná vykázaná hodnota znamená v tomto fiskálním roce ztrátu nebo odtok hotovosti." } : { signal: "neutral" };
    default:
      return { signal: "neutral" };
  }
}

function marginSignal(value: number, positiveAt: number, label: string): MetricPresentation {
  if (value < 0) return { signal: "caution", context: `Záporná hodnota ukazatele ${label} znamená podle tohoto měřítka ztrátu.` };
  return value >= positiveAt
    ? { signal: "positive", context: `Nad širokou vzdělávací referencí investi ${Math.round(positiveAt * 100)} %.` }
    : { signal: "neutral" };
}
