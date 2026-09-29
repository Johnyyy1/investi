import { describe, expect, it } from "vitest";
import { diagnosticQuestions, evaluateDiagnostic, FOUNDATIONS_DIAGNOSTIC_V1, readDiagnostic } from "./diagnostic";

import { diagnosticWithCorrectCount } from "./test-fixtures";
describe("Foundations diagnostic V1", () => {
  it.each([0, 1, 2, 3, 4, 5])("evaluates %i correct with per-concept evidence", (count) => {
    const result = evaluateDiagnostic(diagnosticWithCorrectCount(count));
    expect(result.version).toBe(FOUNDATIONS_DIAGNOSTIC_V1);
    expect(result.correctCount).toBe(count);
    expect(result.level).toBe(count < 2 ? "foundations_needed" : count < 4 ? "partial_foundations" : "strong_foundations");
    expect(Object.values(result.evidence).filter(Boolean)).toHaveLength(count);
    expect(Object.keys(result.evidence)).toEqual(diagnosticQuestions.map((question) => question.id));
  });
  it("keeps the specified financial answers", () => {
    expect(diagnosticQuestions.map((question) => question.options.find((option) => option.id === question.correctAnswer)?.label)).toEqual([
      "+10 %", "96 Kč", "40 %", "Ask · 100,20 Kč", "Vysoký počet pozic sám o sobě dobrou diverzifikaci nezaručuje.",
    ]);
  });
  it.each([{ correct: true }, { score: 5 }, { diagnosticLevel: "strong" }, { correctCount: 5 }, { evidence: {} }, { userId: "victim" }, { version: "V2" }])("rejects client authority %j", (patch) => {
    expect(() => evaluateDiagnostic({ ...diagnosticWithCorrectCount(0), ...patch })).toThrow();
  });
  it("rejects missing/invalid answers and nested correctness flags", () => {
    for (const answers of [{}, { ...diagnosticWithCorrectCount(5).answers, bid_ask: "unknown" }, { ...diagnosticWithCorrectCount(5).answers, correct: true }]) {
      expect(() => evaluateDiagnostic({ version: FOUNDATIONS_DIAGNOSTIC_V1, answers })).toThrow();
    }
  });
  it("recomputes derived fields and safely handles unknown stored versions", () => {
    expect(readDiagnostic({ ...evaluateDiagnostic(diagnosticWithCorrectCount(0)), correctCount: 5, level: "strong_foundations" })?.correctCount).toBe(0);
    expect(readDiagnostic({ ...diagnosticWithCorrectCount(5), version: "OLD_VERSION" })).toBeNull();
    expect(readDiagnostic(null)).toBeNull();
  });
});
