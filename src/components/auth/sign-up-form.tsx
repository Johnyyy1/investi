"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LearningButton } from "@/components/learning/learning-button";
import { TextInput } from "@/components/learning/text-input";
import { authClient } from "@/lib/auth-client";
import { getAuthErrorMessage } from "@/lib/auth-error";

export function SignUpForm() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(formData: FormData) {
    setIsSubmitting(true); setErrorMessage(undefined);
    try {
    const { error } = await authClient.signUp.email({
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      callbackURL: "/onboarding",
    });
    if (error) { setErrorMessage(getAuthErrorMessage(error, "We could not create your account. Please try again.")); setIsSubmitting(false); return; }
    router.replace("/onboarding"); router.refresh();
    } catch { setErrorMessage("We could not connect. Please try again."); }
    finally { setIsSubmitting(false); }
  }

  return <form action={onSubmit} className="mt-9 space-y-5">
    <TextInput label="Name" type="text" name="name" autoComplete="name" placeholder="Your name" required />
    <TextInput label="Email" type="email" name="email" autoComplete="email" placeholder="you@example.com" required />
    <TextInput label="Password" type="password" name="password" autoComplete="new-password" minLength={8} required hint="Use at least 8 characters." />
    {errorMessage ? <p className="text-ql-small text-ql-danger-ink" role="alert">{errorMessage}</p> : null}
    <LearningButton className="w-full" type="submit" loading={isSubmitting}>{isSubmitting ? "Creating account…" : "Create account"}</LearningButton>
  </form>;
}
