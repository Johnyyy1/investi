import type { ReactNode } from "react";
export function AppHeader({ title, description, actions, heading = "h1" }: { title: string; description?: string; actions?: ReactNode; heading?: "h1" | "h2" | "h3" }) {
  const Heading = heading;
  return <header className="flex flex-wrap items-start justify-between gap-6"><div><Heading className="text-ql-page-title font-semibold">{title}</Heading>{description ? <p className="mt-2 max-w-2xl text-ql-body text-ql-secondary">{description}</p> : null}</div>{actions ? <div className="flex flex-wrap items-center gap-6">{actions}</div> : null}</header>;
}
