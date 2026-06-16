"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { GraduationCap, AlertCircle } from "lucide-react";
import { enrollStudent } from "@/lib/actions/courses";
import { Button } from "@/components/ui/button";
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

type Option = { id: string; label: string };

export function EnrollDialog({
  students,
  courses,
}: {
  students: Option[];
  courses: Option[];
}) {
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [error, setError] = useState<string>();
  const router = useRouter();

  async function handle(formData: FormData) {
    setError(undefined);
    const res = await enrollStudent({}, formData);
    if (res.ok) {
      toast.success("Student enrolled");
      setOpen(false);
      router.refresh();
    } else {
      setError(res.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={students.length === 0 || courses.length === 0}>
          <GraduationCap className="size-4" /> Enrol student
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enrol a student</DialogTitle>
          <DialogDescription>Add a student to a course.</DialogDescription>
        </DialogHeader>
        <form action={handle} className="space-y-4">
          <div className="space-y-2">
            <Label>Student</Label>
            <input type="hidden" name="userId" value={userId} />
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a student" />
              </SelectTrigger>
              <SelectContent>
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Course</Label>
            <input type="hidden" name="courseId" value={courseId} />
            <Select value={courseId} onValueChange={setCourseId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              {error}
            </div>
          )}

          <DialogFooter>
            <SubmitButton>Enrol</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
