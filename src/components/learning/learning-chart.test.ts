import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LearningChart } from "./learning-chart";

const props = { title: "Investment value", description: "Representative observations." };

describe("LearningChart fallbacks", () => {
  it("renders a labeled empty state without a chart", () => {
    const html = renderToStaticMarkup(createElement(LearningChart, { ...props, data: [] }));
    expect(html).toContain("Investment value");
    expect(html).toContain("No data to display yet.");
    expect(html).not.toContain("recharts-wrapper");
  });

  it.each([NaN, Infinity, -Infinity])("rejects non-finite values (%s)", (value) => {
    const html = renderToStaticMarkup(createElement(LearningChart, { ...props, data: [{ label: "Start", value }] }));
    expect(html).toContain('role="status"');
    expect(html).toContain("This chart needs finite numeric values.");
    expect(html).not.toContain("recharts-wrapper");
  });

  it("server-renders a semantic data table without requiring chart JavaScript", () => {
    const html = renderToStaticMarkup(createElement(LearningChart, {
      ...props, data: [{ label: "Start", value: 10000 }, { label: "End", value: 9600 }],
    }));
    expect(html).toContain("View data table");
    expect(html).toContain("Investment value data");
    expect(html).toContain('scope="row"');
    expect(html).toContain("9600");
  });
});
