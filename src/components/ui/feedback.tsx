import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const feedbackVariants = cva("border", {
  variants: {
    state: {
      correct: "border-success bg-success-soft text-foreground",
      completed: "border-success bg-success-soft text-foreground",
      incorrect: "border-danger bg-danger-soft text-foreground",
      warning: "border-warning bg-warning-soft text-foreground",
      informational: "border-info/45 bg-info-soft text-foreground",
    },
  },
  defaultVariants: { state: "informational" },
});

export function Feedback({ state, className, ...props }: ComponentProps<"div"> & VariantProps<typeof feedbackVariants>) {
  return <div {...props} className={cn("rounded-surface px-5 py-4", feedbackVariants({ state }), className)} />;
}
