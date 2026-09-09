import Link from "next/link";
import { redirect } from "next/navigation";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { AuthLayout } from "@/components/auth/auth-layout";
import { getCurrentUser } from "@/lib/session";

export const metadata = { title: "Create account" };
export default async function AuthPage() {
  if (await getCurrentUser()) redirect("/dashboard");
  return <AuthLayout title="Build your investing foundations" description="Create your account to save your learning and return whenever you’re ready." footer={<>Already learning with us? <Link href="/sign-in" className="font-semibold text-ql-link underline underline-offset-4">Sign in</Link></>}><SignUpForm /></AuthLayout>;
}
