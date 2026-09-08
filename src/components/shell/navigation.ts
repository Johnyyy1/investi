import { Home, BookOpen, ChartNoAxesCombined, Target, type LucideIcon } from "lucide-react";
export type ShellNavItem = { id: string; label: string; icon: LucideIcon; href?: string };
/** Unimplemented destinations are deliberately unavailable until routes exist. */
export const learningNavigation: ShellNavItem[] = [
  { id: "home", label: "Home", icon: Home, href: "/dashboard" },
  { id: "learn", label: "Learn", icon: BookOpen, href: "/learn" },
  { id: "practice", label: "Practice", icon: Target },
  { id: "progress", label: "Progress", icon: ChartNoAxesCombined },
];

