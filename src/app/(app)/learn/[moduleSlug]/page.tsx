import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getModuleBySlug } from "@/features/learning/catalog";

type ModulePageProps = { params: Promise<{ moduleSlug: string }> };
export default async function ModulePage({ params }: ModulePageProps) {
  const { moduleSlug } = await params;
  const learningModule = getModuleBySlug(moduleSlug);
  if (!learningModule || learningModule.status !== "available") notFound();
  return <main className="mx-auto max-w-4xl px-5 py-10 sm:px-8 lg:px-12 lg:py-14"><Link href="/learn" className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-950"><ArrowLeft size={15} aria-hidden="true" /> Curriculum</Link><div className="mt-12 border-b border-line pb-10"><p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">Module 01 · {learningModule.estimatedMinutes} min</p><h1 className="mt-4 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">{learningModule.title}</h1><p className="mt-4 max-w-2xl text-base leading-7 text-neutral-600">{learningModule.description}</p></div><section className="py-10" aria-labelledby="module-foundation-heading"><h2 id="module-foundation-heading" className="text-lg font-semibold tracking-[-0.03em]">Lesson framework is in place</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">This route is deliberately reserved for the next slice: concise lesson content, a meaningful return-series visualization, an exercise, and completion persistence. The schema and progress repository are ready for those pieces.</p></section></main>;
}
