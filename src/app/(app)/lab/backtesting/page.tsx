import Link from "next/link";
import { BacktestingLab } from "@/components/lab/backtesting-lab";
import { AppHeader } from "@/components/shell/app-header";
import { PageFrame } from "@/components/shell/page-frame";
export const metadata = { title: "Backtesting Lab" };
export default function BacktestingLabPage() {
  return <PageFrame width="wide"><Link href="/lab" className="inline-flex min-h-12 items-center text-small font-semibold text-primary-hover">← Lab</Link><div className="mt-3"><AppHeader title="Backtesting Lab" description="Demo data · synthetic returns, real calculations." /></div><BacktestingLab /></PageFrame>;
}
