import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getLearningProfile, hasLearningHistory } from "@/features/onboarding/repository";
import { readLearnerProfile, requiresInitialOnboarding } from "@/features/personalization/profile";
import { PersonalizationEditor } from "@/components/personalization/preferences-editor";
import { AppHeader } from "@/components/shell/app-header";
import { PageFrame } from "@/components/shell/page-frame";

export const metadata = { title: "Přizpůsobení učení" };
export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const profile = await getLearningProfile(user.id);
  if (requiresInitialOnboarding(profile, !profile?.onboardingCompletedAt && await hasLearningHistory(user.id))) redirect("/onboarding");
  const learner = readLearnerProfile(profile);
  const preferences = { primaryGoal: learner.primaryGoal, interests: learner.interests, selfAssessedExperience: learner.selfAssessedExperience, preferredSessionMinutes: learner.preferredSessionMinutes };
  return <PageFrame width="reading"><p className="mb-3 text-small font-bold text-primary-hover">Nastavení</p><AppHeader title="Přizpůsobení učení" description="Uprav své zájmy a tempo. Postup v lekcích ti zůstane." /><PersonalizationEditor initialPreferences={preferences} personalized={learner.personalized} hasDiagnostic={Boolean(learner.diagnostic)} /></PageFrame>;
}
