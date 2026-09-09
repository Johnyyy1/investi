"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LearningButton } from "@/components/learning/learning-button";
import { TextInput } from "@/components/learning/text-input";
import { authClient } from "@/lib/auth-client";
import { getAuthErrorMessage } from "@/lib/auth-error";

export function SignInForm() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  async function onSubmit(formData: FormData) {
    setIsSubmitting(true); setErrorMessage(undefined);
    try {
    const { error } = await authClient.signIn.email({ email: String(formData.get("email") ?? ""), password: String(formData.get("password") ?? ""), callbackURL: "/dashboard" });
    if (error) { setErrorMessage(getAuthErrorMessage(error, "We could not sign you in. Please try again.")); setIsSubmitting(false); return; }
    router.replace("/dashboard"); router.refresh();
    } catch { setErrorMessage("We could not connect. Please try again."); }
    finally { setIsSubmitting(false); }
  }
  return <form action={onSubmit} className="mt-9 space-y-5">
    <TextInput label="Email" type="email" name="email" autoComplete="email" placeholder="you@example.com" required />
    <TextInput label="Password" type="password" name="password" autoComplete="current-password" required />
    {errorMessage ? <p className="text-ql-small text-ql-danger-ink" role="alert">{errorMessage}</p> : null}
    <LearningButton className="w-full" type="submit" loading={isSubmitting}>{isSubmitting ? "Signing in…" : "Sign in"}</LearningButton>
  </form>;
}
