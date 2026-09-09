import { describe, expect, it } from "vitest";
import { getModuleBySlug, moduleCatalog } from "./catalog";

describe("module catalog", () => {
  it("exposes Investing Foundations as the first available module", () => {
    expect(moduleCatalog[0]).toMatchObject({ slug: "investing-foundations", status: "available" });
  });

  it("returns undefined for an unknown module", () => {
    expect(getModuleBySlug("unknown-module")).toBeUndefined();
  });
});
