import { cva, type VariantProps } from "class-variance-authority";
import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex h-10 items-center justify-center whitespace-nowrap px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 disabled:pointer-events-none disabled:opacity-50",
  { variants: { variant: { primary: "bg-neutral-950 text-white hover:bg-neutral-800", secondary: "border border-neutral-300 bg-transparent text-neutral-900 hover:bg-neutral-100", quiet: "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950" } }, defaultVariants: { variant: "primary" } },
);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, ...props }, ref) => (
  <button className={cn(buttonVariants({ variant }), className)} ref={ref} {...props} />
));
Button.displayName = "Button";
