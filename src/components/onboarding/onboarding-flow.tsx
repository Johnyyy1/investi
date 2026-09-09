"use client";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { ArrowLeft, BookOpen, Check } from "lucide-react";
import { LearningButton } from "@/components/learning/learning-button";
import { LearningProgressBar } from "@/components/learning/lesson-progress";
import { useLearningDuration } from "@/components/learning/motion";
import { canContinue, interestOptions, preferencesSchema, recommendLearningPath, resumeStep, type OnboardingDraft } from "@/features/onboarding/domain";
import { completeOnboardingAction, saveDraftAction } from "@/features/onboarding/actions";
import { PreferencesQuestion, questionTitles } from "./preferences-questions";
import { PathRecommendation } from "./path-recommendation";

export function OnboardingFlow({ initialAnswers, initialStep }: { initialAnswers: OnboardingDraft; initialStep: number }) {
  const [answers, setAnswers] = useState(initialAnswers);
  const [step, setStep] = useState(resumeStep(initialAnswers, initialStep));
  const [error, setError] = useState<string>();
  const [signIn, setSignIn] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const heading = useRef<HTMLHeadingElement>(null);
  const duration = useLearningDuration();
  const parsed = preferencesSchema.safeParse(answers);
  useEffect(() => { heading.current?.focus(); window.scrollTo({ top: 0, behavior: "instant" }); }, [step]);

  function advance() {
    if (pending || !canContinue(answers, step)) return;
    setError(undefined);
    startTransition(async () => {
      try {
        const result = step === 6 ? await completeOnboardingAction(answers) : await saveDraftAction({ answers, step: step + 1 });
        if (!result.ok) { setError(result.message); setSignIn("signIn" in result && result.signIn === true); return; }
        if (step === 6) { router.replace("/dashboard"); router.refresh(); }
        else setStep(step + 1);
      } catch { setError("We couldn’t connect. Your answers are still here. Please try again."); }
    });
  }
  const title = step === 0 ? "Build real investing knowledge, step by step." : step === 5 ? "Your recommended path" : step === 6 ? "Your learning path is ready." : questionTitles[step];
  return <main className="mx-auto flex min-h-dvh max-w-3xl flex-col px-5 pt-6 sm:px-10 sm:pt-10">
    <header className="flex items-center gap-6"><span className="shrink-0 text-ql-title font-bold" aria-label="investi">investi<span className="text-ql-link">.</span></span><LearningProgressBar value={step} total={6} label="Onboarding progress" /></header>
    <div className="mt-5 min-h-12">{step > 0 && <LearningButton variant="ghost" className="-ml-3 px-3" disabled={pending} onClick={() => { setError(undefined); setStep(step - 1); }}><ArrowLeft aria-hidden="true" className="size-4" />Back</LearningButton>}</div>
    <motion.section key={step} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration }} className="flex-1 py-7 sm:py-10" aria-labelledby="onboarding-heading">
      {(step === 0 || step === 6) && <div aria-hidden="true" data-illustration-slot="onboarding" className="mb-7 flex size-16 items-center justify-center rounded-ql-lg bg-ql-blue-100 text-ql-link">{step === 0 ? <BookOpen className="size-8" /> : <Check className="size-8" />}</div>}
      {step === 0 && <p className="mb-3 text-ql-small font-semibold text-ql-link">A few questions. A starting point that fits.</p>}
      <h1 id="onboarding-heading" ref={heading} tabIndex={-1} className="mb-5 text-ql-page-title font-semibold focus:outline-none">{title}</h1>
      {step === 0 && <><p className="max-w-xl text-ql-emphasis text-ql-secondary">Learn the fundamentals, understand how markets work, and progress toward advanced investing at your own pace.</p><p className="mt-8 text-ql-small text-ql-secondary">About 2–3 minutes. You can edit your preferences anytime.</p></>}
      {step >= 1 && step <= 4 && <PreferencesQuestion step={step} answers={answers} onChange={setAnswers} disabled={pending} />}
      {step === 5 && parsed.success && <PathRecommendation answers={parsed.data} />}
      {step === 6 && parsed.success && <><p className="text-ql-body text-ql-secondary">One short lesson is a great place to begin.</p><dl className="mt-8 space-y-5 rounded-ql-lg border border-ql-border bg-ql-surface p-6"><div><dt className="text-ql-small text-ql-secondary">Starting module</dt><dd className="mt-1 text-ql-title font-semibold">{recommendLearningPath(parsed.data).recommendedModule.title}</dd></div><div><dt className="text-ql-small text-ql-secondary">Daily learning goal</dt><dd className="mt-1 font-semibold">{answers.dailyGoalMinutes === 20 ? "20+" : answers.dailyGoalMinutes} minutes a day</dd></div><div><dt className="text-ql-small text-ql-secondary">Your interests</dt><dd className="mt-1 font-semibold">{answers.interests.slice(0, 2).map((value) => interestOptions.find((option) => option.value === value)?.label).join(" · ")}</dd></div></dl></>}
    </motion.section>
    <footer className="sticky bottom-0 z-10 border-t border-ql-border bg-ql-page pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      {error && <p role="alert" className="mb-3 text-ql-small text-ql-danger-ink">{error}{signIn && <> <Link href="/sign-in" className="underline">Sign in</Link></>}</p>}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-ql-meta text-ql-secondary">{step === 6 ? "Your pace. Your progress." : "Answers are saved when you continue."}</p>
        <LearningButton loading={pending} disabled={!canContinue(answers, step)} className="w-full sm:w-auto sm:min-w-44" onClick={advance}>{pending ? "Saving…" : step === 0 ? "Get started" : step === 6 ? "Start learning" : "Continue"}</LearningButton>
      </div>
      {step === 6 && <LearningButton variant="ghost" className="mt-2 w-full" disabled={pending} onClick={() => { setError(undefined); setStep(1); }}>Edit preferences</LearningButton>}
    </footer>
  </main>;
}
