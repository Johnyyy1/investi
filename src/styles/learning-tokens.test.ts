import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const tokens = readFileSync("src/styles/learning-tokens.css", "utf8");
const declarations = Object.fromEntries(
  [...tokens.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((match) => [match[1], match[2].trim()]),
);

function resolve(name: string, seen = new Set<string>()): string {
  if (seen.has(name)) throw new Error(`Circular token reference: ${name}`);
  seen.add(name);
  const value = declarations[name];
  if (!value) throw new Error(`Missing token: ${name}`);
  const reference = value.match(/^var\(--([\w-]+)\)$/)?.[1];
  return reference ? resolve(reference, seen) : value;
}

function color(name: string) {
  const value = resolve(`color-${name}`);
  if (!/^#[0-9a-f]{6}$/i.test(value)) throw new Error(`${name} does not resolve to a hex color`);
  return value;
}

function luminance(hex: string) {
  const [r, g, b] = hex.slice(1).match(/../g)!.map((part) => parseInt(part, 16) / 255).map((v) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return r * 0.2126 + g * 0.7152 + b * 0.0722;
}

function contrast(a: string, b: string) {
  const values = [luminance(color(a)), luminance(color(b))].sort((x, y) => y - x);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

describe("Investi product tokens", () => {
  it("preserves the approved brand palette exactly", () => {
    expect(Object.fromEntries([
      "warm-white", "blue", "deep-blue", "navy", "pale-blue", "green", "warm-accent", "data-dark",
    ].map((name) => [name, color(`investi-${name}`)]))).toEqual({
      "warm-white": "#f8f6f0",
      blue: "#2498f3",
      "deep-blue": "#1667b2",
      navy: "#17324a",
      "pale-blue": "#dff2ff",
      green: "#42c98a",
      "warm-accent": "#ffb85c",
      "data-dark": "#102d4c",
    });
  });

  it.each(["background", "surface", "surface-muted", "primary-soft"])("keeps product copy readable on %s", (surface) => {
    for (const text of ["foreground", "secondary", "primary-hover"]) expect(contrast(text, surface)).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps action labels readable", () => {
    expect(contrast("primary-foreground", "primary")).toBeGreaterThanOrEqual(4.5);
    expect(contrast("data-dark", "success")).toBeGreaterThanOrEqual(4.5);
    expect(contrast("danger-foreground", "danger")).toBeGreaterThanOrEqual(4.5);
  });

  it.each(["success", "warning", "danger"])("uses accessible %s feedback ink", (semantic) => {
    expect(contrast(`${semantic}-ink`, `${semantic}-soft`)).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps progress indicators distinguishable from their tracks", () => {
    expect(contrast("primary-hover", "primary-soft")).toBeGreaterThanOrEqual(3);
  });

  it("keeps existing ql utilities mapped to semantic roles", () => {
    expect(resolve("color-ql-page")).toBe(resolve("color-background"));
    expect(resolve("color-ql-link")).toBe(resolve("color-primary-hover"));
    expect(resolve("radius-ql-lg")).toBe(resolve("radius-surface"));
    expect(resolve("shadow-ql-md")).toBe(resolve("shadow-elevation-2"));
  });

  it("defines the radius and motion hierarchy", () => {
    expect(["radius-control", "radius-button", "radius-surface", "radius-panel"].map((name) => resolve(name))).toEqual(["12px", "16px", "24px", "30px"]);
    expect(["motion-micro", "motion-surface", "motion-entry"].map((name) => resolve(name))).toEqual(["180ms", "270ms", "400ms"]);
  });
});
