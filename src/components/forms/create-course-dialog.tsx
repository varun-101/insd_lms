"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, AlertCircle } from "lucide-react";
import { createCourse } from "@/lib/actions/courses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

export function CreateCourseDialog() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const router = useRouter();

  async function handle(formData: FormData) {
    setError(undefined);
    const res = await createCourse({}, formData);
    if (res.ok) {
      toast.success("Course created");
      setOpen(false);
      router.refresh();
    } else {
      setError(res.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" /> New course
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a course</DialogTitle>
          <DialogDescription>
            Students you enrol will see this course on their dashboard.
          </DialogDescription>
        </DialogHeader>
        <form action={handle} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input id="code" name="code" placeholder="CS201" required />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" placeholder="Data Structures" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="term">Term (optional)</Label>
            <Input id="term" name="term" placeholder="Autumn 2026" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea id="description" name="description" rows={3} />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              {error}
            </div>
          )}

          <DialogFooter>
            <SubmitButton>Create course</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
