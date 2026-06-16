"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  GraduationCap,
  Menu,
  LayoutDashboard,
  BookOpen,
  Video,
  PlayCircle,
  Megaphone,
  Users,
  Settings,
  CalendarCheck,
  type LucideIcon,
} from "lucide-react";
import type { NavIcon, NavItem } from "@/lib/nav";
import type { SessionMembership } from "@/types/next-auth";

const navIcons: Record<NavIcon, LucideIcon> = {
  LayoutDashboard,
  BookOpen,
  Video,
  PlayCircle,
  Megaphone,
  Users,
  GraduationCap,
  Settings,
  CalendarCheck,
};
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { UserMenu } from "@/components/app/user-menu";

function isActive(pathname: string, href: string, home: string) {
  if (href === home) return pathname === home;
  return pathname === href || pathname.startsWith(href + "/");
}

function NavLinks({
  items,
  home,
  onNavigate,
}: {
  items: NavItem[];
  home: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active = isActive(pathname, item.href, home);
        const Icon = navIcons[item.icon];
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-secondary text-secondary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon
              className={cn("size-4.5", active && "text-brand")}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2 px-2">
      <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[var(--shadow-soft)]">
        <GraduationCap className="size-5" />
      </span>
      <span className="font-heading text-lg font-bold tracking-tight">Verdant</span>
    </Link>
  );
}

export function AppShell({
  user,
  nav,
  home,
  roleLabel,
  orgName,
  orgs,
  activeOrgId,
  children,
}: {
  user: { name: string; email: string };
  nav: NavItem[];
  home: string;
  roleLabel: string;
  orgName: string;
  orgs: SessionMembership[];
  activeOrgId: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-dvh bg-background">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-border/60 bg-sidebar p-3 lg:flex">
        <div className="py-3">
          <Brand />
        </div>
        <div className="mt-2 flex-1 overflow-y-auto">
          <NavLinks items={nav} home={home} />
        </div>
        <div className="border-t border-border/60 pt-2">
          <UserMenu name={user.name} email={user.email} roleLabel={roleLabel} orgName={orgName} orgs={orgs} activeOrgId={activeOrgId} />
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border/60 bg-background/80 px-4 backdrop-blur-md lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-3">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="py-3">
                <Brand />
              </div>
              <div className="mt-2 flex-1">
                <NavLinks items={nav} home={home} onNavigate={() => setOpen(false)} />
              </div>
              <div className="mt-auto border-t border-border/60 pt-2">
                <UserMenu name={user.name} email={user.email} roleLabel={roleLabel} orgName={orgName} orgs={orgs} activeOrgId={activeOrgId} />
              </div>
            </SheetContent>
          </Sheet>
          <Brand />
        </header>

        <main className="flex-1 p-5 sm:p-7 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
