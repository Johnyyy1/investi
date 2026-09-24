import { redirect } from "next/navigation";
import { getLearningProfile } from "@/features/onboarding/repository";
import { AppShell } from "@/components/app-shell";
import { getCurrentUser } from "@/lib/session";
import { loadPortfolioLabUnlock } from "@/features/progression/repository";

export default async function ApplicationLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const profile = await getLearningProfile(user.id);
  if (!profile?.onboardingCompletedAt) redirect("/onboarding");
  const portfolioLabUnlock = await loadPortfolioLabUnlock(user.id);
  return <AppShell userName={user.name} isDemo={user.isAnonymous === true} needsTimeZone={!profile.timeZone} portfolioLabLocked={!portfolioLabUnlock.unlocked}>{children}</AppShell>;
}
