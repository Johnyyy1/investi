import Link from "next/link";
import { redirect } from "next/navigation";
import { loadLearner } from "@/features/learning/load-learner";
import { readLearnerProfile } from "@/features/personalization/profile";
import { goalLabels, sessionLabels } from "@/features/personalization/presentation";
import { Recommendation } from "@/components/personalization/recommendation";

export const metadata = { title: "Tvůj plán" };
export default async function PlanPage() {
  const summary = await loadLearner();
  if (!summary.user) redirect("/sign-in");
  if (!summary.profile?.onboardingCompletedAt) redirect("/onboarding");
  const profile = readLearnerProfile(summary.profile);
  return <main className="mx-auto min-h-dvh w-full max-w-2xl px-4 py-8 sm:px-8 [overflow-wrap:anywhere]">
    <p className="text-small font-semibold text-secondary">Krok 6 z 6 · Tvůj plán</p>
    <h1 className="mt-3 text-section-title font-bold">Tvůj plán</h1>
    <p className="mt-3 text-body text-secondary">Předvolby jsou uložené. Učení si můžeš kdykoli přizpůsobit v nastavení.</p>
    <dl className="my-7 space-y-4"><div><dt className="text-small text-secondary">Cíl</dt><dd className="mt-1 text-body font-semibold">{profile.primaryGoal ? goalLabels[profile.primaryGoal] : "Postupně poznat investování"}</dd></div><div><dt className="text-small text-secondary">Doporučené tempo</dt><dd className="mt-1 text-body font-semibold">{sessionLabels[profile.preferredSessionMinutes]} na jedno sezení</dd></div></dl>
    <Recommendation recommendation={summary.recommendation} plan />
    <Link href="/learn" className="mt-5 inline-flex min-h-12 items-center font-semibold text-primary-hover underline">Zobrazit celé učení</Link>
  </main>;
}
