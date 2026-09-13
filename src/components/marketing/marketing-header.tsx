"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Menu } from "lucide-react";
import styles from "./marketing.module.css";

const destinations = [
  { href: "/", label: "Home", indicator: "home" },
  { href: "/learn", label: "Learn", indicator: "learn" },
  { href: "/lab/portfolio", label: "Portfolio Lab", indicator: "portfolio" },
  { href: "/lab/backtesting", label: "Backtesting", indicator: "backtesting" },
] as const;

type Indicator = (typeof destinations)[number]["indicator"];

function isActiveDestination(pathname: string, href: string) {
  return href === "/" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

function NavIndicator({ indicator }: { indicator: Indicator }) {
  if (indicator === "home") {
    return <span className={`${styles.navIndicator} ${styles.homeIndicator}`} aria-hidden="true"><span /></span>;
  }

  if (indicator === "learn") {
    return <span className={`${styles.navIndicator} ${styles.learnIndicator}`} aria-hidden="true"><span /><span /></span>;
  }

  if (indicator === "portfolio") {
    return <span className={`${styles.navIndicator} ${styles.portfolioIndicator}`} aria-hidden="true"><span /><span /><span /></span>;
  }

  return <span className={`${styles.navIndicator} ${styles.backtestingIndicator}`} aria-hidden="true">
    <svg viewBox="0 0 28 8" focusable="false"><path d="M1 6.5h4l3-2.5h4l3-3 4 4 3-2.5h5" /></svg>
  </span>;
}

export function MarketingHeader() {
  const pathname = usePathname();

  return <header className={`${styles.container} ${styles.headerShell}`}>
    <div className={styles.headerGlass}>
      <Link href="/" aria-label="investi home" className={styles.logo}>
        <Image src="/brand/investi-logo.png" alt="investi" width={2172} height={724} priority />
      </Link>
      <nav aria-label="Main navigation" className={styles.desktopNav}>
        {destinations.map(({ href, label, indicator }) => {
          const active = isActiveDestination(pathname, href);
          return <Link key={href} href={href} prefetch={false} aria-current={active ? "page" : undefined} className={styles.navLink}>
            <span className={styles.navLabel}>{label}</span>
            <NavIndicator indicator={indicator} />
          </Link>;
        })}
      </nav>
      <div className={styles.headerActions}>
        <Link href="/sign-in" prefetch={false} className={styles.signIn}>Sign in</Link>
        <Link href="/sign-up" prefetch={false} className={`${styles.button} ${styles.primaryButton}`}>Start learning <ArrowRight aria-hidden="true" /></Link>
      </div>
      <details className={styles.mobileMenu}>
        <summary aria-label="Navigation menu"><Menu aria-hidden="true" /><span>Menu</span></summary>
        <nav aria-label="Mobile navigation">
          {destinations.map(({ href, label }) => {
            const active = isActiveDestination(pathname, href);
            return <Link key={href} href={href} prefetch={false} aria-current={active ? "page" : undefined}>{label}</Link>;
          })}
          <Link href="/sign-in" prefetch={false}>Sign in</Link>
          <Link href="/sign-up" prefetch={false}>Start learning <ArrowRight aria-hidden="true" /></Link>
        </nav>
      </details>
    </div>
  </header>;
}
