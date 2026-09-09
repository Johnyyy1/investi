"use client";
import { useRouter } from "next/navigation";
import { ModulePath } from "@/components/gamification/module-path";
import { getModuleLessons, getModulePath } from "@/features/learning/catalog";
export function ModulePathPreview({ slug, states }: { slug: string; states: Parameters<typeof getModulePath>[1] }) {
  const router = useRouter();
  return <ModulePath items={getModulePath(slug, states).filter((item) => item.state !== "locked")} onOpen={(id) => {
    const lesson = getModuleLessons(slug).find((lesson) => lesson.id === id && lesson.status === "available");
    if (lesson) router.push(`/learn/${slug}/${lesson.slug}`);
  }} />;
}
