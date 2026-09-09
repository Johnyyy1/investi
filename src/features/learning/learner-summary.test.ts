import { describe, expect, it } from "vitest";
import { getLearnerSummary, type LearnerState } from "./learner-summary";
import { returnsLessons } from "../lessons/returns/manifest";
const row = (index: number, status: LearnerState["status"], day = 1): LearnerState => ({ lessonId: returnsLessons[index].id, status, lastPosition: 3, updatedAt: new Date(2026, 8, day), completedAt: status === "completed" ? new Date(2026, 8, day) : null });
describe("real learner summary", () => {
  it("starts with the first available lesson and no rewards", () => {
    const summary = getLearnerSummary([]);
    expect(summary.next.id).toBe(returnsLessons[0].id);
    expect(summary.percentage).toBe(0);
    expect(summary.recent).toEqual([]);
  });
  it("resumes the most recently active lesson even when earlier lessons are untouched", () => {
    const summary = getLearnerSummary([row(1, "in_progress", 1), row(2, "in_progress", 2)]);
    expect(summary.next.id).toBe(returnsLessons[2].id);
    expect(summary.position).toBe(3);
  });
  it("advances to the next unfinished lesson after completion", () => {
    const summary = getLearnerSummary([row(0, "completed")]);
    expect(summary.next.id).toBe(returnsLessons[1].id);
    expect(summary.percentage).toBe(33);
  });
  it("counts only available lessons and offers review after all available learning", () => {
    const summary = getLearnerSummary([row(0, "completed", 1), row(1, "completed", 3), row(2, "completed", 2), row(3, "completed", 4)]);
    expect(summary.percentage).toBe(100);
    expect(summary.allComplete).toBe(true);
    expect(summary.completed).toHaveLength(3);
    expect(summary.recent[0].lessonId).toBe(returnsLessons[1].id);
  });
});
