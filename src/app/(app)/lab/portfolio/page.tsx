import Link from "next/link";
import { PortfolioLab } from "@/components/lab/portfolio-lab";
import { AppHeader } from "@/components/shell/app-header";
import { PageFrame } from "@/components/shell/page-frame";
export const metadata = { title: "Portfolio Lab" };
export default function PortfolioLabPage() {
  return <PageFrame width="wide"><Link href="/lab" className="inline-flex min-h-12 items-center text-small font-semibold text-primary-hover">← Lab</Link><div className="mt-3"><AppHeader title="Portfolio Lab" description="Mix assets. Test an outcome." /></div><PortfolioLab /></PageFrame>;
}
