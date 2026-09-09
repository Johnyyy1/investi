import Link from "next/link";
import { redirect } from "next/navigation";
import { SignInForm } from "@/components/auth/sign-in-form";
import { AuthLayout } from "@/components/auth/auth-layout";
import { getCurrentUser } from "@/lib/session";

export const metadata = { title: "Sign in" };
export default async function AuthPage() {
  if (await getCurrentUser()) redirect("/dashboard");
  return <AuthLayout title="Welcome back" description="Sign in to pick up where you left off." footer={<>New to investi? <Link href="/sign-up" className="font-semibold text-ql-link underline underline-offset-4">Create an account</Link></>}><SignInForm /></AuthLayout>;
}
