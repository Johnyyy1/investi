import Link from "next/link";
import type { ReactNode } from "react";
export function AuthLayout({ title, description, children, footer }: { title: string; description: string; children: ReactNode; footer: ReactNode }) {
  return <main className="mx-auto flex min-h-screen max-w-lg flex-col px-5 py-8 sm:px-10 sm:py-12">
    <Link href="/" className="self-center text-ql-page-title font-bold">investi<span className="text-ql-link">.</span></Link>
    <section className="my-auto py-12"><p className="text-ql-small font-semibold text-ql-link">Learn investing, step by step.</p><h1 className="mt-4 text-ql-page-title font-semibold">{title}</h1><p className="mt-3 text-ql-body text-ql-secondary">{description}</p>{children}<p className="mt-8 text-ql-small text-ql-secondary">{footer}</p></section>
  </main>;
}
