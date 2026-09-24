import Link from "next/link";
import { PortfolioLab } from "@/components/lab/portfolio-lab";
import { PageFrame } from "@/components/shell/page-frame";
import { loadPortfolioView } from "@/features/portfolio/service";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { loadPortfolioLabUnlock } from "@/features/progression/repository";
import { LockedPortfolioLab } from "@/components/lab/locked-portfolio-lab";
export const metadata = { title: "Portfolio Lab" };
export default async function PortfolioLabPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const unlock = await loadPortfolioLabUnlock(user.id);
  if (!unlock.unlocked) return <LockedPortfolioLab unlock={unlock} />;
  const portfolio = await loadPortfolioView(user.id);
  return <PageFrame width="wide" className="max-w-[80rem] pt-6 sm:pt-7 lg:pt-8"><Link href="/lab" className="inline-flex min-h-11 items-center text-small font-semibold text-primary-hover">← Lab</Link><PortfolioLab portfolio={portfolio} /></PageFrame>;
}
