import Link from "next/link";
import { PortfolioLab } from "@/components/lab/portfolio-lab";
import { AppHeader } from "@/components/shell/app-header";
import { PageFrame } from "@/components/shell/page-frame";
import { loadPortfolioView } from "@/features/portfolio/service";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
export const metadata = { title: "Portfolio Lab" };
export default async function PortfolioLabPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const portfolio = await loadPortfolioView(user.id);
  return <PageFrame width="wide"><Link href="/lab" className="inline-flex min-h-12 items-center text-small font-semibold text-primary-hover">← Lab</Link><div className="mt-3"><AppHeader title="Portfolio Lab" description="Put the Practice Capital you earn by learning to work in a safe sandbox." /></div><PortfolioLab portfolio={portfolio} /></PageFrame>;
}
