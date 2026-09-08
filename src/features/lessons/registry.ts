import { whatIsAReturnLesson } from "./returns/what-is-a-return";
import { simpleReturnsLesson } from "./returns/simple-returns";
import { compoundingAndCumulativeReturnsLesson } from "./returns/compounding-and-cumulative-returns";

export const authoredLessons = [whatIsAReturnLesson, simpleReturnsLesson, compoundingAndCumulativeReturnsLesson] as const;

export function getAuthoredLesson(moduleSlug: string, lessonSlug: string) {
  return authoredLessons.find((lesson) => lesson.moduleSlug === moduleSlug && lesson.slug === lessonSlug);
}
