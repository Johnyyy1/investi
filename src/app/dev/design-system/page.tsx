import { notFound } from "next/navigation";
import { Nunito_Sans } from "next/font/google";
import "katex/dist/katex.min.css";
import { DesignSystemShowcase } from "@/components/design-system/showcase";

const font = Nunito_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-learning" });
export const metadata = { title: "Design system · Development", robots: { index: false, follow: false } };
export default function DesignSystemPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <div className={`${font.variable} learning-theme min-h-screen`}><DesignSystemShowcase /></div>;
}

