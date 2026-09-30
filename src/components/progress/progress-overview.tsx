import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, BookOpen, ChartNoAxesCombined, Check, ChevronRight, Clock3, Flame, LockKeyhole, PiggyBank, Sparkles, Target, UnlockKeyhole } from "lucide-react";
import { AppHeader } from "@/components/shell/app-header";
import { ButtonLink } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Surface } from "@/components/ui/surface";
import { moduleCatalog } from "@/features/learning/catalog";
import type { loadLearner } from "@/features/learning/load-learner";
import type { loadPortfolioLabUnlock } from "@/features/progression/repository";
import { formatPracticeCapitalMinor } from "@/features/rewards/presentation";
import { formatDate, formatDecimal, formatCount, formatPercentage } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { weeklyActivity } from "./activity";
import styles from "./progress-overview.module.css";

type Summary = Awaited<ReturnType<typeof loadLearner>>;
type Unlock = Awaited<ReturnType<typeof loadPortfolioLabUnlock>>;

function IconTile({ icon: Icon, tone = "primary", small = false }: { icon: LucideIcon; tone?: "primary" | "warning" | "success"; small?: boolean }) {
  return <span aria-hidden="true" className={cn("flex shrink-0 items-center justify-center rounded-control", small ? "size-9" : "size-11", tone === "warning" ? "bg-warning-soft text-warning-ink" : tone === "success" ? "bg-success-soft text-success-ink" : "bg-primary-soft text-primary-hover")}><Icon className={small ? "size-5" : "size-6"} /></span>;
}

function Stat({ icon, tone, value, label, note, testId }: { icon: LucideIcon; tone?: "primary" | "warning" | "success"; value: string; label: string; note: string; testId?: string }) {
  return <Surface elevation="raised" className="flex min-w-0 items-start gap-4 p-4 sm:p-5"><IconTile icon={icon} tone={tone} /><div className="min-w-0"><p data-testid={testId} className="break-words text-card-title font-bold tabular-nums">{value}</p><p className="mt-0.5 text-small font-semibold">{label}</p><p className="mt-1 text-microcopy text-secondary">{note}</p></div></Surface>;
}

