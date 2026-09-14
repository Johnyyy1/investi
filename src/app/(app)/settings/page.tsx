import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getLearningProfile } from "@/features/onboarding/repository";
import { preferencesSchema } from "@/features/onboarding/domain";
import { PreferencesEditor } from "@/components/onboarding/preferences-editor";
import { AppHeader } from "@/components/shell/app-header";
import { PageFrame } from "@/components/shell/page-frame";

export const metadata = { title: "Learning preferences" };
export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const profile = await getLearningProfile(user.id);
  if (!profile?.onboardingCompletedAt) redirect("/onboarding");
  const answers = preferencesSchema.parse({ experienceLevel: profile.experienceLevel, goals: profile.goals, interests: profile.interests, dailyGoalMinutes: profile.dailyGoalMinutes });
  return <PageFrame width="reading"><p className="mb-3 text-small font-bold text-primary-hover">Settings</p><AppHeader title="Learning preferences" description="Adjust your interests and your pace. Your lesson progress stays with you." /><PreferencesEditor initialAnswers={answers} /></PageFrame>;
}
