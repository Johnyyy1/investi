"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isMarketDataError } from "@/features/market-data/errors";
import { getCurrentUser } from "@/lib/session";
import { requirePortfolioLabUnlock } from "@/features/progression/repository";
import { PortfolioInputError } from "./decimal";
import { portfolioMarketData } from "./environment";
import { idempotencySchema, instrumentIdSchema, tradeInputSchema } from "./input";
import { executeTrade, resetActivePortfolio } from "./repository";
import { loadInstrumentPreview, loadPortfolioView } from "./service";

function messageFor(error: unknown) {
  if (error instanceof PortfolioInputError) return error.message;
  if (isMarketDataError(error)) {
    if (error.code === "FxUnavailable") return "Potřebný kurz CZK není dostupný. Obchod nebyl proveden.";
    if (error.code === "InstrumentNotFound" || error.code === "UnsupportedInstrument") return "Tento instrument není z nastaveného zdroje tržních dat dostupný.";
    if (error.code === "RateLimited") return "Tržní data jsou dočasně omezená. Zkus to za chvíli znovu.";
    if (error.code === "ProviderAuthentication" || error.code === "ProviderConfiguration") return "Tržní data nejsou správně nastavená. Obchod nebyl proveden.";
    if (error.code === "InvalidSearchQuery") return "Zadej pro hledání alespoň dva platné znaky.";
    return "Aktuální tržní pozorování není dostupné. Obchod nebyl proveden.";
  }
  return "Portfolio se nepodařilo aktualizovat. Zkus to znovu.";
}

async function authenticatedUser() {
  const current = await getCurrentUser();
  if (!current) throw new PortfolioInputError("PortfolioUnavailable", "Relace skončila. Přihlas se znovu, abys mohl(a) používat Portfolio Lab.");
  try { await requirePortfolioLabUnlock(current.id); }
  catch { throw new PortfolioInputError("PortfolioUnavailable", "Portfolio Lab je zamčený. Dokonči Základy investování a odemkni ho."); }
  return current;
}

export async function searchPortfolioInstrumentsAction(query: string) {
  try {
    await authenticatedUser();
    const parsed = z.string().trim().min(2).max(80).safeParse(query);
    if (!parsed.success) return { ok: false as const, message: "Zadej pro hledání alespoň dva platné znaky.", results: [] };
    const value = parsed.data;
    const results = await portfolioMarketData.service.searchInstruments(value);
    return { ok: true as const, results: results.filter(({ assetType }) => assetType !== "cash" && assetType !== "index") };
  } catch (error) {
    return { ok: false as const, message: messageFor(error), results: [] };
  }
}

export async function loadInstrumentPreviewAction(instrumentId: string) {
  try {
    await authenticatedUser();
    const preview = await loadInstrumentPreview(instrumentIdSchema.parse(instrumentId));
    if (!preview) return { ok: false as const, message: "S tímto instrumentem nelze ve vzdělávacím portfoliu obchodovat." };
    return { ok: true as const, preview };
  } catch (error) {
    return { ok: false as const, message: messageFor(error) };
  }
}

async function tradeAction(input: unknown, side: "BUY" | "SELL") {
  try {
    const current = await authenticatedUser();
    const parsed = tradeInputSchema.parse(input);
    const result = await executeTrade(current.id, { ...parsed, side });
    const portfolio = await loadPortfolioView(current.id);
    revalidatePath("/lab/portfolio");
    return { ok: true as const, duplicate: result.duplicate, portfolio };
  } catch (error) {
    return { ok: false as const, message: messageFor(error) };
  }
}

export async function buyPortfolioAction(input: unknown) {
  return tradeAction(input, "BUY");
}

export async function sellPortfolioAction(input: unknown) {
  return tradeAction(input, "SELL");
}

export async function resetPortfolioAction(input: unknown) {
  try {
    const current = await authenticatedUser();
    const parsed = z.object({ clientIdempotencyKey: idempotencySchema }).parse(input);
    const result = await resetActivePortfolio(current.id, parsed.clientIdempotencyKey);
    const portfolio = await loadPortfolioView(current.id);
    revalidatePath("/lab/portfolio");
    return { ok: true as const, duplicate: result.duplicate, portfolio };
  } catch (error) {
    return { ok: false as const, message: messageFor(error) };
  }
}
