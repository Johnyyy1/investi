"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isMarketDataError } from "@/features/market-data/errors";
import { getCurrentUser } from "@/lib/session";
import { PortfolioInputError } from "./decimal";
import { executeTrade, marketData, resetActivePortfolio } from "./repository";
import { loadInstrumentPreview, loadPortfolioView } from "./service";

const instrumentIdSchema = z.string().trim().min(1).max(100);
const quantitySchema = z.string().trim().min(1).max(40);
const idempotencySchema = z.string().uuid();

function messageFor(error: unknown) {
  if (error instanceof PortfolioInputError) return error.message;
  if (isMarketDataError(error)) {
    if (error.code === "FxUnavailable") return "The sample FX rate is unavailable. No trade was placed.";
    if (error.code === "InstrumentNotFound") return "That instrument is not available in the educational dataset.";
    return "The sample quote is unavailable. No trade was placed.";
  }
  return "The portfolio could not be updated. Please try again.";
}

async function authenticatedUser() {
  const current = await getCurrentUser();
  if (!current) throw new PortfolioInputError("PortfolioUnavailable", "Your session has ended. Sign in again to use Portfolio Lab.");
  return current;
}

export async function searchPortfolioInstrumentsAction(query: string) {
  try {
    await authenticatedUser();
    const value = z.string().trim().max(80).parse(query);
    const results = await marketData.searchInstruments(value);
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
    const parsed = z.object({
      instrumentId: instrumentIdSchema,
      quantity: quantitySchema,
      clientIdempotencyKey: idempotencySchema,
    }).parse(input);
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
