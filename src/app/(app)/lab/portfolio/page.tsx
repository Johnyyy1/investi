import Link from "next/link";
import { PortfolioLab } from "@/components/lab/portfolio-lab";
export const metadata = { title: "Portfolio Lab" };
export default function PortfolioLabPage() {
  return <main className="mx-auto max-w-6xl px-5 py-6 sm:px-10 lg:py-10"><Link href="/lab" className="inline-flex min-h-12 items-center text-ql-small text-ql-link">← Lab</Link><h1 className="mt-3 text-ql-page-title font-bold">Portfolio Lab</h1><p className="mt-3 text-ql-body text-ql-secondary">Mix assets. Test an outcome.</p><PortfolioLab /></main>;
}
