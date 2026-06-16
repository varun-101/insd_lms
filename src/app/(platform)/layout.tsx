import Link from "next/link";
import { ShieldCheck, LogOut } from "lucide-react";
import { requirePlatformAdmin } from "@/lib/session";
import { signOutAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requirePlatformAdmin();

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
          <Link href="/platform" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[var(--shadow-soft)]">
              <ShieldCheck className="size-5" />
            </span>
            <span className="font-heading text-lg font-bold tracking-tight">
              Verdant Platform
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {user.email}
            </span>
            <form action={signOutAction}>
              <Button variant="ghost" size="sm" type="submit">
                <LogOut className="size-4" /> Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-8">{children}</main>
    </div>
  );
}
