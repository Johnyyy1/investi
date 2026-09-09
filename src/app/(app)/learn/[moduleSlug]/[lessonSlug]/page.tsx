import { notFound } from "next/navigation";
import { GuidedLesson } from "@/components/lesson/guided-lesson";
import { getModuleLessons } from "@/features/learning/catalog";
import { getAuthoredLesson } from "@/features/lessons/registry";
import { getLessonProgress, getModuleProgress } from "@/features/progress/repository";
import { getCurrentUser } from "@/lib/session";

type LessonPageProps = { params: Promise<{ moduleSlug: string; lessonSlug: string }> };
export async function generateMetadata({ params }: LessonPageProps) {
  const { moduleSlug, lessonSlug } = await params;
  return { title: getAuthoredLesson(moduleSlug, lessonSlug)?.title ?? "Lesson unavailable" };
}
export default async function LessonPage({ params }: LessonPageProps) {
  const { moduleSlug, lessonSlug } = await params;
  const lesson = getAuthoredLesson(moduleSlug, lessonSlug);
  if (!lesson) notFound();
  const user = await getCurrentUser();
  const progress = user ? await getLessonProgress(user.id, lesson.id) : undefined;
  const status = progress?.status ?? "not_started";
  const completedLessons = user ? await getModuleProgress(user.id, getModuleLessons(moduleSlug)[0].moduleId) : 0;
  return <GuidedLesson key={lesson.id} lesson={lesson} initialStatus={status} initialPosition={progress?.lastPosition ?? 0} initialCompletedLessons={completedLessons} />;
}
