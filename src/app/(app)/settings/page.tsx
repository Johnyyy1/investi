import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getLearningProfile } from "@/features/onboarding/repository";
import { preferencesSchema } from "@/features/onboarding/domain";
import { PreferencesEditor } from "@/components/onboarding/preferences-editor";
import { AppHeader } from "@/components/shell/app-header";
import { PageFrame } from "@/components/shell/page-frame";

export const metadata = { title: "Nastavení" };
export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const profile = await getLearningProfile(user.id);
  if (!profile?.onboardingCompletedAt) redirect("/onboarding");
  const answers = preferencesSchema.parse({ experienceLevel: profile.experienceLevel, goals: profile.goals, interests: profile.interests, dailyGoalMinutes: profile.dailyGoalMinutes });
  return <PageFrame width="reading"><p className="mb-3 text-small font-bold text-primary-hover">Nastavení</p><AppHeader title="Předvolby učení" description="Uprav své zájmy a tempo. Postup v lekcích ti zůstane." /><PreferencesEditor initialAnswers={answers} /></PageFrame>;
}
