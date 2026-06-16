import { PlayCircle } from "lucide-react";
import { formatDate } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Recording = {
  id: string;
  title: string;
  recordedAt: Date | null;
  durationMins: number | null;
  playUrl: string | null;
  course: { code: string; title: string };
};

export function RecordingsGrid({ recordings }: { recordings: Recording[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {recordings.map((r) => (
        <a
          key={r.id}
          href={r.playUrl ?? "#"}
          target="_blank"
          rel="noreferrer"
          className="group"
        >
          <Card className="h-full gap-0 overflow-hidden p-0 transition-shadow hover:shadow-[var(--shadow-lift)]">
            <div className="relative flex aspect-video items-center justify-center bg-gradient-to-br from-secondary to-card">
              <PlayCircle className="size-12 text-brand transition-transform group-hover:scale-110" />
              {r.durationMins != null && (
                <span className="absolute right-2 bottom-2 rounded-md bg-foreground/80 px-1.5 py-0.5 text-xs font-medium text-background">
                  {r.durationMins} min
                </span>
              )}
            </div>
            <div className="space-y-2 p-4">
              <Badge variant="secondary">{r.course.code}</Badge>
              <h3 className="line-clamp-1 font-medium">{r.title}</h3>
              {r.recordedAt && (
                <p className="text-xs text-muted-foreground">
                  {formatDate(r.recordedAt)}
                </p>
              )}
            </div>
          </Card>
        </a>
      ))}
    </div>
  );
}
