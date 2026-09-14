/**
 * Canonical decimal transport for exact minor-unit values crossing into a
 * Client Component or returning from a Server Action.
 */
export type SerializedPracticeCapitalMinor = `${bigint}`;

export function serializePracticeCapitalMinor(value: bigint): SerializedPracticeCapitalMinor {
  return value.toString() as SerializedPracticeCapitalMinor;
}

/** Formats exact CZK minor units without passing accounting values through Number. */
export function formatPracticeCapitalMinor(value: bigint | string) {
  const minorUnits = typeof value === "bigint" ? value : BigInt(value);
  const negative = minorUnits < BigInt(0);
  const absolute = negative ? -minorUnits : minorUnits;
  const wholeKoruna = absolute / BigInt(100);
  const halere = absolute % BigInt(100);
  const grouped = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(wholeKoruna);
  const fraction = halere === BigInt(0) ? "" : `.${halere.toString().padStart(2, "0")}`;

  return `${negative ? "−" : ""}${grouped}${fraction} Kč`;
}
