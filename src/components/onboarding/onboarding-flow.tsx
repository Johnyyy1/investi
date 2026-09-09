"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LearningButton } from "@/components/learning/learning-button";
import { AnswerOption } from "@/components/learning/answer-option";
import { quickStartAction } from "@/features/onboarding/actions";
import type { OnboardingDraft } from "@/features/onboarding/domain";

export function OnboardingFlow({ initialAnswers }: { initialAnswers: OnboardingDraft; initialStep?: number }) {
  const [experience, setExperience] = useState(initialAnswers.experienceLevel ?? "BEGINNER");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  function start() {
    setError(undefined);
    startTransition(async () => {
      try {
        const result = await quickStartAction({ experienceLevel: experience, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone });
        if (!result.ok) { setError(result.message); return; }
        router.replace(result.href); router.refresh();
      } catch { setError("We couldn’t start your lesson. Please try again."); }
    });
  }
  return <main className="mx-auto flex min-h-dvh max-w-xl flex-col px-5 py-8 sm:px-10 sm:py-12">
    <p className="text-ql-section font-bold">investi<span className="text-ql-link">.</span></p>
    <section className="my-auto py-10">
      <p className="text-ql-small font-semibold text-ql-link">Welcome to investi</p>
      <h1 className="mt-4 text-ql-celebration font-bold">Learn investing<br />by doing.</h1>
      <fieldset className="mt-10 space-y-3"><legend className="mb-4 text-ql-body font-semibold">How familiar are you with investing?</legend>
        {[["BEGINNER", "I’m new"], ["BASIC", "I know the basics"], ["INVESTOR", "I already invest"]].map(([value, label]) => <AnswerOption key={value} name="experience" value={value} checked={experience === value || (value === "INVESTOR" && experience === "ADVANCED")} onChange={() => setExperience(value as typeof experience)} disabled={pending}>{label}</AnswerOption>)}
      </fieldset>
      {error && <p role="alert" className="mt-5 text-ql-small text-ql-danger-ink">{error}</p>}
      <LearningButton onClick={start} loading={pending} className="mt-8 w-full">Start learning</LearningButton>
      <p className="mt-4 text-center text-ql-small text-ql-secondary">One short lesson. Everything else can wait.</p>
    </section>
  </main>;
}
