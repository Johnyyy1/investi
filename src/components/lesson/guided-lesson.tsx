"use client";

import { useEffect, useRef, useState }
 from "react";
import { useRouter } from "next/navigation";
import { CompletionScreen } from "@/components/learning/completion-screen";
import { LearningButton, LearningLink } from "@/components/learning/learning-button";
import { LessonProgress } from "@/components/learning/lesson-progress";
import { getGuidedSteps } from "@/features/lessons/returns/guided-flow";
import { getModuleBySlug } from "@/features/learning/catalog";
import { isQuestion } from "@/features/lessons/question-evaluation";
import type { AuthoredLesson } from "@/features/lessons/types";
import { completeLessonAction, markLessonStartedAction, saveLessonPositionAction } from "@/features/progress/actions";
import type { CompletionRewardPresentation, LearningMomentum } from "@/features/progress/contracts";
import type { SerializedPracticeCapitalMinor } from "@/features/rewards/presentation";
import { LearningStats } from "@/components/gamification/learning-stats";
import { GuidedBlock } from "./guided-block";
import { GuidedQuestion } from "./guided-question";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { Feedback } from "@/components/ui/feedback";

export function GuidedLesson({ lesson, initialStatus, initialPosition, initialCompletedLessons, initialLearningMomentum, initialEarnedPracticeCapitalMinor, nextHref }: {
  lesson: AuthoredLesson; initialStatus: "not_started" | "in_progress" | "completed"; initialPosition: number; initialCompletedLessons: number; initialLearningMomentum: LearningMomentum; initialEarnedPracticeCapitalMinor: SerializedPracticeCapitalMinor; nextHref: string;
}) {
  const router = useRouter();
  const learningModule = getModuleBySlug(lesson.moduleSlug)!;
  const moduleHref = `/learn/${lesson.moduleSlug}`;
  const steps = getGuidedSteps(lesson);
  // A server revalidation after completion must not relabel this attempt as review.
  const [review] = useState(initialStatus === "completed");
  const [position, setPosition] = useState(review ? 0 : Math.min(Math.max(initialPosition, 0), steps.length - 1));
  const [finished, setFinished] = useState(false);
  const [completedLessons, setCompletedLessons] = useState(initialCompletedLessons);
  const [reward, setReward] = useState<CompletionRewardPresentation>();
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
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [position, finished]);
  useEffect(() => {
    if (!error) return;
    const frame = requestAnimationFrame(() => retryActionRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [error]);

  async function move(next: number, answers?: Record<string, string>) {
    if (busyRef.current) return;
    busyRef.current = true; setPending(true); setError(undefined);
    try {
      if (!review) {
        const result = await saveLessonPositionAction(lesson.id, next, answers);
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
        setReward(result.reward);
      }
      setFinished(true);
    } catch { setError("Completion could not be saved. Please try again."); }
    finally { busyRef.current = false; setPending(false); }
  }
  const step = steps[position];
  const question = step.blocks.find(isQuestion);
  const hasPrevious = position > 0;
  const onPrevious = () => void move(position - 1);
  return <main className="mx-auto min-h-screen w-full max-w-4xl px-4 py-5 min-[375px]:px-5 sm:px-8 sm:py-8 lg:py-10">
    <header className="rounded-surface border border-border bg-surface px-4 py-4 shadow-elevation-1 sm:px-6 sm:py-5">
      <LessonProgress step={finished ? steps.length + 1 : position + 1} total={steps.length + 1} onBack={() => router.push("/learn")} />
      <div className="mt-4 border-t border-border pt-4">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-microcopy font-extrabold tracking-[0.06em] text-primary-hover uppercase"><span>{learningModule.title}</span><span aria-hidden="true">·</span><span>Lesson {lesson.position}</span>{review ? <><span aria-hidden="true">·</span><span className="inline-flex items-center gap-1 text-success-ink"><CheckCircle2 aria-hidden="true" className="size-4" />Review</span></> : null}</div>
        <h1 className="mt-1 break-words text-card-title font-bold sm:text-[1.4rem]">{lesson.title}</h1>
        {review ? <p className="mt-1 text-small text-secondary">Already completed. Reviewing will not change your saved completion.</p> : null}
      </div>
    </header>
    {error ? <Feedback role="alert" state="incorrect" className="mt-5 text-small text-danger-ink">{error}</Feedback> : null}
    {finished ? <div className="mt-7 overflow-hidden rounded-panel border border-primary/30 bg-surface shadow-elevation-1">
      <CompletionScreen autoFocusAction title={review ? "Review complete" : "Lesson complete"} description={lesson.title} practiceCapitalAwardedMinor={reward && reward.practiceCapitalAwardedMinor !== "0" ? reward.practiceCapitalAwardedMinor : undefined} actionLabel={reward?.allComplete ? "Explore the Lab" : "Next lesson"} onContinue={() => { router.push(reward?.nextHref ?? nextHref); router.refresh(); }}>
        {reward && reward.practiceCapitalAwardedMinor === "0" && <p className="mt-4 text-ql-small text-ql-secondary">No duplicate reward.</p>}
        {review && <p className="mt-4 text-ql-small text-ql-secondary">Review strengthens an idea. No duplicate reward.</p>}
        <div className="mt-7 rounded-surface border border-border bg-surface p-5 text-left"><LearningStats stats={reward?.learningMomentum ?? initialLearningMomentum} earnedPracticeCapitalMinor={reward?.earnedPracticeCapitalMinor ?? initialEarnedPracticeCapitalMinor} goal /></div>
        {reward && !reward.allComplete && <p className="mt-6 text-ql-small text-ql-secondary">Up next: {reward.nextTitle}</p>}
      </CompletionScreen>
      <div className="border-t border-border px-6 py-4 text-center"><LearningLink variant="ghost" href="/learn"><ArrowLeft aria-hidden="true" className="size-4" />Back to Learn</LearningLink><LearningLink variant="ghost" href={moduleHref}>View module</LearningLink><p className="sr-only" data-testid="completion-progress">{completedLessons} available {learningModule.title} lessons complete · Saved to your account</p></div>
    </div> : <>
      <article key={position} className="mt-7 min-w-0" aria-labelledby="step-title">
        <div>
          <p className="text-microcopy font-extrabold tracking-[0.08em] text-primary-hover uppercase">Step {position + 1}</p>
          <h2 ref={headingRef} id="step-title" tabIndex={-1} className="mt-1 scroll-mt-8 break-words text-section-title font-bold tracking-[-0.02em]">{step.title}</h2>
        </div>
        <div className="mt-6 space-y-6">
          {step.blocks.filter((block) => !isQuestion(block)).map((block) => <GuidedBlock key={block.id} block={block} />)}
        </div>
        {question ? <GuidedQuestion block={question} pending={pending} onPrevious={hasPrevious ? onPrevious : undefined} continueButtonRef={retryActionRef} onContinue={(answers) => void move(position + 1, answers)} /> : <nav aria-label="Lesson step navigation" className="mt-8 flex flex-col-reverse gap-2 border-t border-border pt-5 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">{hasPrevious ? <LearningButton variant="ghost" disabled={pending} onClick={onPrevious}><ArrowLeft aria-hidden="true" className="size-4" />Previous</LearningButton> : <span /> }<LearningButton buttonRef={retryActionRef} className="w-full min-[420px]:w-auto min-[420px]:min-w-48" loading={pending} onClick={() => void (position === steps.length - 1 ? complete() : move(position + 1))}>{position === steps.length - 1 ? review ? "Finish review" : "Mark lesson complete" : "Continue"}<ArrowRight aria-hidden="true" className="size-4" /></LearningButton></nav>}
      </article>
    </>}
  </main>;
}
