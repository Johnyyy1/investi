import type { ReactNode } from "react";
import { Nunito, Caveat } from "next/font/google";
import styles from "@/components/marketing/marketing.module.css";

const display = Nunito({ subsets: ["latin"], weight: "800", variable: "--font-marketing-display", display: "swap" });
const handwritten = Caveat({ subsets: ["latin"], weight: "700", variable: "--font-marketing-handwritten", display: "swap" });

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return <div className={`${display.variable} ${handwritten.variable} ${styles.marketing}`}>{children}</div>;
}
