import Link from "next/link";
import { redirect } from "next/navigation";
import { SignInForm } from "@/components/auth/sign-in-form";
import { AuthLayout } from "@/components/auth/auth-layout";
import { getCurrentUser } from "@/lib/session";

export const metadata = { title: "Přihlášení" };
export default async function AuthPage() {
  if (await getCurrentUser()) redirect("/learn");
  return <AuthLayout title="Vítej zpět" description="Přihlas se a naváž tam, kde jsi skončil." footer={<>Jsi v investi poprvé? <Link href="/sign-up" className="font-semibold text-ql-link underline underline-offset-4">Vytvořit účet</Link></>}><SignInForm /></AuthLayout>;
}
