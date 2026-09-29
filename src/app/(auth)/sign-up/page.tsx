import Link from "next/link";
import { redirect } from "next/navigation";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { AuthLayout } from "@/components/auth/auth-layout";
import { SocialSignIn } from "@/components/auth/social-sign-in";
import { authProviderAvailability } from "@/lib/auth";
import { getSocialAuthErrorMessage } from "@/lib/social-auth-error";
import { getCurrentUser } from "@/lib/session";

export const metadata = { title: "Vytvořit účet" };

export default async function AuthPage({ searchParams }: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  if (await getCurrentUser()) redirect("/learn");
  const { error } = await searchParams;
  const errorCode = Array.isArray(error) ? error[0] : error;
  return (
    <AuthLayout title="Vytvořit účet" description="Ulož si postup a začni se učit podle svého cíle."
      footer={<>Už máš účet? <Link href="/sign-in" className="font-semibold text-ql-link underline underline-offset-4">Přihlásit se</Link></>}>
      <SocialSignIn providers={authProviderAvailability} mode="sign-up" initialError={errorCode !== undefined ? getSocialAuthErrorMessage(errorCode) : undefined} />
      <SignUpForm />
    </AuthLayout>
  );
}
