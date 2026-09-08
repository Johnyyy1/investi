import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { ProgressBar } from "@/components/ui/progress-bar";
import { getModuleBySlug } from "@/features/learning/catalog";
import { RETURNS_MODULE_ID, returnsLessons } from "@/features/lessons/returns/manifest";
import { getLessonProgress, getModuleProgress } from "@/features/progress/repository";
import { getCurrentUser } from "@/lib/session";

type ModulePageProps = { params: Promise<{ moduleSlug: string }> };

export default async function ModulePage({ params }: ModulePageProps) {
  const { moduleSlug } = await params;
  const learningModule = getModuleBySlug(moduleSlug);
  if (!learningModule || learningModule.status !== "available") notFound();

  const user = await getCurrentUser();
  const [completedLessons, lessonStates] = user
    ? await Promise.all([
        getModuleProgress(user.id, RETURNS_MODULE_ID),
        Promise.all(returnsLessons.slice(0, 3).map((lesson) => getLessonProgress(user.id, lesson.id))),
      ])
    : [0, []];
  const percentage = Math.round((completedLessons / returnsLessons.length) * 100);

  return <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
    <Link href="/learn" className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-950"><ArrowLeft size={15} aria-hidden="true" /> Curriculum</Link>
    <div className="mt-10 grid gap-8 border-b border-line pb-10 sm:grid-cols-[minmax(0,1fr)_13rem]"><div><p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">Quant Foundations · Module 01</p><h1 className="mt-4 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">{learningModule.title}</h1><p className="mt-4 max-w-2xl text-base leading-7 text-neutral-600">{learningModule.description}</p></div><div className="border-l border-line pl-5"><p className="text-sm font-medium">Module progress</p><ProgressBar value={percentage} label="Returns module progress" className="mt-4" /><p className="mt-3 text-sm text-muted">{completedLessons} of {returnsLessons.length} lessons complete</p></div></div>
    <ol className="divide-y divide-line">{returnsLessons.map((lesson, index) => {
      const state = lessonStates[index];
      const stateLabel = state?.status === "completed" ? "Completed" : state?.status === "in_progress" ? "In progress" : "Available now";
      return <li key={lesson.id}>{lesson.status === "available" ? <Link href={`/learn/returns/${lesson.slug}`} className="flex items-center justify-between gap-5 py-6 transition-colors hover:bg-white sm:px-2"><div className="flex min-w-0 items-start gap-5 sm:gap-8"><span className="pt-1 font-mono text-xs text-muted">{String(index + 1).padStart(2, "0")}</span><div><h2 className="text-lg font-semibold tracking-[-0.03em]">{lesson.title}</h2><p className="mt-1.5 text-sm leading-6 text-neutral-600">{lesson.summary}</p><p className={`mt-2 text-xs ${state?.status === "completed" ? "text-positive" : "text-muted"}`}>{stateLabel} · {lesson.estimatedMinutes} min</p></div></div><ArrowUpRight className="shrink-0" size={18} aria-hidden="true" /></Link> : <div className="flex items-start justify-between gap-5 py-6 sm:px-2"><div className="flex min-w-0 items-start gap-5 sm:gap-8"><span className="pt-1 font-mono text-xs text-muted">{String(index + 1).padStart(2, "0")}</span><div><h2 className="text-lg font-semibold tracking-[-0.03em] text-neutral-600">{lesson.title}</h2><p className="mt-1.5 text-sm leading-6 text-muted">{lesson.summary}</p></div></div><span className="shrink-0 text-xs text-muted">Planned</span></div>}</li>;
    })}</ol>
  </main>;
}
