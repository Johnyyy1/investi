import type { Metadata } from "next";
import { LearningTheme } from "@/components/learning/learning-theme";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "investi", template: "%s · investi" },
  description: "Learn investing, step by step. Build the knowledge behind better investing decisions.",
};
export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="en"><body><LearningTheme>{children}</LearningTheme></body></html>;
}
