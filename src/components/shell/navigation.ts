import { Home, Settings, BookOpen, ChartNoAxesCombined, type LucideIcon } from "lucide-react";
export type ShellNavItem = { id: string; label: string; icon: LucideIcon; href?: string };
/** Unimplemented destinations are deliberately unavailable until routes exist. */
export const learningNavigation: ShellNavItem[] = [
  { id: "home", label: "Home", icon: Home, href: "/dashboard" },
  { id: "learn", label: "Learn", icon: BookOpen, href: "/learn" },
  { id: "progress", label: "Progress", icon: ChartNoAxesCombined, href: "/progress" },
  { id: "settings", label: "Settings", icon: Settings, href: "/settings" },
];

