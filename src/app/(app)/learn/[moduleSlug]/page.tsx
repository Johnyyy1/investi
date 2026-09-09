import { notFound } from "next/navigation";
import { ModuleOverview } from "@/components/learning/module-overview";
import { getModuleBySlug, getModulePath } from "@/features/learning/catalog";
import { loadLearner } from "@/features/learning/load-learner";

type Props = { params: Promise<{ moduleSlug: string }> };
export async function generateMetadata({ params }: Props) { return { title: getModuleBySlug((await params).moduleSlug)?.title ?? "Module unavailable" }; }
export default async function ModulePage({ params }: Props) {
  const { moduleSlug } = await params;
  const learningModule = getModuleBySlug(moduleSlug);
  if (!learningModule || learningModule.status !== "available") notFound();
  const summary = await loadLearner();
  const items = getModulePath(moduleSlug, summary.states);
  return <ModuleOverview slug={moduleSlug} completedLessons={items.filter((item) => item.state === "completed").length} items={items} />;
}
