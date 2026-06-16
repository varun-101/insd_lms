"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Power, PowerOff } from "lucide-react";
import type { OrgStatus } from "@prisma/client";
import { setOrgStatus } from "@/lib/actions/platform";
import { Button } from "@/components/ui/button";

export function OrgStatusButton({
  orgId,
  status,
}: {
  orgId: string;
  status: OrgStatus;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const next: OrgStatus = status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";

  function toggle() {
    start(async () => {
      await setOrgStatus(orgId, next);
      toast.success(next === "ACTIVE" ? "Organization activated" : "Organization suspended");
      router.refresh();
    });
  }

  return (
    <Button
      variant={status === "ACTIVE" ? "outline" : "default"}
      size="sm"
      onClick={toggle}
      disabled={pending}
    >
      {status === "ACTIVE" ? (
        <>
          <PowerOff className="size-4" /> Suspend
        </>
      ) : (
        <>
          <Power className="size-4" /> Activate
        </>
      )}
    </Button>
  );
}
