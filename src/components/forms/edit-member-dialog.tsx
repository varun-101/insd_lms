"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, AlertCircle, Trash2 } from "lucide-react";
import type { Role, UserStatus } from "@prisma/client";
import { updateMembership, removeMembership } from "@/lib/actions/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/forms/submit-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function EditMemberDialog({
  member,
  isSelf,
}: {
  member: {
    membershipId: string;
    name: string;
    email: string;
    role: Role;
    status: UserStatus;
    zoomUserId: string | null;
  };
  isSelf: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<string>(member.role);
  const [status, setStatus] = useState<string>(
    member.status === "SUSPENDED" ? "SUSPENDED" : "ACTIVE",
  );
  const [error, setError] = useState<string>();
  const router = useRouter();

  async function handleSave(formData: FormData) {
    setError(undefined);
    const res = await updateMembership({}, formData);
    if (res.ok) {
      toast.success("Member updated");
      setOpen(false);
      router.refresh();
    } else {
      setError(res.error);
    }
  }

  async function handleRemove() {
    if (!confirm(`Remove ${member.name} from this organization?`)) return;
    setError(undefined);
    const res = await removeMembership(member.membershipId);
    if (res.ok) {
      toast.success("Member removed");
      setOpen(false);
      router.refresh();
    } else {
      setError(res.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Pencil className="size-4" /> Manage
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage member</DialogTitle>
          <DialogDescription>
            {member.name} · {member.email}
          </DialogDescription>
        </DialogHeader>
        <form action={handleSave} className="space-y-4">
          <input type="hidden" name="membershipId" value={member.membershipId} />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <input type="hidden" name="role" value={role} />
              <Select value={role} onValueChange={setRole} disabled={isSelf}>
                <SelectTrigger id="role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STUDENT">Student</SelectItem>
                  <SelectItem value="TEACHER">Teacher</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <input type="hidden" name="status" value={status} />
              <Select value={status} onValueChange={setStatus} disabled={isSelf}>
                <SelectTrigger id="status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {role === "TEACHER" && (
            <div className="space-y-2">
              <Label htmlFor="zoomUserId">Zoom host email / ID (optional)</Label>
              <Input
                id="zoomUserId"
                name="zoomUserId"
                defaultValue={member.zoomUserId ?? ""}
                placeholder="teacher@college.edu"
              />
            </div>
          )}

          {isSelf && (
            <p className="text-xs text-muted-foreground">
              You can&apos;t change your own role or status.
            </p>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              {error}
            </div>
          )}

          <DialogFooter className="gap-2 sm:justify-between">
            {isSelf ? (
              <span />
            ) : (
              <Button type="button" variant="ghost" onClick={handleRemove} className="text-destructive">
                <Trash2 className="size-4" /> Remove
              </Button>
            )}
            <SubmitButton>Save changes</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
