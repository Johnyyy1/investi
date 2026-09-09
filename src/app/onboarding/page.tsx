import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getLearningProfile } from "@/features/onboarding/repository";
import { draftSchema, emptyDraft } from "@/features/onboarding/domain";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";

export const metadata = { title: "Your learning path" };
export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const profile = await getLearningProfile(user.id);
  if (profile?.onboardingCompletedAt) redirect("/dashboard");
  const answers = profile ? draftSchema.parse({ experienceLevel: profile.experienceLevel, goals: profile.goals, interests: profile.interests, dailyGoalMinutes: profile.dailyGoalMinutes }) : emptyDraft;
  return <OnboardingFlow initialAnswers={answers} initialStep={profile?.onboardingStep ?? 0} />;
}
