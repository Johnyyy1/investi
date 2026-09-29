import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { DemoButton } from "./demo-button";

export function AuthLayout({ title, description, children, footer }: {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[496px] flex-col px-[20px] py-8 sm:px-[32px] sm:py-12">
      <Link href="/" aria-label="investi – úvodní stránka" className="self-center rounded-control">
        <Image src="/brand/investi-logo.png" alt="investi" width={2172} height={724} sizes="144px" className="h-auto w-[144px]" />
      </Link>
      <section aria-labelledby="auth-title" className="my-auto py-10 sm:py-12">
        <header className="mb-7">
          <h1 id="auth-title" className="text-[1.875rem] leading-tight font-bold tracking-tight">{title}</h1>
          <p className="mt-3 text-body text-secondary">{description}</p>
        </header>
        {children}
        <p className="mt-7 text-center text-small text-secondary">{footer}</p>
        <DemoButton className="mt-7 border-t border-border pt-4" buttonClassName="w-full border-transparent bg-transparent text-secondary shadow-none hover:border-transparent hover:bg-surface-muted" />
      </section>
    </main>
  );
}