export function ProgressOverview({ summary, unlock, now }: { summary: Summary; unlock: Unlock | null; now: Date }) {
  const totalXp = unlock?.totalXp ?? summary.gamification?.totalXp ?? 0;
  const completedToday = summary.gamification?.todayCompleted ?? 0;
  const dailyTarget = summary.gamification?.dailyTarget ?? 1;
  const timeZone = summary.gamification?.timeZone ?? "UTC";
  const activity = weeklyActivity(summary.recent, now, timeZone);
  const recent = summary.recent[0];
  const recentLesson = summary.lessons.find((lesson) => lesson.id === recent?.lessonId);
  const continueHref = summary.allComplete ? "/lab" : `/learn/${summary.next.moduleSlug}/${summary.next.slug}`;
  const dailyDone = completedToday >= dailyTarget;
  const remainingXp = unlock ? Math.max(0, unlock.xpRequired - totalXp) : 0;
  const UnlockIcon = unlock?.unlocked ? UnlockKeyhole : LockKeyhole;

  return <div className={styles.page}>
    <AppHeader title="Podívej se, jak daleko jsi došel." description="Tvůj přehled učení a postup k Portfolio Labu." />

    {unlock && <section aria-labelledby="portfolio-progress-title" className="mt-6">
      <Surface elevation="raised" className={styles.hero}>
        <div className="min-w-0">
          <h2 id="portfolio-progress-title" className="flex items-center gap-2 text-body font-bold"><UnlockIcon aria-hidden="true" className="size-5 shrink-0" />Postup k Portfolio Labu</h2>
          <p className="mt-2 break-words text-ql-celebration font-bold tabular-nums"><span className="text-primary-hover">{formatDecimal(totalXp)}</span> / {formatDecimal(unlock.xpRequired)} XP</p>
          <div className="mt-4 flex items-center gap-3"><Progress value={totalXp} total={unlock.xpRequired} label="XP potřebné k odemčení Portfolio Labu" className="h-4 min-w-0" /><span className="shrink-0 text-small font-bold tabular-nums">{formatPercentage(Math.min(totalXp / unlock.xpRequired, 1), 0)}</span></div>
          <p className="mt-3 text-small text-secondary">{unlock.unlocked ? "Portfolio Lab je odemčený. Vyzkoušej, co ses naučil." : remainingXp > 0 ? `Ještě ${formatDecimal(remainingXp)} XP a všechny lekce Základů investování k odemčení Labu.` : "XP už máš. Dokonči všechny lekce Základů investování."}</p>
        </div>
        <div className={styles.heroVisual} aria-hidden="true"><div className="flex size-36 items-center justify-center rounded-panel border border-primary/15 bg-primary-soft/35 text-primary/35"><ChartNoAxesCombined className="size-24" strokeWidth={1} /></div></div>
        <Surface className="flex min-w-0 items-start gap-3 p-4"><IconTile icon={UnlockIcon} tone={unlock.unlocked ? "success" : "warning"} small /><div className="min-w-0"><h3 className="text-small font-bold">Portfolio Lab</h3><p className="mt-1 text-microcopy text-secondary">{unlock.unlocked ? "Odemčeno. Tvůj prostor pro první cvičné investice." : "Odemkne se po splnění všech podmínek."}</p><ButtonLink href="/lab/portfolio" variant="secondary" size="compact" className="mt-3 min-h-11 px-3 text-microcopy text-primary-hover"><span>{unlock.unlocked ? "Otevřít Lab" : "Zobrazit podmínky"}</span><ArrowRight aria-hidden="true" className="size-4 shrink-0" /></ButtonLink></div></Surface>
      </Surface>
    </section>}

    <section aria-label="Přehled učení" className={cn(styles.stats, "mt-5")}>
      <Stat icon={BookOpen} value={formatDecimal(summary.completed.length)} label="dokončených lekcí" note={`z ${summary.lessons.length} dostupných`} />
      <Stat icon={Flame} tone="warning" value={formatCount(summary.gamification?.streak ?? 0, ["den", "dny", "dní"])} label="aktuální série" note="Uč se každý den a udrž sérii." />
      <Stat icon={PiggyBank} tone="success" value={formatPracticeCapitalMinor(summary.practiceCapital.earnedPracticeCapitalMinor)} label="virtuální kapitál" note="v Portfolio Labu" testId="total-practice-capital" />
      <Stat icon={Sparkles} value={`${formatDecimal(totalXp)} XP`} label="celkem získáno" note="Za dokončené lekce" testId="total-xp" />
    </section>
    <p className="sr-only" data-testid="available-progress">Dokončeno {summary.completed.length} z {summary.lessons.length} dostupných lekcí</p>

    <div className={cn(styles.lower, "mt-6")}>
      <section className={styles.journey} aria-labelledby="study-journey-title">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-1"><h2 id="study-journey-title" className="text-section-title font-bold tracking-[-0.02em]">Tvoje studijní cesta</h2><Link href="/learn#curriculum" className="inline-flex min-h-11 items-center gap-1 text-microcopy font-semibold text-primary-hover hover:underline">Zobrazit celý plán<ArrowRight aria-hidden="true" className="size-4 shrink-0" /></Link></div>
        <Surface elevation="raised"><ol className="divide-y divide-border">{moduleCatalog.map((module, index) => {
          const completed = summary.completed.filter((lesson) => lesson.moduleSlug === module.slug).length;
          const available = module.status === "available";
          const done = available && completed === module.lessonCount;
          const content = <>
            <span aria-hidden="true" className={cn("flex size-10 items-center justify-center rounded-pill text-small font-bold tabular-nums", done ? "bg-success-soft text-success-ink" : "bg-surface-muted text-secondary")}>{String(index + 1).padStart(2, "0")}</span>
            <div className="min-w-0"><h3 className={cn("text-small font-bold", !available && "text-secondary")}>{module.title}</h3><p className="mt-1 text-microcopy text-secondary">{module.description}</p></div>
            <div className={styles.rowStatus}>{available ? <><p className="mb-2 flex items-center gap-1.5 text-microcopy text-secondary">{done && <Check aria-hidden="true" className="size-4 text-success-ink" />}{completed} / {module.lessonCount} lekcí{done && <span className="sr-only"> · Dokončeno</span>}</p><Progress value={completed} total={module.lessonCount} label={`Dokončené lekce modulu ${module.title}`} tone={done ? "success" : "primary"} /></> : <><p className="flex items-center gap-2 text-microcopy font-semibold text-secondary"><LockKeyhole aria-hidden="true" className="size-4 shrink-0" />Připravujeme</p><p className="mt-1 text-microcopy text-secondary">Kapitola zatím není dostupná.</p></>}</div>
            {available && <ChevronRight aria-hidden="true" className={cn(styles.chevron, "size-4 text-secondary")} />}
          </>;
          return <li key={module.slug}>{available ? <Link href={`/learn/${module.slug}`} className={cn(styles.row, "rounded-control transition-colors hover:bg-primary-soft/30")}>{content}</Link> : <div className={styles.row}>{content}</div>}</li>;
        })}</ol></Surface>
      </section>

      <section className={styles.goal} aria-labelledby="daily-goal-title"><Surface elevation="raised" className="p-4 sm:p-5"><div className="flex items-start gap-3"><IconTile icon={Target} small /><div className="min-w-0 flex-1"><h2 id="daily-goal-title" className="text-body font-bold">Dnešní cíl</h2><p className="mt-1 text-body tabular-nums">{completedToday} / {dailyTarget} {dailyTarget === 1 ? "lekce" : "lekcí"}</p><Progress value={completedToday} total={dailyTarget} label="Dnešní cíl" tone={dailyDone ? "success" : "primary"} className="mt-2 h-4" /><p className="mt-3 text-microcopy text-secondary">{dailyDone ? "Dnešní cíl splněn. Každá lekce se počítá." : unlock?.unlocked ? "Dokonči lekci a rozvíjej své investiční znalosti." : "Dokonči lekci a posuň se blíž k Portfolio Labu."}</p></div></div><ButtonLink href={continueHref} className="mt-4 w-full px-3 text-small"><span>{summary.allComplete ? "Prozkoumat Lab" : "Pokračovat v učení"}</span><ArrowRight aria-hidden="true" className="size-4 shrink-0" /></ButtonLink></Surface></section>

      <section className={styles.recent} aria-labelledby="recent-title"><Surface elevation="raised" className="p-4 sm:p-5"><div className="flex items-start gap-3"><IconTile icon={Clock3} small /><div className="min-w-0 flex-1"><h2 id="recent-title" className="text-body font-bold">Nedávno probráno</h2><div className="mt-3 flex items-center gap-2"><div className="min-w-0 flex-1">{recentLesson ? <><Link href={`/learn/${recentLesson.moduleSlug}/${recentLesson.slug}`} className="inline-flex min-h-11 items-center text-small font-semibold underline decoration-border-strong underline-offset-4 hover:text-primary-hover">{recentLesson.title}</Link><p className="mt-1 text-microcopy text-secondary">Dokončeno {recent.completedAt && formatDate(recent.completedAt, { timeZone })}</p></> : <><p className="text-small font-semibold">Zatím nemáš žádnou lekci.</p><p className="mt-1 text-microcopy text-secondary">Začni první lekcí a tady se ti zobrazí ta poslední.</p></>}</div><Image src="/brand/books-icon.webp" alt="" width={56} height={56} sizes="56px" className="size-14 shrink-0 opacity-70" /></div></div></div></Surface></section>

      <section className={styles.activity} aria-labelledby="activity-title"><Surface elevation="raised" className="p-4 sm:p-5"><h2 id="activity-title" className="flex items-center gap-2 text-body font-bold"><ChartNoAxesCombined aria-hidden="true" className="size-5 text-primary-hover" />Tvoje aktivita</h2><div className={cn(styles.week, "mt-3")}><ol className={styles.days} aria-label="Dokončené lekce tento týden">{activity.days.map((day) => <li key={day.date} className="flex flex-col items-center gap-2" aria-current={day.today ? "date" : undefined}><span className="text-microcopy text-secondary" aria-hidden="true">{day.label}</span><span aria-hidden="true" className={cn("flex size-4 items-center justify-center rounded-pill", day.completed ? "bg-primary-hover text-white" : "bg-border/60")}>{day.completed > 0 && <Check className="size-3" />}</span><span className="sr-only">{formatDate(day.date, { timeZone: "UTC" })}: {formatCount(day.completed, ["dokončená lekce", "dokončené lekce", "dokončených lekcí"])}</span></li>)}</ol><div className={styles.weekCount}><p className="text-card-title font-bold tabular-nums" data-testid="weekly-completed">{activity.completed}</p><p className="mt-1 text-microcopy text-secondary">lekcí tento týden</p></div></div></Surface></section>
    </div>

    <details className="mt-6 text-small text-secondary"><summary className="flex min-h-12 w-fit cursor-pointer items-center rounded-control text-primary-hover">Jak funguje pokrok</summary><p className="max-w-3xl pb-3">První dokončení lekce přidá 60 XP. XP měří učení a nelze je utratit. Dokončením všech sedmi lekcí Základů investování a získáním 420 XP odemkneš Portfolio Lab a jednorázově dostaneš 5 000 Kč virtuálního kapitálu. Opakování další odměnu nepřidává.</p><p className="max-w-3xl">Virtuální kapitál slouží ke vzdělávání. Nejde o skutečné peníze a nelze ho vybrat.</p></details>
  </div>;
}
