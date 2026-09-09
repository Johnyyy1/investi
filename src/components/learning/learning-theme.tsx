import type { ReactNode } from "react";
import { Nunito_Sans } from "next/font/google";
import "katex/dist/katex.min.css";

const font = Nunito_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-learning" });

/** Server-rendered opt-in boundary; legacy routes retain their existing theme. */
export function LearningTheme({ children }: { children: ReactNode }) {
  return <div className={`${font.variable} learning-theme min-h-screen`}>{children}</div>;
}
