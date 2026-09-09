import { PageState } from "@/components/learning/page-state";
import { LearningLink } from "@/components/learning/learning-button";
export default function NotFound() { return <PageState title="This page isn’t available" action={<LearningLink href="/learn">Back to learning</LearningLink>}>This lesson may still be on the roadmap. Explore the available Returns lessons to keep learning.</PageState>; }
