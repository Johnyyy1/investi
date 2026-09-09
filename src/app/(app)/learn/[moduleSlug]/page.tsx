import { notFound } from "next/navigation";
import { ReturnsOverview } from "@/components/learning/returns-overview";
import { getModuleBySlug } from "@/features/learning/catalog";
import { getReturnsPath } from "@/features/learning/returns-path";
import { RETURNS_MODULE_ID, returnsLessons } from "@/features/lessons/returns/manifest";
import { getLessonProgress, getModuleProgress } from "@/features/progress/repository";
import { getCurrentUser } from "@/lib/session";

export const metadata = { title: "Returns" };

export default async function ModulePage({ params }: { params: Promise<{ moduleSlug: string }> }) {
  const { moduleSlug } = await params;
  const learningModule = getModuleBySlug(moduleSlug);
  if (!learningModule || learningModule.status !== "available" || moduleSlug !== "returns") notFound();
  const user = await getCurrentUser();
  const [completedLessons, states] = user ? await Promise.all([
    getModuleProgress(user.id, RETURNS_MODULE_ID),
    Promise.all(returnsLessons.filter((lesson) => lesson.status === "available").map((lesson) => getLessonProgress(user.id, lesson.id))),
  ]) : [0, []];
  return <ReturnsOverview completedLessons={completedLessons} items={getReturnsPath(states.filter((state) => state !== undefined))} />;
}
