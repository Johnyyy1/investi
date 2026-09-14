import type { ReactNode } from "react";
export function AppHeader({ title, description, actions, heading = "h1" }: { title: string; description?: string; actions?: ReactNode; heading?: "h1" | "h2" | "h3" }) {
  const Heading = heading;
  return <header className="flex flex-wrap items-start justify-between gap-6"><div className="min-w-0"><Heading className="break-words text-page-title font-bold tracking-[-0.025em] text-foreground">{title}</Heading>{description ? <p className="mt-3 max-w-2xl text-body text-secondary">{description}</p> : null}</div>{actions ? <div className="flex flex-wrap items-center gap-4 sm:gap-6">{actions}</div> : null}</header>;
}
