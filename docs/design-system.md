# QuantLearn learning design system

The new system is opt-in through `.learning-theme`. The working application keeps its existing design until route-by-route migration. Preview at `/dev/design-system` under `npm run dev`; the route returns 404 in production and is excluded from normal navigation. All showcase rewards and learner values are explicitly illustrative.

## Tokens and typography

`src/styles/learning-tokens.css` owns Tailwind v4 theme tokens. Prefix all new learning utilities with `ql-`. Page/surface/subtle colors are #F7FBFF / #FFFFFF / #EEF7FF. Primary blue runs from 50 (#EEF8FF) to 700 (#227CD0), with 500 (#4AAEFF) the primary button fill. Primary ink is #18324A. Borders are #DCEAF7 and #C5DAEB.

Semantic accents: success #55C878 on #EFFBF2; warning #F7BF4F on #FFF9E8; danger #F26F6F on #FFF2F2. Use darker semantic ink for text. Blue/green/red accent fills are not body text. Original secondary #607890 is retained as `ql-secondary-palette`; readable secondary ink is #586F85 so small text passes 4.5:1 against the pale backgrounds. Muted #8DA0B2 is decorative only. Controls use a stronger border and focus ring. Contrast tests protect the intended text/surface pairs.

Nunito Sans is loaded by next/font in the showcase with weights 400, 500, 600, 700. During migration load that font at the new shell boundary and set `--font-learning`; do not add another UI font. Existing fonts remain on legacy routes during this slice. KaTeX uses its own mathematical fonts, which are not UI typography.

Text classes: `text-ql-meta` (12), `small` (14), `body` (16), `emphasis` (18), `title` (20), `section` (24), `page-title` (32), `celebration` (40, completion only). Use regular or semibold by default; avoid 800/900. Never reuse a color name as a text-size token.

Spacing uses Tailwind's four-pixel base with 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80px preferred. Named CSS space aliases mirror that scale. Radius: xs 8, sm 10, md 14, lg 18, xl 24, full 999px. Controls use md, concept/formula surfaces lg, and composed lesson surfaces xl. Full rounding is reserved for badges and progress tracks. Shadows are limited to small (two low-opacity layers) and medium (4px/16px); prefer borders and separation.

## Component rules

| Component | Responsibility |
| --- | --- |
| LearningButton | Native button, five variants, 48px minimum, loading/disabled semantics, tactile press |
| AnswerOption | Native radio, shared name gives arrow-key behavior; state, checked and disabled are independently controlled |
| LessonProgress | Back action, animated bar and compact step count |
| LessonFeedback | Correct/incorrect/informational title and explanation; optional Continue and sticky placement |
| ConceptCard | Compact definition or insight, not an all-purpose section container |
| FormulaBlock | Trusted-author LaTeX, KaTeX HTML + MathML, variable definitions, safe rendering fallback |
| FinanceInput | Labeled raw-string input with mode, prefix/suffix, hint/error; never parses or calculates |
| MetricResult | Compact formatted output with explicit sign and semantic ink |
| LearningChart | Recharts line chart, shared axes/grid/tooltip/margins, empty/invalid states, accessible data table |
| CompletionScreen | Supplied completion result and optional XP; callback controls navigation |
| Streak / XpCounter / DailyGoal / AchievementBadge | Controlled visual state only; no fabricated persistence |
| ModulePath | Completed/active/available/locked steps; inline CTA is keyboard-accessible without a popover dependency |
| AppSidebar / MobileNav / AppHeader | Composable shell foundations; optional header heading level for nesting |

Wrap AnswerOption groups in a fieldset with a legend. Supply explanatory LessonFeedback after submission; correctness never uses a toast. Shortcut labels are display hints, not global keyboard handlers: only show them if the lesson implements those shortcuts (or clearly identifies them as option numbers).

FinanceInput modes identify intent; percentage supplies a default % suffix, currency units must be passed explicitly. Keep blanks and partial values as strings and validate at the domain boundary. MetricResult consumes formatted values; no financial logic lives here. LearningChart is a focused single-series starting point, not a chart builder. Extend its shared style exports for additional meaningful chart types.

Motion durations are 150ms fast, 250ms normal, 500ms reward. `useLearningDuration` respects reduced motion, including width animation; CSS disables transitions/press transforms where appropriate. Progress updates, XP changes, and completion are event-driven. No ambient motion.

Sticky feedback is opt-in, uses safe-area padding, and belongs at the end of the lesson region. Check short/mobile viewports when integrating. Bottom navigation is hidden with `lessonMode`; reserve bottom space when using fixed navigation. Practice and Progress have no routes yet, so defaults expose them as unavailable, never as broken links. Supply real items when those features exist.

## Library boundaries

Reuse the existing native/CVA primitives in `components/ui` where they fit. Low-level shadcn/Radix primitives belong there if a future dialog/popover/menu requires their behavior; there is no need to add a runtime UI kit for native buttons or radios.

Never introduce a new UI library when an existing project primitive or domain component can solve the problem. Do not use raw shadcn components directly in lesson content when an equivalent QuantLearn learning component exists. Lessons consume the domain layer; infrastructure and one-off non-learning forms may use low-level primitives directly.

Added: Motion and KaTeX (+ KaTeX types). Retained: Tailwind, CVA, Lucide, Recharts. No Sonner dependency until actual system notifications are introduced; no correctness toasts. No additional framework, Storybook, popover dependency, gamification database, or lesson-content rewrite.

## Prohibited patterns

No gradients, glows, glass, dark primary surfaces, oversized KPI cards, random accent colors, heavy floating shadows, excessive pills/icons, or decorative chart data. Keep hierarchy in spacing, scale, alignment and surface contrast. Color supports meaning.

## Review and rollout

The showcase includes an interactive answer/completion flow, all control states, KaTeX, input errors, chart/table/empty state, reward previews, every path state, and shell samples. It is not a product route or a source of real learner data.

Next slice: migrate the Returns module overview to ModulePath and the new shell, reading existing persisted lesson states. Then migrate a single lesson reading/practice flow. Keep auth, progress actions, financial utilities, and authored content unchanged while validating each integration.

