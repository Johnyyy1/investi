import { describe, expect, it } from "vitest";
import { formatPracticeCapitalMinor, serializePracticeCapitalMinor } from "./presentation";

describe("Practice Capital presentation", () => {
  it.each([
    [BigInt(200_000), "2,000 Kč"],
    [BigInt(1_200_000), "12,000 Kč"],
    [BigInt(200_001), "2,000.01 Kč"],
  ])("formats exact minor units %s", (minor, expected) => {
    expect(formatPracticeCapitalMinor(minor)).toBe(expected);
  });

  it("preserves values beyond Number's safe integer range across the client boundary", () => {
    const exact = BigInt("900719925474099312345");
    const serialized = serializePracticeCapitalMinor(exact);

    expect(serialized).toBe("900719925474099312345");
    expect(formatPracticeCapitalMinor(serialized)).toBe("9,007,199,254,740,993,123.45 Kč");
  });
});
