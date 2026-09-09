"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ModulePath, type ModulePathItem } from "@/components/gamification/module-path";
import { AppHeader } from "@/components/shell/app-header";
import { LearningProgressBar } from "./lesson-progress";
import { getModuleBySlug, getModuleLessons } from "@/features/learning/catalog";

export function ModuleOverview({ slug, items, completedLessons }: { slug: string; items: ModulePathItem[]; completedLessons: number }) {
  const router = useRouter();
  const learningModule = getModuleBySlug(slug)!;
  const lessons = getModuleLessons(slug);
  const available = lessons.filter((lesson) => lesson.status === "available");
  return <main className="mx-auto w-full min-w-0 max-w-4xl px-5 pt-8 pb-12 sm:px-10 lg:py-12">
    <Link href="/learn" className="inline-flex min-h-12 items-center text-ql-small text-ql-link underline underline-offset-4">Learn</Link>
    <div className="mt-6"><AppHeader title={learningModule.title} description={learningModule.description} /></div>
    <section aria-label="Module progress" className="mt-8 max-w-xl border-y border-ql-border py-6">
      <div className="mb-3 flex flex-wrap justify-between gap-2 text-ql-small"><p className="font-semibold">{completedLessons === available.length ? "Available lessons complete" : "Your progress"}</p><p data-testid="module-progress" className="text-ql-secondary">{completedLessons} of {available.length} available lessons complete</p></div>
      <LearningProgressBar value={completedLessons} total={available.length} label={`${learningModule.title} available lesson progress`} />
    </section>
    <section className="mt-10 max-w-xl" aria-labelledby="module-path-title"><h2 id="module-path-title" className="mb-8 text-ql-section font-semibold">Your learning path</h2>
      <ModulePath items={items} onOpen={(id) => { const lesson = available.find((item) => item.id === id); if (lesson) router.push(`/learn/${slug}/${lesson.slug}`); }} />
    </section>
  </main>;
}
