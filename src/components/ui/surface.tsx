import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const surfaceVariants = cva("border border-border", {
  variants: {
    tone: {
      default: "bg-surface",
      muted: "bg-surface-muted",
      primary: "border-primary/35 bg-primary-soft",
    },
    elevation: {
      flat: "shadow-elevation-0",
      raised: "shadow-elevation-1",
      floating: "shadow-elevation-2",
    },
    radius: {
      control: "rounded-control",
      surface: "rounded-surface",
      panel: "rounded-panel",
    },
  },
  defaultVariants: { tone: "default", elevation: "flat", radius: "surface" },
});

export function Surface({ tone, elevation, radius, className, ...props }: ComponentProps<"div"> & VariantProps<typeof surfaceVariants>) {
  return <div {...props} className={cn(surfaceVariants({ tone, elevation, radius }), className)} />;
}
