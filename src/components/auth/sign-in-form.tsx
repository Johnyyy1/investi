"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function SignInForm() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  async function onSubmit(formData: FormData) {
    setIsSubmitting(true); setErrorMessage(undefined);
    const { error } = await authClient.signIn.email({ email: String(formData.get("email") ?? ""), password: String(formData.get("password") ?? ""), callbackURL: "/dashboard" });
    if (error) { setErrorMessage(error.message ?? "We could not sign you in. Please try again."); setIsSubmitting(false); return; }
    router.push("/dashboard"); router.refresh();
  }
  return <form action={onSubmit} className="mt-9 space-y-5">
    <label className="block space-y-2"><span className="text-sm font-medium">Email</span><input className="h-11 w-full border border-neutral-300 bg-white px-3 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-950" type="email" name="email" autoComplete="email" placeholder="you@example.com" required /></label>
    <label className="block space-y-2"><span className="text-sm font-medium">Password</span><input className="h-11 w-full border border-neutral-300 bg-white px-3 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-950" type="password" name="password" autoComplete="current-password" required /></label>
    {errorMessage ? <p className="text-sm text-red-700" role="alert">{errorMessage}</p> : null}
    <Button className="w-full" type="submit" disabled={isSubmitting}>{isSubmitting ? "Signing in…" : "Sign in"}</Button>
  </form>;
}
