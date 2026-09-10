import type { Metadata } from "next";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { Hero } from "@/components/marketing/hero";
import { JourneyIntro } from "@/components/marketing/journey-intro";
import styles from "@/components/marketing/marketing.module.css";

export const metadata: Metadata = {
  title: "Learn investing by doing",
  description: "Interactive lessons, portfolio experiments and backtests — from your first stock to quantitative investing.",
};

export default function MarketingPage() {
  return <>
    <a href="#main" className={styles.skipLink}>Skip to content</a>
    <MarketingHeader />
    <main id="main" tabIndex={-1}>
      <Hero />
      <JourneyIntro />
    </main>
  </>;
}
