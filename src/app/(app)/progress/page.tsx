import { ProgressOverview } from "@/components/progress/progress-overview";
import { PageFrame } from "@/components/shell/page-frame";
import { loadLearner } from "@/features/learning/load-learner";
import { loadPortfolioLabUnlock } from "@/features/progression/repository";

export const metadata = { title: "Pokrok" };

export default async function ProgressPage() {
  const summary = await loadLearner();
  const unlock = summary.user ? await loadPortfolioLabUnlock(summary.user.id) : null;
  return <PageFrame width="wide" className="lg:py-10">
    <ProgressOverview summary={summary} unlock={unlock} now={new Date()} />
  </PageFrame>;
}
