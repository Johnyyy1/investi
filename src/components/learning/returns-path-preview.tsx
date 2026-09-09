"use client";
import { useRouter } from "next/navigation";
import { ModulePath } from "@/components/gamification/module-path";
import { getReturnsPath } from "@/features/learning/returns-path";
import { returnsLessons } from "@/features/lessons/returns/manifest";

export function ReturnsPathPreview({ states }: { states: Parameters<typeof getReturnsPath>[0] }) {
  const router = useRouter();
  return <ModulePath items={getReturnsPath(states).filter((item) => item.state !== "locked")} onOpen={(id) => {
    const lesson = returnsLessons.find((lesson) => lesson.id === id && lesson.status === "available");
    if (lesson) router.push(`/learn/returns/${lesson.slug}`);
  }} />;
}
