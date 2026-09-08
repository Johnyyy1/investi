import { describe, expect, it, vi } from "vitest";
import { useReducedMotion } from "motion/react";
import { learningMotion, useLearningDuration } from "./motion";

vi.mock("motion/react", () => ({ useReducedMotion: vi.fn() }));

describe("learning motion preferences", () => {
  it.each(["fast", "normal", "reward"] as const)("removes %s motion when requested", (speed) => {
    vi.mocked(useReducedMotion).mockReturnValue(true);
    expect(useLearningDuration(speed)).toBe(0);
  });

  it.each(["fast", "normal", "reward"] as const)("uses the shared %s duration otherwise", (speed) => {
    vi.mocked(useReducedMotion).mockReturnValue(false);
    expect(useLearningDuration(speed)).toBe(learningMotion[speed]);
  });
});
