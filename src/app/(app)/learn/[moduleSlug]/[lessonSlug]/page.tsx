import { notFound } from "next/navigation";
import { CompletionAction } from "@/components/lesson/completion-action";
import { LessonLayout } from "@/components/lesson/lesson-layout";
import { LessonRenderer } from "@/components/lesson/lesson-renderer";
import { getAuthoredLesson } from "@/features/lessons/registry";
import { getLessonProgress } from "@/features/progress/repository";
import { getCurrentUser } from "@/lib/session";

type LessonPageProps = { params: Promise<{ moduleSlug: string; lessonSlug: string }> };
export default async function LessonPage({ params }: LessonPageProps) {
  const { moduleSlug, lessonSlug } = await params;
  const lesson = getAuthoredLesson(moduleSlug, lessonSlug);
  if (!lesson) notFound();
  const user = await getCurrentUser();
  const progress = user ? await getLessonProgress(user.id, lesson.id) : undefined;
  const status = progress?.status ?? "not_started";
  return <LessonLayout lesson={lesson}><LessonRenderer lesson={lesson} /><CompletionAction lessonId={lesson.id} initialStatus={status} /></LessonLayout>;
}
