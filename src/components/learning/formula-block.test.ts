import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FormulaBlock } from "./formula-block";

describe("FormulaBlock", () => {
  it("provides real mathematical markup and variable descriptions", () => {
    const html = renderToStaticMarkup(createElement(FormulaBlock, {
      formula: String.raw`R_t=\frac{P_t-P_{t-1}}{P_{t-1}}`,
      variables: [{ symbol: "Rₜ", meaning: "Period return" }],
    }));
    expect(html).toContain("<math");
    expect(html).toContain("<mfrac>");
    expect(html).toContain("Period return");
  });
  it("renders a safe fallback for invalid authored math", () => {
    const html = renderToStaticMarkup(createElement(FormulaBlock, { formula: "\\invalidcommand{<script>}" }));
    expect(html).toContain("This formula could not be displayed");
    expect(html).not.toContain("<script>");
  });
});

