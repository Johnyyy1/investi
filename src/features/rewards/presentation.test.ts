import { describe, expect, it } from "vitest";
import { formatPracticeCapitalMinor, serializePracticeCapitalMinor } from "./presentation";

describe("Practice Capital presentation", () => {
  it.each([
    [BigInt(200_000), "2\u00a0000\u00a0Kč"],
    [BigInt(1_200_000), "12\u00a0000\u00a0Kč"],
    [BigInt(200_001), "2\u00a0000,01\u00a0Kč"],
  ])("formats exact minor units %s", (minor, expected) => {
    expect(formatPracticeCapitalMinor(minor)).toBe(expected);
  });

  it("preserves values beyond Number's safe integer range across the client boundary", () => {
    const exact = BigInt("900719925474099312345");
    const serialized = serializePracticeCapitalMinor(exact);

    expect(serialized).toBe("900719925474099312345");
    expect(formatPracticeCapitalMinor(serialized)).toBe("9\u00a0007\u00a0199\u00a0254\u00a0740\u00a0993\u00a0123,45\u00a0Kč");
  });
});
