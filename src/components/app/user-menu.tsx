"use client";

import { LogOut, Check, Building2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutAction } from "@/lib/actions/auth";
import { switchActiveOrg } from "@/lib/actions/org";
import type { SessionMembership } from "@/types/next-auth";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function UserMenu({
  name,
  email,
  roleLabel,
  orgName,
  orgs,
  activeOrgId,
}: {
  name: string;
  email: string;
  roleLabel: string;
  orgName: string;
  orgs: SessionMembership[];
  activeOrgId: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50">
        <Avatar className="size-9">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
            {initials(name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {orgName ? `${orgName} · ${roleLabel}` : roleLabel}
          </p>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-medium">{name}</p>
          <p className="truncate text-xs text-muted-foreground">{email}</p>
        </DropdownMenuLabel>

        {orgs.length > 1 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Building2 className="size-3.5" /> Organizations
            </DropdownMenuLabel>
            {orgs.map((o) => (
              <form key={o.orgId} action={switchActiveOrg.bind(null, o.orgId)}>
                <DropdownMenuItem asChild>
                  <button
                    type="submit"
                    className="w-full justify-between"
                    disabled={o.orgId === activeOrgId}
                  >
                    <span className="truncate">{o.orgName}</span>
                    {o.orgId === activeOrgId && <Check className="size-4" />}
                  </button>
                </DropdownMenuItem>
              </form>
            ))}
          </>
        )}

        <DropdownMenuSeparator />
        <form action={signOutAction} className="w-full">
          <DropdownMenuItem asChild variant="destructive">
            <button type="submit" className="w-full">
              <LogOut className="size-4" />
              Sign out
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
