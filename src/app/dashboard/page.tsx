import { redirect } from "next/navigation";
import { requireUser, homeFor } from "@/lib/session";

// Role router: sends each user to their own dashboard home (or the platform
// console for platform operators).
export default async function DashboardRouter() {
  const user = await requireUser();
  redirect(homeFor(user));
}
