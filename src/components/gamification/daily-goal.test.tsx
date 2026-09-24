import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DailyGoal } from "./daily-goal";

describe("DailyGoal", () => {
  it("shows the unfinished target as a fraction", () => {
    const html = renderToStaticMarkup(createElement(DailyGoal, { completed: 0, target: 1 }));
    expect(html).toContain("0 / 1 lekce");
    expect(html).not.toContain("Splněn");
  });

  it("marks an exact target completion without an overlong fraction", () => {
    const html = renderToStaticMarkup(createElement(DailyGoal, { completed: 1, target: 1 }));
    expect(html).toContain("Splněn");
    expect(html).toContain("1 lekce dnes · denní cíl splněn");
    expect(html).not.toContain("1 / 1");
  });

  it("keeps the completed lesson count after exceeding the target", () => {
    const html = renderToStaticMarkup(createElement(DailyGoal, { completed: 7, target: 1 }));
    expect(html).toContain("Splněn");
    expect(html).toContain("7 lekcí dnes · denní cíl splněn");
    expect(html).not.toContain("7 / 1");
  });
});
