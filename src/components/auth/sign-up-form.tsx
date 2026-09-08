"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { getAuthErrorMessage } from "@/lib/auth-error";

export function SignUpForm() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(formData: FormData) {
    setIsSubmitting(true); setErrorMessage(undefined);
    const { error } = await authClient.signUp.email({
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      callbackURL: "/dashboard",
    });
    if (error) { setErrorMessage(getAuthErrorMessage(error, "We could not create your account. Please try again.")); setIsSubmitting(false); return; }
    router.replace("/dashboard"); router.refresh();
  }

  return <form action={onSubmit} className="mt-9 space-y-5">
    <label className="block space-y-2"><span className="text-sm font-medium">Name</span><input className="h-11 w-full border border-neutral-300 bg-white px-3 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-950" type="text" name="name" autoComplete="name" placeholder="Your name" required /></label>
    <label className="block space-y-2"><span className="text-sm font-medium">Email</span><input className="h-11 w-full border border-neutral-300 bg-white px-3 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-950" type="email" name="email" autoComplete="email" placeholder="you@example.com" required /></label>
    <label className="block space-y-2"><span className="text-sm font-medium">Password</span><input className="h-11 w-full border border-neutral-300 bg-white px-3 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-950" type="password" name="password" autoComplete="new-password" minLength={8} required /></label>
    {errorMessage ? <p className="text-sm text-red-700" role="alert">{errorMessage}</p> : null}
    <Button className="w-full" type="submit" disabled={isSubmitting}>{isSubmitting ? "Creating account…" : "Create account"}</Button>
  </form>;
}
