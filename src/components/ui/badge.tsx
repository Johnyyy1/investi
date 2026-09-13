import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const badgeVariants = cva("inline-flex min-h-7 items-center gap-1.5 rounded-pill border px-2.5 py-1 text-microcopy font-bold", {
  variants: {
    tone: {
      neutral: "border-border bg-surface-muted text-secondary",
      primary: "border-primary/35 bg-primary-soft text-primary-hover",
      success: "border-success/45 bg-success-soft text-success-ink",
      warning: "border-warning/55 bg-warning-soft text-warning-ink",
      danger: "border-danger/35 bg-danger-soft text-danger-ink",
    },
  },
  defaultVariants: { tone: "neutral" },
});

export function Badge({ tone, className, ...props }: ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span {...props} className={cn(badgeVariants({ tone }), className)} />;
}
