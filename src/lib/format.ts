const dateTime = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const dateOnly = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const timeOnly = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

export const formatDateTime = (d: Date | string) => dateTime.format(new Date(d));
export const formatDate = (d: Date | string) => dateOnly.format(new Date(d));
export const formatTime = (d: Date | string) => timeOnly.format(new Date(d));

export function fromNow(d: Date | string) {
  const date = new Date(d);
  const diff = date.getTime() - Date.now();
  const abs = Math.abs(diff);
  const mins = Math.round(abs / 60000);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (mins < 60) return rtf.format(Math.round(diff / 60000), "minute");
  const hours = Math.round(abs / 3600000);
  if (hours < 24) return rtf.format(Math.round(diff / 3600000), "hour");
  return rtf.format(Math.round(diff / 86400000), "day");
}
