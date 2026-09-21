import { parseQuantity, QUANTITY_SCALE, roundDivide } from "./decimal";

export function estimatedMinor(quantity: string, unitMinor: string) {
  try { return roundDivide(parseQuantity(quantity) * BigInt(unitMinor), QUANTITY_SCALE); }
  catch { return null; }
}

export function parseQuantitySafe(value: string) {
  try { return parseQuantity(value); }
  catch { return 0n; }
}
