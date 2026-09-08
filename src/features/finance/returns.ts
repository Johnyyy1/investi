export class FinancialInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FinancialInputError";
  }
}

function assertFinite(value: number, label: string) {
  if (!Number.isFinite(value)) {
    throw new FinancialInputError(`${label} must be a finite number.`);
  }
}

function assertStartingPrice(start: number) {
  assertFinite(start, "Starting price");
  if (start <= 0) {
    throw new FinancialInputError("Starting price must be greater than zero.");
  }
}

function assertEndingPrice(end: number) {
  assertFinite(end, "Ending price");
  if (end < 0) {
    throw new FinancialInputError("Ending price cannot be negative.");
  }
}

/** The unrounded change in price units. */
export function absoluteChange(start: number, end: number) {
  assertStartingPrice(start);
  assertEndingPrice(end);
  return end - start;
}

/** The unrounded simple return expressed as a decimal (0.15 represents 15%). */
export function simpleReturn(start: number, end: number) {
  assertStartingPrice(start);
  assertEndingPrice(end);
  return end / start - 1;
}

/** Parses user-entered price strings without treating an empty field as zero. */
export function parsePrice(value: string, label: string) {
  if (value.trim() === "") {
    throw new FinancialInputError(`${label} is required.`);
  }
  const parsed = Number(value);
  assertFinite(parsed, label);
  return parsed;
}
