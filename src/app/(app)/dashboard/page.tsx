import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ProgressBar } from "@/components/ui/progress-bar";

export default function DashboardPage() {
  return <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
    <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">Dashboard</p>
    <div className="mt-4 flex flex-col justify-between gap-6 border-b border-line pb-10 sm:flex-row sm:items-end"><div><h1 className="text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">Your learning practice</h1><p className="mt-3 max-w-xl text-base leading-7 text-neutral-600">A focused place to develop judgment with numbers, evidence, and repeatable reasoning.</p></div><Link href="/learn" className="inline-flex shrink-0 items-center gap-2 text-sm font-medium underline underline-offset-4">Browse curriculum <ArrowUpRight size={15} /></Link></div>
    <section className="grid gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_17rem]" aria-labelledby="continue-heading"><div><div className="flex items-baseline justify-between gap-4"><h2 id="continue-heading" className="text-lg font-semibold tracking-[-0.03em]">Continue</h2><span className="text-sm text-muted">Returns · 45 min</span></div><Link href="/learn/returns" className="mt-5 block border-y border-line py-6 transition-colors hover:bg-white"><p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Module 01</p><div className="mt-2 flex items-center justify-between gap-6"><div><h3 className="text-xl font-semibold tracking-[-0.04em]">Returns</h3><p className="mt-2 text-sm leading-6 text-neutral-600">Understand what an investment earned—and how to compare it.</p></div><ArrowUpRight className="shrink-0" size={18} aria-hidden="true" /></div></Link></div><div className="border-l border-line pl-6"><p className="text-sm font-medium">Your progress</p><ProgressBar value={0} label="Overall learning progress" className="mt-5" /><p className="mt-6 text-sm leading-6 text-neutral-600">Your completions will appear here once you begin the first lesson.</p></div></section>
  </main>;
}
