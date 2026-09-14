"use client";
import { useSyncExternalStore } from "react";
const subscribe = (notify: () => void) => { const timer = setInterval(notify, 60_000); return () => clearInterval(timer); };
const greeting = () => { const hour = new Date().getHours(); return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"; };
export function LearnerGreeting({ name }: { name: string }) {
  const salutation = useSyncExternalStore(subscribe, greeting, () => "Welcome");
  return <div className="min-w-0">
    <p className="break-words text-small font-bold text-primary-hover">{salutation}, {name.trim().split(/\s+/)[0] || "learner"}</p>
    <h1 className="mt-1 break-words text-section-title font-bold tracking-[-0.02em] text-foreground sm:text-[2rem]">Ready for the next step?</h1>
  </div>;
}
