import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  user: vi.fn(), requireUnlock: vi.fn(), search: vi.fn(), execute: vi.fn(), reset: vi.fn(),
  preview: vi.fn(), view: vi.fn(), revalidate: vi.fn(),
}));
vi.mock("@/lib/session", () => ({ getCurrentUser: mocks.user }));
vi.mock("@/features/progression/repository", () => ({ requirePortfolioLabUnlock: mocks.requireUnlock }));
vi.mock("./environment", () => ({ portfolioMarketData: { service: { searchInstruments: mocks.search } } }));
vi.mock("./repository", () => ({ executeTrade: mocks.execute, resetActivePortfolio: mocks.reset }));
vi.mock("./service", () => ({ loadInstrumentPreview: mocks.preview, loadPortfolioView: mocks.view }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));

import { buyPortfolioAction, loadInstrumentPreviewAction, resetPortfolioAction, searchPortfolioInstrumentsAction, sellPortfolioAction } from "./actions";

describe("Portfolio Lab server authorization", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.user.mockResolvedValue({ id: "locked-user" });
    mocks.requireUnlock.mockRejectedValue(new Error("locked"));
  });

  it("blocks every portfolio entry point before parsing or domain work", async () => {
    const input = { instrumentId: "US-XNAS:AAPL", quantity: "1", clientIdempotencyKey: crypto.randomUUID() };
    const results = await Promise.all([
      searchPortfolioInstrumentsAction("Apple"),
      loadInstrumentPreviewAction("US-XNAS:AAPL"),
      buyPortfolioAction(input),
      sellPortfolioAction(input),
      resetPortfolioAction({ clientIdempotencyKey: crypto.randomUUID() }),
    ]);
    for (const result of results) expect(result).toMatchObject({ ok: false, message: "Portfolio Lab is locked. Complete Investing Foundations to unlock it." });
    expect(mocks.requireUnlock).toHaveBeenCalledTimes(5);
    expect(mocks.search).not.toHaveBeenCalled();
    expect(mocks.preview).not.toHaveBeenCalled();
    expect(mocks.execute).not.toHaveBeenCalled();
    expect(mocks.reset).not.toHaveBeenCalled();
    expect(mocks.view).not.toHaveBeenCalled();
  });
});
