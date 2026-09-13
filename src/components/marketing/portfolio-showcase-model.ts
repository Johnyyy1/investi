import { portfolioScenario } from "@/features/lab/portfolio";

const expectedReturns = [0.1, 0.04, 0];
const lowerExampleReturns = [-0.2, 0, 0];
const upperExampleReturns = [0.4, 0.1, 0.1];

export function getPortfolioShowcaseOutcome(weights: readonly number[]) {
  const normalizedWeights = weights.map((weight) => weight / 100);

  return {
    expectedReturn: portfolioScenario(normalizedWeights, expectedReturns, 1).returnValue,
    lowerExample: portfolioScenario(normalizedWeights, lowerExampleReturns, 1).returnValue,
    upperExample: portfolioScenario(normalizedWeights, upperExampleReturns, 1).returnValue,
  };
}
