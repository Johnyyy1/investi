import type { Metadata, Viewport } from "next";
import { LearningTheme } from "@/components/learning/learning-theme";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "investi", template: "%s · investi" },
  description: "Nauč se investovat praxí.",
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8F6F0" },
    { media: "(prefers-color-scheme: dark)", color: "#102D4C" },
  ],
};
export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="cs"><body><LearningTheme>{children}</LearningTheme></body></html>;
}
