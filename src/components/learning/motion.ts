"use client";
import { useReducedMotion } from "motion/react";

/** Seconds for Motion. Matching CSS durations live in learning-tokens.css. */
export const learningMotion = { fast: 0.15, normal: 0.25, reward: 0.5 } as const;
export function useLearningDuration(speed: keyof typeof learningMotion = "normal") {
  return useReducedMotion() ? 0 : learningMotion[speed];
}

