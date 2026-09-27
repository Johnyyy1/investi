import Link from "next/link";
import { redirect } from "next/navigation";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { AuthLayout } from "@/components/auth/auth-layout";
import { getCurrentUser } from "@/lib/session";

export const metadata = { title: "Vytvořit účet" };
export default async function AuthPage() {
  if (await getCurrentUser()) redirect("/learn");
  return <AuthLayout title="Vytvořit účet" description="Ulož si své místo a rozvíjej znalosti." footer={<>Už se s námi učíš? <Link href="/sign-in" className="font-semibold text-ql-link underline underline-offset-4">Přihlásit se</Link></>}><SignUpForm /></AuthLayout>;
}
