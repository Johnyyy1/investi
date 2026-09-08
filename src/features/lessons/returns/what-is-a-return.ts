import type { AuthoredLesson } from "../types";
import { returnsLessons } from "./manifest";

export const whatIsAReturnLesson: AuthoredLesson = {
  id: returnsLessons[0].id,
  moduleSlug: "returns",
  slug: returnsLessons[0].slug,
  title: returnsLessons[0].title,
  eyebrow: "Quant Foundations · Returns",
  estimatedMinutes: returnsLessons[0].estimatedMinutes,
  sections: [
    { id: "meaning", label: "What a return measures" },
    { id: "comparing", label: "Comparing investments" },
    { id: "calculate", label: "Calculate a return" },
    { id: "check", label: "Check your reasoning" },
  ],
  blocks: [
    { id: "meaning", type: "heading", title: "A return tells you what an investment earned relative to where it began.", body: "A price movement is a fact. A return gives that movement context." },
    { id: "price-change", type: "paragraph", content: "Suppose an asset moves from 100 to 110. Its price changed by 10 units. That absolute change is useful, but it does not yet tell us how large the gain was relative to the money invested." },
    { id: "formula-one", type: "formula", expression: "R = (P_end − P_start) / P_start", variables: [{ symbol: "R", description: "the simple return" }, { symbol: "P_start", description: "the beginning price" }, { symbol: "P_end", description: "the ending price" }] },
    { id: "formula-two", type: "formula", expression: "R = P_end / P_start − 1", variables: [{ symbol: "R", description: "the same simple return" }, { symbol: "P_start", description: "the beginning price" }, { symbol: "P_end", description: "the ending price" }] },
    { id: "example-100", type: "workedExample", title: "From 100 to 110", introduction: "Start with an asset priced at 100 and finish at 110.", steps: [{ label: "Beginning price", value: "100" }, { label: "Ending price", value: "110" }, { label: "Absolute change", value: "+10" }, { label: "Return", value: "+10%", emphasis: true }], conclusion: "The asset earned 10% because the gain of 10 is measured against the starting price of 100." },
    { id: "positive-negative", type: "conceptCallout", title: "Returns can be positive, negative, or zero", content: "When the ending price is above the beginning price, the return is positive. When it is below, the return is negative. An unchanged price produces a zero return." },
    { id: "comparing", type: "heading", title: "The same price gain can mean very different things.", body: "Percentages make outcomes comparable across assets with different starting prices." },
    { id: "compare-assets", type: "workedExample", title: "A gain of 10 is not always a 10% return", steps: [{ label: "Asset A", value: "100 → 110 = +10 units = +10%", emphasis: true }, { label: "Asset B", value: "500 → 510 = +10 units = +2%", emphasis: true }], conclusion: "Both assets gained 10 units. Asset A delivered the larger return because 10 is a larger share of 100 than of 500." },
    { id: "prediction", type: "multipleChoiceQuestion", prompt: "Before you reveal the answer: Stock A moves from 50 to 55. Stock B moves from 200 to 210. Which investment had the larger percentage return?", options: [{ id: "a", label: "Stock A" }, { id: "b", label: "Stock B" }, { id: "c", label: "They had the same return" }], correctOptionId: "a", correctExplanation: "Stock A gained 5 on a starting price of 50, so its return is 10%. Stock B also gained 10 units, but 10 on 200 is only 5%.", incorrectExplanation: "Compare each gain with its own starting price. Stock A: 5 ÷ 50 = 10%. Stock B: 10 ÷ 200 = 5%." },
    { id: "calculate", type: "interactiveFigure", figure: "return-calculator", title: "Try the calculation", description: "Change either price. The calculator preserves the full calculation and rounds only the displayed result." },
    { id: "numeric", type: "numericQuestion", prompt: "A share increases from 80 to 92. What is its percentage return?", answer: 15, tolerance: 0.05, unit: "%", correctExplanation: "The absolute change is 12. Dividing by the beginning price gives 12 ÷ 80 = 0.15, or 15%.", incorrectExplanation: "First find the change: 92 − 80 = 12. Then divide by the beginning price, not the ending price: 12 ÷ 80 = 0.15 = 15%." },
    { id: "why-percent", type: "multipleChoiceQuestion", prompt: "Why are percentage returns generally more useful than absolute price changes when comparing investments?", options: [{ id: "a", label: "They always make gains look larger." }, { id: "b", label: "They put changes in relation to each investment’s starting value." }, { id: "c", label: "They remove the possibility of losses." }], correctOptionId: "b", correctExplanation: "Percentage returns normalize a gain or loss by the starting value. That makes a 10-unit change interpretable across investments with different prices.", incorrectExplanation: "Absolute changes omit the starting scale. Percentage returns divide the change by the beginning value, which makes comparisons meaningful." },
    { id: "check", type: "explanation", title: "A useful habit", content: "Whenever you see a price movement, ask: compared with what starting value? That question separates an absolute change from a return." },
    { id: "takeaway", type: "takeaway", title: "Takeaway", content: "Simple return is the percentage gain or loss from beginning price to ending price. It is usually more useful than absolute change when comparing investments." },
    { id: "checkpoint", type: "checkpoint", label: "Before you continue", content: "You can now distinguish a price change from a return, calculate a simple return, and explain why a percentage is the better comparison tool." },
  ],
};
