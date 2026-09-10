# Marketing landing — Phase 1

The public `/` route is `src/app/(marketing)/page.tsx`. Its route-group layout
scopes the display font, palette and CSS module to the marketing surface.
The existing root layout and product theme remain intact. Learn, Lab, Progress,
onboarding and auth routes retain their architecture and behavior.

The page contains only the marketing header, centered hero, portfolio artwork and first blue journey scene. No later landing sections are implemented.

## Routes and behavior

- Start learning links to the existing `/sign-up` route.
- Sign in links to `/sign-in`.
- Learn, Portfolio Lab and Backtesting link to the existing protected routes.
  Signed-out visitors encounter the existing authentication gate.
- Explore demo renders the existing `DemoButton` with optional compact styling.
  Its session check, anonymous sign-in, server seeding, redirect, pending state,
  error and retry behavior are unchanged. Auth-page defaults remain unchanged.
- At narrower widths, a native `details` menu exposes every destination without
  JavaScript. Mobile keeps the wordmark and menu, with primary actions in the
  hero and menu. Product links disable prefetch to avoid eagerly loading labs.
- `/` remains public even when a session exists. Auth entry routes retain their
  existing redirect for signed-in visitors.

## Integrated portfolio asset

The final artwork is `public/brand/portfolio-pie.webp`, supplied and integrated
in the current working tree. `PortfolioPieVisual` uses `next/image` with a
responsive `sizes` attribute and `preload`. Its square wrapper reserves image
space without layout shift. The supplied source and other brand assets are
preserved unchanged; only the pie image is loaded by the landing page.

The wrapper is 410px wide / 170px overlap on desktop, 340px / 135px on tablet,
and 260px / 100px on mobile. The artwork has transparent internal padding, so
its visible overlap is smaller than the wrapper's (roughly 104px, 80px and 59px,
respectively). Negative bottom margin and explicit stacking place the actual
image across the hard warm-white / blue boundary.

The final pass preserves Gemini's asset placement and scene arrangement,
reduces the desktop/tablet wrapper's top margin to 24px, and trims scene top
padding to 185px desktop, 155px tablet and 120px mobile. Bottom padding remains
56px, 48px and 44px. The scene expands naturally with enlarged text.

## Art direction and reference differences

- Nunito 800 provides rounded display type for headings and the wordmark,
  locally served through `next/font`. Body copy retains the existing Nunito Sans.
  The app's typography is unchanged. Gemini's Caveat handwriting is retained,
  using only weight 700 for the three short annotations.
- Marketing tokens use warm white `#F8F6F0`, blue `#2498F3`, deep blue `#1667B2`,
  navy `#17324A`, pale blue `#DFF2FF`, and restrained green and warm tints.
- Contrast adjustments: the hero's second line uses deep blue; the scene's
  large heading is white (3.06:1 against blue); primary
  button labels use bold navy at large-text sizes (4.31:1). Supporting text and
  the small eyebrow use navy mixed with 10% black, including mobile body copy. Warm white on brand blue is only 2.83:1, so
  copying that combination for text would fail even the large-text threshold.
- The existing text wordmark is retained rather than inventing the reference's
  leaf logo. Supplied brand reference/logo files are preserved without adding
  them to the page or changing the existing header design.
- The scene uses differently sized, staggered, gently rotated panels, with
  integrated Lucide book, wrench and chart symbols rather than new 3D icons.
  The Backtest copy explicitly says educational demo data, not historical data.
- Handwritten annotations read “A smarter you”, “A brighter tomorrow” and
  “Practice today. Invest tomorrow.” The first two remain beside the pie on
  desktop/tablet and are hidden on mobile to keep its space clear. The practice
  note stays beside Backtest where there is room, and wraps below it when text
  enlarges. Notes and doodles are decorative and hidden from assistive technology.
  No decorative animation was added; button transitions respect reduced motion.

## Responsive layout, accessibility and performance

The content container is capped at 1220px, with 64px/48px/24px/20px minimum side
gutters across desktop, small desktop, tablet and mobile. The desktop hero is
centered with an 88px two-line H1. Tablet remains centered; the blue scene stacks
below 1100px. Mobile uses 44–48px headings, stacked CTAs and 1–2° panel rotations.
At 320px the first headline phrase wraps to preserve legibility. Text containers
have no fixed heights; enlarged copy wraps and panels expand. Panel text gets a
full row when enlarged text makes the icon-and-copy layout too narrow.

The page has one H1, labelled semantic sections, real links, decorative icons
hidden from assistive technology, a keyboard skip link, visible focus outlines,
native disclosure-menu semantics, accessible pending/error demo states, and
landing-specific title/description. No animation or scroll behavior is required
to access any content.

Marketing components are server components; the existing demo control is the
only interactive client boundary introduced on the route. `/` prerenders as a
static page. No dependencies, animation libraries, chart libraries or WebGL are
added. The existing root theme remains shared, including its global styles.

## Validation

Run the repository checks:

```sh
npm run lint
npm run typecheck
npm test
npm run build
node scripts/validate-marketing.mjs
```

If generated route types still refer to the former `src/app/page.tsx`, run
`npx next typegen` before typecheck. No source workaround is needed.

The browser script requires a running local app and its local PostgreSQL database.
It uses installed Playwright with Chrome, defaults to `http://localhost:3000`,
and writes screenshots/results to `/tmp/investi-marketing-qa`. Override with
`MARKETING_TEST_URL`, `MARKETING_SCREENSHOT_DIR` and `BROWSER_CHANNEL` if needed.

It checks all six requested widths (1440, 1024, 768, 390, 375, 320), each at 100%
and 200% root text size; overflow/clipping; loaded artwork and overlap geometry; menu
keyboard interaction and all five mobile destinations; skip link; metadata;
reduced motion; auth CTA routes;
demo pending/failure/retry, session reuse and identity isolation; and continued access
to the protected product routes. It deletes only demo identities it creates.
Screenshots require human/visual review in addition to the programmatic checks.
The loaded artwork and all six normal-size layouts were visually reviewed,
along with enlarged-text layouts and the open mobile menu.

Final validation on 2026-09-10: lint, typecheck, all 244 tests across 24 test
files, production build, and the full marketing browser acceptance script pass.
The production build prerenders `/`; the authenticated app routes remain dynamic.
