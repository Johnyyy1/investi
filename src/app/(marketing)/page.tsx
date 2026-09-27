import type { Metadata } from "next";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { Hero } from "@/components/marketing/hero";
import { JourneyIntro } from "@/components/marketing/journey-intro";
import { ProductShowcases } from "@/components/marketing/product-showcases";
import { FinalCta } from "@/components/marketing/final-cta";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import styles from "@/components/marketing/marketing.module.css";

export const metadata: Metadata = {
  title: "Uč se investovat praxí",
  description: "Interaktivní lekce, portfolio experimenty a backtesty — od první akcie po kvantitativní investování.",
};

export default function MarketingPage() {
  return <>
    <a href="#main" className={styles.skipLink}>Přejít k obsahu</a>
    <MarketingHeader />
    <main id="main" tabIndex={-1}>
      <Hero />
      <JourneyIntro />
      <ProductShowcases />
      <FinalCta />
    </main>
    <MarketingFooter />
  </>;
}
