"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, AlertCircle } from "lucide-react";
import { createOrganization } from "@/lib/actions/platform";
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

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function CreateOrgDialog() {
  const [open, setOpen] = useState(false);
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string>();
  const router = useRouter();

  async function handle(formData: FormData) {
    setError(undefined);
    const res = await createOrganization({}, formData);
    if (res.ok) {
      toast.success("Organization created");
      setOpen(false);
      setSlug("");
      router.refresh();
    } else {
      setError(res.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" /> New organization
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create organization</DialogTitle>
          <DialogDescription>
            Each organization is an isolated tenant with its own users and data.
          </DialogDescription>
        </DialogHeader>
        <form action={handle} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              required
              onChange={(e) => setSlug((s) => (s ? s : slugify(e.target.value)))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              name="slug"
              required
              value={slug}
              onChange={(e) => setSlug(slugify(e.target.value))}
              placeholder="acme-university"
            />
            <p className="text-xs text-muted-foreground">
              Lowercase letters, numbers and hyphens. Used in the Zoom webhook URL.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              {error}
            </div>
          )}

          <DialogFooter>
            <SubmitButton>Create organization</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
