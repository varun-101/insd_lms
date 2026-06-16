"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, AlertCircle } from "lucide-react";
import { scheduleLiveClass } from "@/lib/actions/liveClasses";
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

type CourseOption = { id: string; code: string; title: string };

export function ScheduleClassDialog({ courses }: { courses: CourseOption[] }) {
  const [open, setOpen] = useState(false);
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const [error, setError] = useState<string>();
  const router = useRouter();

  async function handle(formData: FormData) {
    setError(undefined);
    const res = await scheduleLiveClass({}, formData);
    if (res.ok) {
      toast.success("Live class scheduled");
      setOpen(false);
      router.refresh();
    } else {
      setError(res.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={courses.length === 0}>
          <Plus className="size-4" /> Schedule class
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule a live class</DialogTitle>
          <DialogDescription>
            A Zoom meeting is created and students are notified.
          </DialogDescription>
        </DialogHeader>
        <form action={handle} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="courseId">Course</Label>
            <input type="hidden" name="courseId" value={courseId} />
            <Select value={courseId} onValueChange={setCourseId}>
              <SelectTrigger id="courseId" className="w-full">
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.code} · {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Class title</Label>
            <Input id="title" name="title" placeholder="Recursion deep-dive" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="scheduledStart">Start</Label>
              <Input
                id="scheduledStart"
                name="scheduledStart"
                type="datetime-local"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="durationMins">Duration (mins)</Label>
              <Input
                id="durationMins"
                name="durationMins"
                type="number"
                defaultValue={60}
                min={5}
                max={600}
                required
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              {error}
            </div>
          )}

          <DialogFooter>
            <SubmitButton>Schedule</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
