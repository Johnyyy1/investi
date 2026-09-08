import { describe, expect, it } from "vitest";
import { getModuleBySlug, moduleCatalog } from "./catalog";

describe("module catalog", () => {
  it("exposes Returns as the first available module", () => {
    expect(moduleCatalog[0]).toMatchObject({ slug: "returns", status: "available" });
  });

  it("returns undefined for an unknown module", () => {
    expect(getModuleBySlug("unknown-module")).toBeUndefined();
  });
});
