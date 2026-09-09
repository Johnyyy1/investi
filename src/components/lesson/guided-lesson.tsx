"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CompletionScreen } from "@/components/learning/completion-screen";
import { LearningButton } from "@/components/learning/learning-button";
import { LessonProgress, LearningProgressBar } from "@/components/learning/lesson-progress";
import { getGuidedSteps } from "@/features/lessons/returns/guided-flow";
import { returnsLessons } from "@/features/lessons/returns/manifest";
import { isQuestion } from "@/features/lessons/question-evaluation";
import type { AuthoredLesson } from "@/features/lessons/types";
import { completeLessonAction, markLessonStartedAction, saveLessonPositionAction } from "@/features/progress/actions";
import { GuidedBlock } from "./guided-block";
import { GuidedQuestion } from "./guided-question";

export function GuidedLesson({ lesson, initialStatus, initialPosition, initialCompletedLessons }: {
  lesson: AuthoredLesson; initialStatus: "not_started" | "in_progress" | "completed"; initialPosition: number; initialCompletedLessons: number;
}) {
  const router = useRouter();
  const steps = getGuidedSteps(lesson);
  // A server revalidation after completion must not relabel this attempt as review.
  const [review] = useState(initialStatus === "completed");
  const [position, setPosition] = useState(review ? 0 : Math.min(Math.max(initialPosition, 0), steps.length - 1));
  const [finished, setFinished] = useState(false);
  const [completedLessons, setCompletedLessons] = useState(initialCompletedLessons);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const retryActionRef = useRef<HTMLButtonElement>(null);
  const movedRef = useRef(false);
  const busyRef = useRef(false);

  useEffect(() => {
    if (initialStatus === "not_started") void markLessonStartedAction(lesson.id).then((result) => {
      if (!result.ok) setError(result.message);
    }).catch(() => setError("Your place could not be saved. Continue to try again."));
  }, [initialStatus, lesson.id]);
  useEffect(() => {
    if (movedRef.current && !finished) {
      headingRef.current?.focus({ preventScroll: true });
      headingRef.current?.scrollIntoView({ block: "start", behavior: "instant" });
    }
  }, [position, finished]);
  useEffect(() => {
    if (!error) return;
    const frame = requestAnimationFrame(() => retryActionRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [error]);

  async function move(next: number) {
    if (busyRef.current) return;
    busyRef.current = true; setPending(true); setError(undefined);
    try {
      if (!review) {
        const result = await saveLessonPositionAction(lesson.id, next);
        if (!result.ok) { setError(result.message); return; }
      }
      movedRef.current = true; setPosition(next);
    } catch { setError("Your place could not be saved. Please try again."); }
    finally { busyRef.current = false; setPending(false); }
  }
  async function complete() {
    if (busyRef.current) return;
    busyRef.current = true; setPending(true); setError(undefined);
    try {
      if (!review) {
        const result = await completeLessonAction(lesson.id);
        if (!result.ok || result.completedLessons === undefined) { setError(result.message ?? "Completion could not be confirmed. Please try again."); return; }
        setCompletedLessons(result.completedLessons);
      }
      setFinished(true);
    } catch { setError("Completion could not be saved. Please try again."); }
    finally { busyRef.current = false; setPending(false); }
  }
  const step = steps[position];
  const question = step.blocks.find(isQuestion);
  return <main className="mx-auto min-h-screen max-w-3xl px-4 py-6 sm:px-8 sm:py-10">
    <LessonProgress step={finished ? steps.length + 1 : position + 1} total={steps.length + 1} onBack={() => router.push("/learn/returns")} />
    <p className="mt-6 text-ql-meta font-semibold text-ql-link">RETURNS · LESSON {lesson.position}{review ? " · REVIEW" : ""}</p>
    <h1 className="mt-2 text-ql-title font-semibold">{lesson.title}</h1>
    {review ? <p className="mt-2 text-ql-small text-ql-secondary">Already completed. Reviewing will not change your saved completion.</p> : <p className="mt-2 text-ql-small text-ql-secondary">Your place is saved when you continue. Answers and explorer inputs reset on refresh.</p>}
    {error ? <p role="alert" className="mt-5 rounded-ql-md border border-ql-danger bg-ql-danger-bg p-4 text-ql-small text-ql-danger-ink">{error}</p> : null}
    {finished ? <div className="mt-8 rounded-ql-xl bg-ql-surface">
      <CompletionScreen autoFocusAction title="Lesson complete" description={lesson.title} actionLabel="Back to Returns" onContinue={() => { router.push("/learn/returns"); router.refresh(); }} />
      <div className="px-6 pb-8 sm:px-10"><p className="mb-3 text-ql-small text-ql-secondary" data-testid="completion-progress">{completedLessons} of {returnsLessons.length} Returns lessons complete · Saved to your account</p><LearningProgressBar value={completedLessons} total={returnsLessons.length} label="Returns module progress" /></div>
    </div> : <>
      {position > 0 ? <LearningButton className="mt-4" variant="ghost" disabled={pending} onClick={() => void move(position - 1)}>Previous step</LearningButton> : null}
      <section key={position} className="mt-6 min-w-0 rounded-ql-xl bg-ql-surface" aria-labelledby="step-title">
        <div className="space-y-6 px-6 pt-8 pb-6 sm:px-10">
          <h2 ref={headingRef} id="step-title" tabIndex={-1} className="scroll-mt-8 text-ql-section font-semibold">{step.title}</h2>
          {step.blocks.filter((block) => !isQuestion(block)).map((block) => <GuidedBlock key={block.id} block={block} />)}
        </div>
        {question ? <GuidedQuestion block={question} pending={pending} continueButtonRef={retryActionRef} onContinue={() => void move(position + 1)} /> : <div className="sticky bottom-0 z-20 rounded-b-ql-xl border-t border-ql-border bg-ql-surface px-6 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-10"><LearningButton buttonRef={retryActionRef} className="w-full sm:w-auto" loading={pending} onClick={() => void (position === steps.length - 1 ? complete() : move(position + 1))}>{position === steps.length - 1 ? review ? "Finish review" : "Mark lesson complete" : "Continue"}</LearningButton></div>}
      </section>
    </>}
  </main>;
}
