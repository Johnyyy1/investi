import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getLearningProfile } from "@/features/onboarding/repository";
import { preferencesSchema } from "@/features/onboarding/domain";
import { PreferencesEditor } from "@/components/onboarding/preferences-editor";

export const metadata = { title: "Learning preferences" };
export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const profile = await getLearningProfile(user.id);
  if (!profile?.onboardingCompletedAt) redirect("/onboarding");
  const answers = preferencesSchema.parse({ experienceLevel: profile.experienceLevel, goals: profile.goals, interests: profile.interests, dailyGoalMinutes: profile.dailyGoalMinutes });
  return <main className="mx-auto max-w-3xl px-5 py-8 sm:px-10 lg:py-12"><p className="mb-3 text-ql-small font-semibold text-ql-link">Settings</p><h1 className="text-ql-page-title font-semibold">Learning preferences</h1><p className="mt-3 text-ql-body text-ql-secondary">Adjust your interests and your pace. Your lesson progress stays with you.</p><PreferencesEditor initialAnswers={answers} /></main>;
}
