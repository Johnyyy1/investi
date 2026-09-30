# Marketing surface

The public landing page lives in `src/app/(marketing)` and remains public for signed-in users. Its layout scopes display fonts and the marketing CSS module. The header, hero, journey, product showcases, final call to action, and footer share the current brand assets. Product screens use the quieter shared design system.

Sign-up/sign-in actions use the existing authentication routes. Protected Learn/Lab links retain authentication gates and disable speculative lab prefetch. Explore demo uses the existing anonymous identity and server seed; it does not share a login or overwrite an existing demo portfolio. Mobile navigation uses native `details` semantics.

`PortfolioShowcase` directly renders `portfolio-pie.webp` with responsive `next/image` sizing. The 60/30/10 allocation is a static illustration without slider semantics, and example outcomes retain their educational disclosure. Hero/final-CTA scenery is decorative; chart-shaped imagery is never represented as live market data. The unused earlier pie wrapper has been retired.

The supplied `investi brand identity.png` remains a design reference rather than a runtime image. Runtime artwork has traced component references. Nunito/Caveat display fonts stay scoped to marketing; product typography uses Nunito Sans. Bright brand fills require readable navy/deep-blue text rather than blindly applying white body text.

Semantic sections, one H1, skip link, visible focus, responsive disclosure navigation, pending/error demo feedback, and reduced-motion styles are part of the current contract. Text must reflow when enlarged.

Run `BROWSER_CHANNEL=chrome node scripts/validate-marketing.mjs` against a fresh local app/database. It covers six widths and 200% root text, loaded artwork, static allocation semantics, mobile destinations, keyboard menu/skip link, metadata, reduced motion, demo failure/retry/session reuse/isolation, and protected routes. Output stays in `/tmp/investi-marketing-qa` unless explicitly overridden. Physical-device and assistive-technology checks remain manual.
