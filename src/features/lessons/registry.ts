import { whatIsAReturnLesson } from "./returns/what-is-a-return";

export const authoredLessons = [whatIsAReturnLesson] as const;

export function getAuthoredLesson(moduleSlug: string, lessonSlug: string) {
  return authoredLessons.find((lesson) => lesson.moduleSlug === moduleSlug && lesson.slug === lessonSlug);
}
