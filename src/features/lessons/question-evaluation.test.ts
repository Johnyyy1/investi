import { describe, expect, it } from "vitest";
import { compoundingAndCumulativeReturnsLesson } from "./returns/compounding-and-cumulative-returns";
import { evaluateQuestion, isQuestion, parseNumericAnswer } from "./question-evaluation";

const questions = compoundingAndCumulativeReturnsLesson.blocks.filter(isQuestion);
describe("guided question evaluation", () => {
  it.each(questions)("requires an answer for $id", (question) => {
    expect(evaluateQuestion(question, {})).toBeUndefined();
  });
  it("accepts decimal commas and dots while rejecting incomplete or malformed answers", () => {
    for (const value of ["0,025", "0.025"]) expect(parseNumericAnswer(value)).toBe(0.025);
    for (const value of ["", " ", "0,0,25"]) expect(Number.isNaN(parseNumericAnswer(value))).toBe(true);
    const factor = questions.find((question) => question.id === "growth-practice")!;
    expect(evaluateQuestion(factor, { answer: "0,96" })).toBe(true);
    expect(evaluateQuestion(factor, { answer: "-0,04" })).toBe(false);
  });
  it("uses the authored choice and numeric tolerances", () => {
    expect(evaluateQuestion(questions[0], { answer: "b" })).toBe(true);
    expect(evaluateQuestion(questions[0], { answer: "a" })).toBe(false);
    expect(evaluateQuestion(questions.find((question) => question.id === "two-gains")!, { answer: "21.04" })).toBe(true);
    expect(evaluateQuestion(questions.find((question) => question.id === "two-gains")!, { answer: "20" })).toBe(false);
  });
  it("requires all price-series fields and rejects blanks/non-finite input", () => {
    const question = questions.find((question) => question.id === "multi-period")!;
    expect(evaluateQuestion(question, { first: "10", second: "-10", cumulative: "-1" })).toBe(true);
    for (const value of ["", " ", "Infinity", "hello"]) expect(evaluateQuestion(question, { first: "10", second: "-10", cumulative: value })).toBeUndefined();
    expect(evaluateQuestion(question, { first: "10", second: "-10", cumulative: "0" })).toBe(false);
  });
});
