"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, Loader2, LogIn } from "lucide-react";
import { authenticate } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SubmitButton({ busy }: { busy?: boolean }) {
  const { pending } = useFormStatus();
  const loading = pending || busy;
  return (
    <Button type="submit" disabled={loading} className="h-11 w-full text-sm">
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <LogIn className="size-4" />
      )}
      {loading ? "Signing in…" : "Sign in"}
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(authenticate, undefined);

  useEffect(() => {
    if (state?.ok) {
      // Full-document navigation so the dashboard renders fresh with the
      // session cookie that signIn just set — avoids the stale soft-nav
      // where the URL changes but the page doesn't load until a manual reload.
      window.location.assign("/dashboard");
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@college.edu"
          required
          className="h-11"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
          className="h-11"
        />
      </div>

      {state?.error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          {state.error}
        </div>
      )}

      <SubmitButton busy={state?.ok} />
    </form>
  );
}
