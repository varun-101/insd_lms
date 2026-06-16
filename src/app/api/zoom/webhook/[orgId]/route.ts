import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  verifyWebhookSignature,
  urlValidationResponse,
  zoomWebhookSecretForOrg,
} from "@/lib/zoom";
import { recordingsQueue, attendanceQueue } from "@/lib/queue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ZoomEvent = {
  event: string;
  payload: {
    plainToken?: string;
    object?: {
      id?: string | number;
      uuid?: string;
    };
  };
};

// Per-org webhook endpoint: each organization configures its Zoom app to POST
// to /api/zoom/webhook/<orgId>, so we know which org's secret to verify against
// before trusting any payload.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await params;

  const org = await db.organization.findUnique({
    where: { id: orgId },
    select: { id: true, status: true, zoomWebhookSecretEnc: true },
  });
  if (!org || org.status !== "ACTIVE") {
    return NextResponse.json({ error: "Unknown organization" }, { status: 404 });
  }

  const secret = zoomWebhookSecretForOrg(org);
  if (!secret) {
    return NextResponse.json({ error: "Zoom webhook not configured" }, { status: 400 });
  }

  const rawBody = await req.text();
  let body: ZoomEvent;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // 1. Zoom endpoint validation handshake (uses this org's secret).
  if (body.event === "endpoint.url_validation" && body.payload.plainToken) {
    return NextResponse.json(urlValidationResponse(secret, body.payload.plainToken));
  }

  // 2. Verify the request signature on all other events.
  const signature = req.headers.get("x-zm-signature");
  const timestamp = req.headers.get("x-zm-request-timestamp");
  if (!verifyWebhookSignature(secret, rawBody, signature, timestamp)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const meetingId = body.payload.object?.id?.toString();

  switch (body.event) {
    case "meeting.started":
      if (meetingId) {
        await db.liveClass.updateMany({
          where: { organizationId: orgId, zoomMeetingId: meetingId },
          data: { status: "LIVE", startedAt: new Date() },
        });
      }
      break;

    case "meeting.ended":
      if (meetingId) {
        await db.liveClass.updateMany({
          where: { organizationId: orgId, zoomMeetingId: meetingId },
          data: { status: "ENDED", endedAt: new Date() },
        });
        // Reconcile attendance from the Zoom report (give Zoom a moment to settle).
        await attendanceQueue().add(
          "finalize",
          { type: "finalize", orgId, meetingId },
          { delay: 60_000 },
        );
      }
      break;

    case "recording.completed":
      if (meetingId) {
        await recordingsQueue().add("download", { type: "download", orgId, meetingId });
      }
      break;

    default:
      // Ignore other events.
      break;
  }

  return NextResponse.json({ received: true });
}
