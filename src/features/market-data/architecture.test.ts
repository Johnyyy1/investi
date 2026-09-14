import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";

const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));
const sourceRoot = path.join(repositoryRoot, "src");

async function sourceFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const location = path.join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(location) : [location];
  }));
  return nested.flat().filter((file) => /\.(ts|tsx)$/.test(file));
}

describe("market-data architecture boundary", () => {
  it("marks every provider, service, cache and deterministic fixture module as server-only", async () => {
    const serverModules = [
      "provider.ts",
      "cache.ts",
      "service.ts",
      "deterministic/fixtures.ts",
      "deterministic/provider.ts",
      "deterministic/service.ts",
    ];
    for (const modulePath of serverModules) {
      const source = await readFile(path.join(sourceRoot, "features/market-data", modulePath), "utf8");
      expect(source, modulePath).toMatch(/^import "server-only";/);
    }
  });

  it("keeps provider implementations out of every client component graph", async () => {
    const files = await sourceFiles(sourceRoot);
    for (const file of files) {
      const source = await readFile(file, "utf8");
      if (!/^"use client";/.test(source)) continue;
      expect(source, path.relative(repositoryRoot, file)).not.toMatch(/features\/market-data\/(?:cache|service|provider|deterministic)/);
    }
  });

  it("does not install a vendor market-data SDK", async () => {
    const manifest = JSON.parse(await readFile(path.join(repositoryRoot, "package.json"), "utf8")) as { dependencies: Record<string, string> };
    const packageNames = Object.keys(manifest.dependencies).join(" ").toLocaleLowerCase("en-US");
    expect(packageNames).not.toMatch(/yahoo|twelve.?data|alpha.?vantage|polygon|finnhub/);
  });
});
