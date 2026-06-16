import Link from "next/link";
import type { Metadata } from "next";
import { GraduationCap, PlayCircle, Video, BarChart3 } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-mint-wash bg-secondary/40 p-10 lg:flex">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[var(--shadow-soft)]">
            <GraduationCap className="size-5" />
          </span>
          <span className="font-heading text-xl font-bold tracking-tight">
            Verdant
          </span>
        </Link>

        <div className="max-w-md">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-balance">
            Your campus, <span className="text-gradient-brand">beautifully online</span>
          </h2>
          <p className="mt-3 text-muted-foreground">
            Live classes, recordings and courses — all in one calm, modern place.
          </p>

          <div className="mt-8 space-y-3">
            {[
              { icon: Video, label: "One-click live classes" },
              { icon: PlayCircle, label: "Auto-saved recordings" },
              { icon: BarChart3, label: "Attendance & insights" },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-xl bg-card text-brand shadow-[var(--shadow-soft)]">
                  <f.icon className="size-4.5" />
                </span>
                <span className="text-sm font-medium">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Verdant LMS
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <GraduationCap className="size-5" />
            </span>
            <span className="font-heading text-lg font-bold">Verdant</span>
          </Link>

          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Welcome back
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Sign in to continue to your dashboard.
          </p>

          <div className="mt-8">
            <LoginForm />
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Trouble signing in? Contact your college administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
