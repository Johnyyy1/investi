import Link from "next/link";
import { BacktestingLab } from "@/components/lab/backtesting-lab";
export const metadata = { title: "Backtesting Lab" };
export default function BacktestingLabPage() {
  return <main className="mx-auto max-w-6xl px-5 py-6 sm:px-10 lg:py-10"><Link href="/lab" className="inline-flex min-h-12 items-center text-ql-small text-ql-link">← Lab</Link><h1 className="mt-3 text-ql-title font-bold min-[375px]:text-ql-page-title">Backtesting Lab</h1><p className="mt-3 text-ql-body text-ql-secondary">Demo data · synthetic returns, real calculations.</p><BacktestingLab /></main>;
}
