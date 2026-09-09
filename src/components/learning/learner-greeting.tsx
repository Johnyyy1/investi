"use client";
import { useSyncExternalStore } from "react";
const subscribe = (notify: () => void) => { const timer = setInterval(notify, 60_000); return () => clearInterval(timer); };
const greeting = () => { const hour = new Date().getHours(); return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"; };
export function LearnerGreeting({ name }: { name: string }) {
  const salutation = useSyncExternalStore(subscribe, greeting, () => "Welcome");
  return <h1 className="break-words text-ql-page-title font-semibold">{salutation}, {name.trim().split(/\s+/)[0] || "learner"}</h1>;
}
