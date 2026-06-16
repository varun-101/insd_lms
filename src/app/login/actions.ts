"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";

export type LoginState = { error?: string; ok?: boolean } | undefined;

export async function authenticate(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  try {
    // `redirect: false` still sets the session cookie but returns instead of
    // throwing NEXT_REDIRECT. We deliberately avoid the server-action redirect
    // here: in production it triggers a *soft* client navigation that fetches
    // the protected route before the new session cookie is reliably applied,
    // so the URL changes but the page never renders until a manual reload.
    // Instead we report success and let the client do a full navigation.
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    // Re-throw any unexpected errors so Next.js can handle them.
    throw error;
  }
}
