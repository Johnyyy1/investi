"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ModulePath, type ModulePathItem } from "@/components/gamification/module-path";
import { AppHeader } from "@/components/shell/app-header";
import { LearningProgressBar } from "./lesson-progress";
import { getModuleBySlug, getModuleLessons } from "@/features/learning/catalog";
import { PageFrame } from "@/components/shell/page-frame";
import { ArrowLeft } from "lucide-react";

export function ModuleOverview({ slug, items, completedLessons }: { slug: string; items: ModulePathItem[]; completedLessons: number }) {
  const router = useRouter();
  const learningModule = getModuleBySlug(slug)!;
  const lessons = getModuleLessons(slug);
  const available = lessons.filter((lesson) => lesson.status === "available");
  return <PageFrame width="focused">
    <Link href="/learn" className="inline-flex min-h-12 items-center gap-2 rounded-button px-3 text-small font-bold text-primary-hover hover:bg-primary-soft"><ArrowLeft aria-hidden="true" className="size-4" />Back to Learn</Link>
    <div className="mt-4"><AppHeader title={learningModule.title} description={learningModule.description} /></div>
    <section aria-label="Module progress" className="mt-7 rounded-surface border border-primary/30 bg-primary-soft px-5 py-5 sm:px-7">
      <div className="mb-3 flex flex-wrap justify-between gap-2 text-small"><p className="font-bold">{completedLessons === available.length ? "Available lessons complete" : "Your progress"}</p><p data-testid="module-progress" className="font-semibold text-secondary">{completedLessons} of {available.length} available lessons complete</p></div>
      <LearningProgressBar value={completedLessons} total={available.length} label={`${learningModule.title} available lesson progress`} />
    </section>
    <section className="mt-10 max-w-2xl" aria-labelledby="module-path-title"><p className="text-microcopy font-extrabold tracking-[0.08em] text-primary-hover uppercase">Lesson sequence</p><h2 id="module-path-title" className="mt-1 mb-8 text-section-title font-bold">Your learning path</h2>
      <ModulePath items={items} onOpen={(id) => { const lesson = available.find((item) => item.id === id); if (lesson) router.push(`/learn/${slug}/${lesson.slug}`); }} />
    </section>
  </PageFrame>;
}
