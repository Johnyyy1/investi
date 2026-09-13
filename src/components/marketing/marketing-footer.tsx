import Image from "next/image";
import Link from "next/link";
import styles from "./marketing.module.css";

const footerGroups = [
  {
    title: "Product",
    links: [
      { href: "/learn", label: "Learn" },
      { href: "/lab/portfolio", label: "Portfolio Lab" },
      { href: "/lab/backtesting", label: "Backtesting" },
      { href: "/progress", label: "Progress" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/pricing", label: "Pricing" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/sign-in", label: "Sign in" },
      { href: "/sign-up", label: "Start learning" },
    ],
  },
] as const;

export function MarketingFooter() {
  return <footer className={styles.marketingFooter}>
    <div className={styles.container}>
      <div className={styles.footerTop}>
        <div className={styles.footerBrand}>
          <Link href="/" aria-label="investi home" className={styles.footerLogo}>
            <Image src="/brand/investi-logo.png" alt="investi" width={2172} height={724} sizes="150px" />
          </Link>
          <p>Learn investing through practice.</p>
        </div>

        <nav aria-label="Footer navigation" className={styles.footerNavigation}>
          {footerGroups.map((group) => <div key={group.title} className={styles.footerLinkGroup}>
            <h2>{group.title}</h2>
            <ul>
              {group.links.map((link) => <li key={link.href}>
                <Link href={link.href} prefetch={false}>{link.label}</Link>
              </li>)}
            </ul>
          </div>)}
        </nav>
      </div>

      <div className={styles.footerBottom}>
        <p>© 2026 Investi. All rights reserved.</p>
        <p>Investi is an educational product. Nothing on this site is financial advice.</p>
      </div>
    </div>
  </footer>;
}
