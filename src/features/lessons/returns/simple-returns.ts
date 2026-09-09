import type { AuthoredLesson } from "../types";
import { returnsLessons } from "./manifest";

export const simpleReturnsLesson: AuthoredLesson = {
  id: returnsLessons[1].id,
  moduleSlug: "returns",
  slug: returnsLessons[1].slug,
  title: returnsLessons[1].title,
  eyebrow: "Returns & Compounding",
  position: 2,
  estimatedMinutes: returnsLessons[1].estimatedMinutes,
  sections: [
    { id: "periods", label: "Period by period" },
    { id: "series", label: "Reading a price series" },
    { id: "representation", label: "Decimals and percentages" },
    { id: "practice", label: "Practice" },
  ],
  navigation: { previous: { href: "/learn/returns/what-is-a-return", label: "What is a return?" }, next: { href: "/learn/returns/compounding-and-cumulative-returns", label: "Compounding & cumulative returns" } },
  blocks: [
    { id: "periods", type: "heading", title: "A period return measures one move at a time.", body: "For a daily series, each return compares today’s price with yesterday’s—not with the first price in the series." },
    { id: "period-intro", type: "paragraph", content: "Financial analysis works with returns because they put each price movement on a comparable scale. The denominator changes with every period: it is always the previous price." },
    { id: "period-formula-one", type: "formula", latex: "R_t = \\frac{P_t - P_{t-1}}{P_{t-1}}", expression: "R_t = (P_t − P_(t−1)) / P_(t−1)", variables: [{ symbol: "R_t", description: "return during period t" }, { symbol: "P_t", description: "current price" }, { symbol: "P_(t−1)", description: "previous period’s price" }] },
    { id: "period-formula-two", type: "formula", latex: "R_t = \\frac{P_t}{P_{t-1}} - 1", expression: "R_t = P_t / P_(t−1) − 1", variables: [{ symbol: "R_t", description: "the same period return" }, { symbol: "P_t", description: "current price" }, { symbol: "P_(t−1)", description: "previous period’s price" }] },
    { id: "period-example", type: "workedExample", title: "From Day 0 to Day 1", introduction: "If a price moves from 100 to 105, the first daily return uses 100 as its denominator.", steps: [{ label: "Previous price", value: "100" }, { label: "Current price", value: "105" }, { label: "Daily change", value: "+5" }, { label: "Day 1 return", value: "+5%", emphasis: true }], conclusion: "The next period will start from 105. It does not keep using 100 as the denominator." },
    { id: "series", type: "heading", title: "Read the series as consecutive pairs.", body: "A short price series can contain positive, negative, and zero returns. Inspect each row to see the exact pair behind it." },
    { id: "series-figure", type: "interactiveFigure", figure: "price-series-explorer", title: "Daily return explorer", description: "Select any period in the table. The highlighted interval shows which previous price is used for that return." },
    { id: "first-calculation", type: "numericQuestion", prompt: "Price moves from 80 to 84. What is the simple return?", answer: 5, tolerance: 0.05, unit: "%", correctExplanation: "The change is 4. Divide it by the previous price of 80: 4 ÷ 80 = 0.05, which is 5%.", incorrectExplanation: "Use the previous price as the denominator: (84 − 80) ÷ 80 = 0.05 = 5%." },
    { id: "negative-return", type: "numericQuestion", prompt: "Price moves from 120 to 108. What is the simple return?", answer: -10, tolerance: 0.05, unit: "%", correctExplanation: "The change is −12. Dividing by the previous price gives −12 ÷ 120 = −0.10, or −10%.", incorrectExplanation: "The loss is 12 relative to a starting price of 120: (108 − 120) ÷ 120 = −0.10 = −10%." },
    { id: "representation", type: "heading", title: "Store returns as decimals; display them as percentages.", body: "Quantitative calculations commonly use decimals internally. A display format adds the percent sign for people." },
    { id: "decimal-callout", type: "conceptCallout", title: "Same value, different notation", content: "0.05 means 5%. Likewise, −0.12 means −12%. Multiplying the decimal by 100 converts it to the displayed percentage." },
    { id: "decimal-practice", type: "numericQuestion", prompt: "A return is stored as −0.12. What is that return as a percentage?", answer: -12, tolerance: 0.05, unit: "%", correctExplanation: "Multiply the decimal by 100: −0.12 × 100 = −12%. The sign stays negative.", incorrectExplanation: "Convert a decimal return to a percentage by multiplying by 100. Here, −0.12 becomes −12%." },
    { id: "comparison", type: "multipleChoiceQuestion", prompt: "Asset A moves from 50 to 55. Asset B moves from 200 to 210. Which had the larger return, and why?", options: [{ id: "a", label: "Asset A, because 5 is a larger share of 50 than 10 is of 200." }, { id: "b", label: "Asset B, because it gained more price units." }, { id: "c", label: "They are equal because both prices increased." }], correctOptionId: "a", correctExplanation: "Asset A returned 5 ÷ 50 = 10%. Asset B returned 10 ÷ 200 = 5%. Identical or larger price changes do not imply larger returns.", incorrectExplanation: "Compare each move with its previous price. Asset A gained 10%; Asset B gained 5%. The denominator determines the scale of the return." },
    { id: "practice", type: "heading", title: "Calculate each period separately.", body: "Do not combine the moves yet. Cumulative returns are the next lesson’s subject." },
    { id: "two-periods", type: "multiNumericQuestion", prompt: "A price series moves 100 → 110 → 99. Calculate both period returns.", answers: [{ id: "first", label: "100 → 110", answer: 10, tolerance: 0.05, unit: "%" }, { id: "second", label: "110 → 99", answer: -10, tolerance: 0.05, unit: "%" }], correctExplanation: "First period: (110 − 100) ÷ 100 = 10%. Second period: (99 − 110) ÷ 110 = −10%. Each period uses its own previous price.", incorrectExplanation: "Treat this as two separate comparisons. For the second return, the denominator is 110—not the original 100." },
    { id: "raw-differences", type: "explanation", title: "Why not use raw price differences?", content: "Price differences ignore scale. A gain of 10 has a different meaning after 100 than after 200. Period returns preserve that context and make series comparable." },
    { id: "takeaway", type: "takeaway", title: "Takeaway", content: "A simple period return compares the current price with the immediately previous price. Returns are stored as decimals, often shown as percentages, and each denominator changes as the series moves." },
    { id: "checkpoint", type: "checkpoint", label: "Before you continue", content: "You can calculate a period return from consecutive prices, convert between decimal and percentage notation, and explain why the previous price matters." },
  ],
};
