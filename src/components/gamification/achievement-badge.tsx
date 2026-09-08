"use client";
import { motion } from "motion/react";
import { LockKeyhole, Trophy } from "lucide-react";
import { useLearningDuration } from "@/components/learning/motion";

export function AchievementBadge({ title, description, unlocked }: { title: string; description: string; unlocked: boolean }) {
  const duration = useLearningDuration("reward");
  const Icon = unlocked ? Trophy : LockKeyhole;
  return <div className="flex items-start gap-3">
    <motion.span initial={false} animate={{ opacity: unlocked ? 1 : 0.8 }} transition={{ duration }} className={`flex size-12 shrink-0 items-center justify-center rounded-ql-md ${unlocked ? "bg-ql-warning-bg text-ql-warning-ink" : "bg-ql-subtle text-ql-secondary"}`}><Icon className="size-5" aria-hidden="true" /></motion.span>
    <div><p className="text-ql-small font-semibold">{title} <span className="font-normal text-ql-secondary">· {unlocked ? "Unlocked" : "Locked"}</span></p><p className="mt-1 text-ql-small text-ql-secondary">{description}</p></div>
  </div>;
}
