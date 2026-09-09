import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ user: vi.fn(), complete: vi.fn(), draft: vi.fn(), update: vi.fn(), revalidate: vi.fn() }));
vi.mock("@/lib/session", () => ({ getCurrentUser: mocks.user }));
vi.mock("./repository", () => ({ completeOnboarding: mocks.complete, saveOnboardingDraft: mocks.draft, updatePreferences: mocks.update }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
import { completeOnboardingAction, saveDraftAction, updatePreferencesAction } from "./actions";

describe("authenticated onboarding saves", () => {
  beforeEach(() => { vi.resetAllMocks(); mocks.user.mockResolvedValue({ id: "session-owner" }); });
  it.each([completeOnboardingAction, saveDraftAction, updatePreferencesAction])("rejects anonymous writes", async (action) => {
    mocks.user.mockResolvedValue(null);
    expect(await action({ userId: "victim" })).toMatchObject({ ok: false, signIn: true });
    expect(mocks.complete).not.toHaveBeenCalled(); expect(mocks.draft).not.toHaveBeenCalled(); expect(mocks.update).not.toHaveBeenCalled();
  });
  it.each([[completeOnboardingAction, mocks.complete], [saveDraftAction, mocks.draft], [updatePreferencesAction, mocks.update]] as const)("uses the session owner and recovers from database failure", async (action, operation) => {
    operation.mockRejectedValueOnce(new Error("database connection failed"));
    const payload = { userId: "untrusted" };
    expect(await action(payload)).toMatchObject({ ok: false, message: expect.stringContaining("Please try again") });
    expect(operation).toHaveBeenCalledWith("session-owner", payload);
    expect(mocks.revalidate).not.toHaveBeenCalled();
    operation.mockResolvedValueOnce(undefined);
    expect(await action(payload)).toEqual({ ok: true });
    expect(mocks.revalidate).toHaveBeenCalledWith("/settings");
  });
  it("recovers from session database failure", async () => {
    mocks.user.mockRejectedValue(new Error("offline"));
    expect(await saveDraftAction({})).toMatchObject({ ok: false });
    expect(mocks.draft).not.toHaveBeenCalled();
  });
});
