import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const tokens = readFileSync("src/styles/learning-tokens.css", "utf8");
const colors = Object.fromEntries([...tokens.matchAll(/--color-ql-([\w-]+):\s*(#[0-9a-f]{6});/gi)].map((match) => [match[1], match[2]]));
function luminance(hex: string) {
  const [r, g, b] = hex.slice(1).match(/../g)!.map((part) => parseInt(part, 16) / 255).map((v) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return r * 0.2126 + g * 0.7152 + b * 0.0722;
}
function contrast(a: string, b: string) {
  const values = [luminance(colors[a]), luminance(colors[b])].sort((x, y) => y - x);
  return (values[0] + 0.05) / (values[1] + 0.05);
}
describe("learning token accessibility", () => {
  it.each(["page", "surface", "subtle"])("keeps body and secondary copy readable on %s", (surface) => {
    for (const text of ["text", "secondary", "link"]) expect(contrast(text, surface)).toBeGreaterThanOrEqual(4.5);
  });
  it.each(["blue-500", "blue-400", "success", "danger"])("keeps button text readable on %s", (surface) => {
    expect(contrast("text", surface)).toBeGreaterThanOrEqual(4.5);
  });
  it.each(["success", "warning", "danger"])("uses accessible %s ink", (semantic) => {
    expect(contrast(`${semantic}-ink`, `${semantic}-bg`)).toBeGreaterThanOrEqual(4.5);
  });
  it("keeps size token names distinct from color utilities", () => {
    const sizes = [...tokens.matchAll(/--text-ql-([\w-]+):/g)].map((match) => match[1]);
    expect(sizes.filter((name) => name in colors)).toEqual([]);
  });
  it("keeps progress indicators distinguishable from their tracks", () => {
    expect(contrast("blue-700", "blue-100")).toBeGreaterThanOrEqual(3);
  });
});
