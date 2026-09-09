import { describe, expect, it } from "vitest";
import { compoundingAndCumulativeReturnsLesson } from "./returns/compounding-and-cumulative-returns";
import { evaluateQuestion, isQuestion } from "./question-evaluation";

const questions = compoundingAndCumulativeReturnsLesson.blocks.filter(isQuestion);
describe("guided question evaluation", () => {
  it.each(questions)("requires an answer for $id", (question) => {
    expect(evaluateQuestion(question, {})).toBeUndefined();
  });
  it("uses the authored choice and numeric tolerances", () => {
    expect(evaluateQuestion(questions[0], { answer: "b" })).toBe(true);
    expect(evaluateQuestion(questions[0], { answer: "a" })).toBe(false);
    expect(evaluateQuestion(questions[1], { answer: "21.04" })).toBe(true);
    expect(evaluateQuestion(questions[1], { answer: "20" })).toBe(false);
  });
  it("requires all price-series fields and rejects blanks/non-finite input", () => {
    const question = questions[2];
    expect(evaluateQuestion(question, { first: "10", second: "-10", cumulative: "-1" })).toBe(true);
    for (const value of ["", " ", "Infinity", "hello"]) expect(evaluateQuestion(question, { first: "10", second: "-10", cumulative: value })).toBeUndefined();
    expect(evaluateQuestion(question, { first: "10", second: "-10", cumulative: "0" })).toBe(false);
  });
});
