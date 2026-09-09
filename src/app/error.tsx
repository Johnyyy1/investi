"use client";
import { PageState } from "@/components/learning/page-state";
import { LearningButton } from "@/components/learning/learning-button";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageState title="We couldn’t load this page" action={<LearningButton onClick={reset}>Try again</LearningButton>}>Please try again in a moment. Your saved learning is still linked to your account.</PageState>;
}
