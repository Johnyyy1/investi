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
    if (error.code === "FxUnavailable") return "The required CZK exchange rate is unavailable. No trade was placed.";
    if (error.code === "InstrumentNotFound" || error.code === "UnsupportedInstrument") return "That instrument is not available from the configured market-data source.";
    if (error.code === "RateLimited") return "Market data is temporarily rate limited. Please try again shortly.";
    if (error.code === "ProviderAuthentication" || error.code === "ProviderConfiguration") return "Market data is not configured correctly. No trade was placed.";
    if (error.code === "InvalidSearchQuery") return "Enter at least two valid characters to search.";
    return "The current market observation is unavailable. No trade was placed.";
  }
  return "The portfolio could not be updated. Please try again.";
}

async function authenticatedUser() {
  const current = await getCurrentUser();
  if (!current) throw new PortfolioInputError("PortfolioUnavailable", "Your session has ended. Sign in again to use Portfolio Lab.");
  try { await requirePortfolioLabUnlock(current.id); }
  catch { throw new PortfolioInputError("PortfolioUnavailable", "Portfolio Lab is locked. Complete Investing Foundations to unlock it."); }
  return current;
}

export async function searchPortfolioInstrumentsAction(query: string) {
  try {
    await authenticatedUser();
    const parsed = z.string().trim().min(2).max(80).safeParse(query);
    if (!parsed.success) return { ok: false as const, message: "Enter at least two valid characters to search.", results: [] };
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
    if (!preview) return { ok: false as const, message: "This instrument cannot be traded in the educational portfolio." };
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
