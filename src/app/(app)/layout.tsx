import { redirect } from "next/navigation";
import { getLearningProfile } from "@/features/onboarding/repository";
import { AppShell } from "@/components/app-shell";
import { getCurrentUser } from "@/lib/session";

export default async function ApplicationLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const profile = await getLearningProfile(user.id);
  if (!profile?.onboardingCompletedAt) redirect("/onboarding");
  return <AppShell userName={user.name}>{children}</AppShell>;
}
