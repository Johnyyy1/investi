import { z } from "zod";

export const FOUNDATIONS_DIAGNOSTIC_V1 = "FOUNDATIONS_DIAGNOSTIC_V1" as const;
/** Stable question/option identifiers. Keep V1 interpretable when a future version is added. */
export const diagnosticQuestions = [
  { id: "simple_return", prompt: "Cena vzrostla ze 100 Kč na 110 Kč. Jaký je výnos?", options: [{ id: "ten", label: "+10 %" }, { id: "one", label: "+1 %" }, { id: "hundred_ten", label: "+110 %" }], correctAnswer: "ten" },
  { id: "compounding", prompt: "Začínáš se 100 Kč. Hodnota nejprve vzroste o 20 % a potom klesne o 20 %. Kolik zbude?", options: [{ id: "hundred", label: "100 Kč" }, { id: "ninety_six", label: "96 Kč" }, { id: "eighty", label: "80 Kč" }], correctAnswer: "ninety_six" },
  { id: "portfolio_weight", prompt: "Portfolio má hodnotu 5 000 Kč. ETF v něm tvoří 2 000 Kč. Jaká je váha ETF?", options: [{ id: "twenty", label: "20 %" }, { id: "forty", label: "40 %" }, { id: "sixty", label: "60 %" }], correctAnswer: "forty" },
  { id: "bid_ask", prompt: "Nákupní nabídka (bid) je 99,80 Kč a prodejní nabídka (ask) 100,20 Kč. Chceš ihned koupit. Která cena je relevantní?", options: [{ id: "bid", label: "Bid · 99,80 Kč" }, { id: "mid", label: "Průměr · 100 Kč" }, { id: "ask", label: "Ask · 100,20 Kč" }], correctAnswer: "ask" },
  { id: "diversification", prompt: "Které tvrzení o diverzifikaci je správné?", options: [{ id: "count", label: "Vysoký počet pozic sám o sobě dobrou diverzifikaci nezaručuje." }, { id: "same_sector", label: "Mnoho akcií z jednoho odvětví vždy stačí k dobré diverzifikaci." }, { id: "no_risk", label: "Diverzifikované portfolio nemůže ztratit hodnotu." }], correctAnswer: "count" },
] as const;

export const diagnosticAnswersSchema = z.object({
  simple_return: z.enum(["ten", "one", "hundred_ten"]),
  compounding: z.enum(["hundred", "ninety_six", "eighty"]),
  portfolio_weight: z.enum(["twenty", "forty", "sixty"]),
  bid_ask: z.enum(["bid", "mid", "ask"]),
  diversification: z.enum(["count", "same_sector", "no_risk"]),
}).strict();
export const diagnosticSubmissionSchema = z.object({
  version: z.literal(FOUNDATIONS_DIAGNOSTIC_V1),
  answers: diagnosticAnswersSchema,
}).strict();
export type DiagnosticSubmission = z.infer<typeof diagnosticSubmissionSchema>;
export type DiagnosticLevel = "foundations_needed" | "partial_foundations" | "strong_foundations";
export type DiagnosticResult = DiagnosticSubmission & {
  evidence: Record<keyof DiagnosticSubmission["answers"], boolean>;
  correctCount: number;
  level: DiagnosticLevel;
};

/** Called again in the server repository. Never accepts a client score or correctness flag. */
export function evaluateDiagnostic(input: unknown): DiagnosticResult {
  const submission = diagnosticSubmissionSchema.parse(input);
  const evidence = Object.fromEntries(diagnosticQuestions.map((question) => [question.id, submission.answers[question.id] === question.correctAnswer])) as DiagnosticResult["evidence"];
  const correctCount = Object.values(evidence).filter(Boolean).length;
  return { ...submission, evidence, correctCount, level: correctCount <= 1 ? "foundations_needed" : correctCount <= 3 ? "partial_foundations" : "strong_foundations" };
}

/** Stored derived fields are a convenience, not authority; recompute from versioned answers. */
export function readDiagnostic(input: unknown): DiagnosticResult | null {
  if (!input || typeof input !== "object") return null;
  const value = input as Partial<DiagnosticResult>;
  const parsed = diagnosticSubmissionSchema.safeParse({ version: value.version, answers: value.answers });
  return parsed.success ? evaluateDiagnostic(parsed.data) : null;
}
