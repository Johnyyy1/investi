import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ user: vi.fn(), complete: vi.fn(), start: vi.fn(), save: vi.fn(), count: vi.fn(), revalidate: vi.fn() }));
vi.mock("@/lib/session", () => ({ getCurrentUser: mocks.user }));
vi.mock("./repository", () => ({ completeLesson: mocks.complete, markLessonInProgress: mocks.start, saveLessonProgress: mocks.save, getModuleProgress: mocks.count }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
import { completeLessonAction, markLessonStartedAction, saveLessonPositionAction } from "./actions";
describe("shared persisted lesson actions", () => {
  beforeEach(() => { vi.resetAllMocks(); mocks.user.mockResolvedValue({ id: "session-owner" }); mocks.count.mockResolvedValue(2); });
  it.each([["foundations-stocks", "module-investing-foundations"], ["foundations-bonds-cash", "module-investing-foundations"], ["returns-compounding", "module-returns"]])("counts the correct module for %s", async (id, moduleId) => {
    expect(await completeLessonAction(id)).toEqual({ ok: true, completedLessons: 2 });
    expect(mocks.complete).toHaveBeenCalledWith("session-owner", id);
    expect(mocks.count).toHaveBeenCalledWith("session-owner", moduleId);
    expect(mocks.revalidate).toHaveBeenCalledWith("/learn", "layout");
  });
  it.each(["foundations-markets", "returns-log-returns", "unknown"])("rejects writes to %s", async (id) => {
    expect(await markLessonStartedAction(id)).toMatchObject({ ok: false });
    expect(await saveLessonPositionAction(id, 1)).toMatchObject({ ok: false });
    expect(await completeLessonAction(id)).toMatchObject({ ok: false });
    expect(mocks.start).not.toHaveBeenCalled(); expect(mocks.save).not.toHaveBeenCalled(); expect(mocks.complete).not.toHaveBeenCalled();
  });
  it("bounds the Foundations cursor on the server and saves only to the session owner", async () => {
    for (const position of [-1, 9, 1.5, Infinity]) expect(await saveLessonPositionAction("foundations-why-invest", position)).toMatchObject({ ok: false });
    expect(mocks.save).not.toHaveBeenCalled();
    expect(await saveLessonPositionAction("foundations-why-invest", 8)).toEqual({ ok: true });
    expect(mocks.save).toHaveBeenCalledWith("session-owner", { lessonId: "foundations-why-invest", lastPosition: 8, status: "in_progress" });
  });
  it("rejects anonymous writes", async () => {
    mocks.user.mockResolvedValue(null);
    expect(await completeLessonAction("foundations-stocks")).toMatchObject({ ok: false });
    expect(await markLessonStartedAction("foundations-stocks")).toMatchObject({ ok: false });
    expect(await saveLessonPositionAction("foundations-stocks", 1)).toMatchObject({ ok: false });
    expect(mocks.complete).not.toHaveBeenCalled(); expect(mocks.start).not.toHaveBeenCalled(); expect(mocks.save).not.toHaveBeenCalled();
  });
  it("reports persistence failure without returning successful completion", async () => {
    mocks.complete.mockRejectedValueOnce(new Error("offline"));
    expect(await completeLessonAction("foundations-stocks")).toMatchObject({ ok: false });
    expect(mocks.count).not.toHaveBeenCalled(); expect(mocks.revalidate).not.toHaveBeenCalled();
  });
});
