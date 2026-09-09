import { FlaskConical, BookOpen, ChartNoAxesCombined, type LucideIcon } from "lucide-react";
export type ShellNavItem = { id: string; label: string; icon: LucideIcon; href?: string };
/** Unimplemented destinations are deliberately unavailable until routes exist. */
export const learningNavigation: ShellNavItem[] = [
  { id: "learn", label: "Learn", icon: BookOpen, href: "/learn" },
  { id: "lab", label: "Lab", icon: FlaskConical, href: "/lab" },
  { id: "progress", label: "Progress", icon: ChartNoAxesCombined, href: "/progress" },

];

