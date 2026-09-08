"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { completeLessonAction, markLessonStartedAction } from "@/features/progress/actions";

export function CompletionAction({ lessonId, initialStatus }: { lessonId: string; initialStatus: "not_started" | "in_progress" | "completed" }) {
  const completionRef = useRef<HTMLElement>(null);
  const [hasReachedEnd, setHasReachedEnd] = useState(initialStatus === "completed");
  const [status, setStatus] = useState(initialStatus);
  const [error, setError] = useState<string>();
  useEffect(() => { if (initialStatus === "not_started") void markLessonStartedAction(lessonId); }, [initialStatus, lessonId]);
  useEffect(() => {
    const node = completionRef.current;
    if (!node || status === "completed") return;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setHasReachedEnd(true); }, { threshold: 0.2 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [status]);
  async function complete() {
    setError(undefined);
    const result = await completeLessonAction(lessonId);
    if (!result.ok) { setError(result.message); return; }
    setStatus("completed");
  }
  return <section ref={completionRef} className="mt-14 border-t-2 border-neutral-950 py-8" aria-labelledby="completion-heading"><p className="text-xs font-medium uppercase tracking-[0.15em] text-muted">Lesson complete</p><h2 id="completion-heading" className="mt-3 text-2xl font-semibold tracking-[-0.04em]">{status === "completed" ? "Marked complete" : "Ready to record your progress?"}</h2><p className="mt-3 max-w-xl text-sm leading-6 text-neutral-600">{status === "completed" ? "This completion is saved to your account and will remain when you return." : hasReachedEnd ? "You have reached the end of the lesson. Mark it complete when you are ready." : "Read through the lesson to unlock completion."}</p>{status === "completed" ? <p className="mt-5 text-sm font-medium text-positive">Completion saved</p> : <Button type="button" className="mt-5" disabled={!hasReachedEnd} onClick={complete}>Mark lesson complete</Button>}{error ? <p role="alert" className="mt-3 text-sm text-red-700">{error}</p> : null}</section>;
}
