import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Create account" };

export default async function SignUpPage() {
  if (await getCurrentUser()) redirect("/dashboard");

  return <main className="grid min-h-screen bg-background lg:grid-cols-[minmax(0,1fr)_30rem]">
    <section className="hidden border-r border-line px-12 py-10 lg:flex lg:flex-col lg:justify-between"><Link href="/" className="text-base font-semibold tracking-[-0.04em]">Quantlearn</Link><div className="max-w-md pb-20"><p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">Start learning</p><h1 className="mt-5 text-4xl font-semibold tracking-[-0.055em] text-balance">Build quantitative judgment, one decision at a time.</h1><p className="mt-5 max-w-sm text-base leading-7 text-neutral-600">Short theory, meaningful data, and work you can return to.</p></div></section>
    <section className="flex items-center px-5 py-14 sm:px-10 lg:px-12"><div className="mx-auto w-full max-w-sm"><Link href="/" className="text-base font-semibold tracking-[-0.04em] lg:hidden">Quantlearn</Link><p className="mt-12 text-xs font-medium uppercase tracking-[0.16em] text-muted lg:mt-0">Get started</p><h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em]">Create your account</h1><p className="mt-3 text-sm leading-6 text-neutral-600">Save your progress and return whenever you are ready.</p><SignUpForm /><p className="mt-6 text-sm text-muted">Already a learner? <Link className="font-medium text-neutral-950 underline underline-offset-4" href="/sign-in">Sign in</Link>.</p></div></section>
  </main>;
}
