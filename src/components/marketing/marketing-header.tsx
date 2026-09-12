import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Menu } from "lucide-react";
import styles from "./marketing.module.css";

const destinations = [
  { href: "/", label: "Home", active: true },
  { href: "/learn", label: "Learn" },
  { href: "/lab/portfolio", label: "Portfolio Lab" },
  { href: "/lab/backtesting", label: "Backtesting" },
];

export function MarketingHeader() {
  return <header className={`${styles.container} ${styles.headerShell}`}>
    <div className={styles.headerGlass}>
      <Link href="/" aria-label="investi home" className={styles.logo}>
        <Image src="/brand/investi-logo.png" alt="investi" width={2172} height={724} priority />
      </Link>
      <nav aria-label="Main navigation" className={styles.desktopNav}>
        {destinations.map(({ href, label, active }) => <Link key={href} href={href} prefetch={false} aria-current={active ? "page" : undefined}>{label}</Link>)}
      </nav>
      <div className={styles.headerActions}>
        <Link href="/sign-in" prefetch={false} className={styles.signIn}>Sign in</Link>
        <Link href="/sign-up" prefetch={false} className={`${styles.button} ${styles.primaryButton}`}>Start learning <ArrowRight aria-hidden="true" /></Link>
      </div>
      <details className={styles.mobileMenu}>
        <summary aria-label="Navigation menu"><Menu aria-hidden="true" /><span>Menu</span></summary>
        <nav aria-label="Mobile navigation">
          {destinations.map(({ href, label, active }) => <Link key={href} href={href} prefetch={false} aria-current={active ? "page" : undefined}>{label}</Link>)}
          <Link href="/sign-in" prefetch={false}>Sign in</Link>
          <Link href="/sign-up" prefetch={false}>Start learning <ArrowRight aria-hidden="true" /></Link>
        </nav>
      </details>
    </div>
  </header>;
}
