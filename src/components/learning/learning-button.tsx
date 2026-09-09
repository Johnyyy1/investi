import Link from "next/link";
import type { ComponentProps, Ref } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const variants = cva(
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-ql-md border-b-2 px-6 py-3 text-ql-body font-semibold transition duration-[var(--ql-motion-fast)] motion-safe:active:translate-y-px motion-safe:active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
  { variants: { variant: {
    primary: "border-ql-blue-700 bg-ql-blue-500 text-ql-text hover:bg-ql-blue-400",
    secondary: "border border-b-2 border-ql-border-strong bg-ql-surface text-ql-text hover:bg-ql-subtle",
    success: "border-ql-success-ink bg-ql-success text-ql-text hover:bg-ql-success/80",
    danger: "border-ql-danger-ink bg-ql-danger text-ql-text hover:bg-ql-danger/80",
    ghost: "border-transparent bg-transparent text-ql-link hover:bg-ql-subtle",
  } }, defaultVariants: { variant: "primary" } },
);
export type LearningButtonProps = ComponentProps<"button"> & VariantProps<typeof variants> & { loading?: boolean; buttonRef?: Ref<HTMLButtonElement> };
export function LearningButton({ variant, loading = false, disabled, className, children, type = "button", buttonRef, ...props }: LearningButtonProps) {
  return <button {...props} ref={buttonRef} type={type} disabled={disabled || loading} aria-busy={loading || undefined} className={cn(variants({ variant }), className)}>
    {loading ? <span aria-hidden="true" className="size-4 rounded-full border-2 border-current border-t-transparent motion-safe:animate-spin" /> : null}
    {children}
  </button>;
}

/** Navigation with the same sizing, focus and visual treatment as an action. */
export function LearningLink({ variant, className, ...props }: ComponentProps<typeof Link> & VariantProps<typeof variants>) {
  return <Link {...props} className={cn(variants({ variant }), className)} />;
}
