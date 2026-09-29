import Link from "next/link";
import { redirect } from "next/navigation";
import { SignInForm } from "@/components/auth/sign-in-form";
import { AuthLayout } from "@/components/auth/auth-layout";
import { SocialSignIn } from "@/components/auth/social-sign-in";
import { authProviderAvailability } from "@/lib/auth";
import { getSocialAuthErrorMessage } from "@/lib/social-auth-error";
import { getCurrentUser } from "@/lib/session";

export const metadata = { title: "Přihlášení" };

export default async function AuthPage({ searchParams }: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  if (await getCurrentUser()) redirect("/learn");
  const { error } = await searchParams;
  const errorCode = Array.isArray(error) ? error[0] : error;
  return (
    <AuthLayout title="Vítej zpět" description="Přihlas se a naváž tam, kde jsi skončil."
      footer={<>Jsi v investi poprvé? <Link href="/sign-up" className="font-semibold text-ql-link underline underline-offset-4">Vytvořit účet</Link></>}>
      <SocialSignIn providers={authProviderAvailability} mode="sign-in" initialError={errorCode !== undefined ? getSocialAuthErrorMessage(errorCode) : undefined} />
      <SignInForm />
    </AuthLayout>
  );
}
