import crypto from "node:crypto";
import type { Organization } from "@prisma/client";
import { redis } from "@/lib/redis";
import { decrypt } from "@/lib/crypto";

const ZOOM_OAUTH = "https://zoom.us/oauth/token";
const ZOOM_API = "https://api.zoom.us/v2";

/** Resolved Zoom Server-to-Server OAuth credentials for one organization. */
export type ZoomCreds = {
  accountId: string;
  clientId: string;
  clientSecret: string;
};

/**
 * Resolve an org's Zoom credentials (decrypting the secret), or null if the org
 * has not configured Zoom yet.
 */
export function zoomCredsForOrg(
  org: Pick<
    Organization,
    "zoomAccountId" | "zoomClientId" | "zoomClientSecretEnc"
  >,
): ZoomCreds | null {
  if (!org.zoomAccountId || !org.zoomClientId || !org.zoomClientSecretEnc) {
    return null;
  }
  return {
    accountId: org.zoomAccountId,
    clientId: org.zoomClientId,
    clientSecret: decrypt(org.zoomClientSecretEnc),
  };
}

/** Decrypt an org's Zoom webhook secret token, or null if not configured. */
export function zoomWebhookSecretForOrg(
  org: Pick<Organization, "zoomWebhookSecretEnc">,
): string | null {
  return org.zoomWebhookSecretEnc ? decrypt(org.zoomWebhookSecretEnc) : null;
}

/** Server-to-Server OAuth access token, cached in Redis until shortly before expiry. */
export async function getAccessToken(creds: ZoomCreds): Promise<string> {
  const cacheKey = `zoom:access_token:${creds.clientId}`;
  const cached = await redis.get(cacheKey);
  if (cached) return cached;

  const basic = Buffer.from(`${creds.clientId}:${creds.clientSecret}`).toString("base64");
  const res = await fetch(
    `${ZOOM_OAUTH}?grant_type=account_credentials&account_id=${creds.accountId}`,
    { method: "POST", headers: { Authorization: `Basic ${basic}` } },
  );
  if (!res.ok) {
    throw new Error(`Zoom token request failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  await redis.set(cacheKey, data.access_token, "EX", Math.max(60, data.expires_in - 60));
  return data.access_token;
}

async function zoomFetch<T>(creds: ZoomCreds, path: string, init?: RequestInit): Promise<T> {
  const token = await getAccessToken(creds);
  const res = await fetch(`${ZOOM_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    throw new Error(`Zoom API ${path} failed: ${res.status} ${await res.text()}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// ---- Meetings ----

export type ZoomMeeting = {
  id: number;
  join_url: string;
  start_url: string;
  password?: string;
};

export async function createMeeting(
  creds: ZoomCreds,
  zoomUserId: string,
  opts: { topic: string; startTime: Date; durationMins: number; agenda?: string },
): Promise<ZoomMeeting> {
  return zoomFetch<ZoomMeeting>(creds, `/users/${encodeURIComponent(zoomUserId)}/meetings`, {
    method: "POST",
    body: JSON.stringify({
      topic: opts.topic,
      type: 2, // scheduled
      start_time: opts.startTime.toISOString(),
      duration: opts.durationMins,
      agenda: opts.agenda,
      settings: {
        join_before_host: false,
        waiting_room: true,
        auto_recording: "cloud", // enables the recordings pipeline
        approval_type: 2,
      },
    }),
  });
}

export async function deleteMeeting(creds: ZoomCreds, meetingId: string) {
  return zoomFetch<void>(creds, `/meetings/${meetingId}`, { method: "DELETE" });
}

// ---- Recordings ----

export type ZoomRecordingFile = {
  id: string;
  recording_type: string;
  file_type: string;
  file_extension: string;
  file_size: number;
  download_url: string;
  recording_start: string;
  recording_end: string;
};

export type ZoomRecordings = {
  duration: number;
  total_size: number;
  recording_files: ZoomRecordingFile[];
};

export async function getMeetingRecordings(creds: ZoomCreds, meetingId: string) {
  return zoomFetch<ZoomRecordings>(creds, `/meetings/${meetingId}/recordings`);
}

/** Move cloud recordings to trash to free Zoom storage after we've copied them. */
export async function trashMeetingRecordings(creds: ZoomCreds, meetingId: string) {
  return zoomFetch<void>(creds, `/meetings/${meetingId}/recordings?action=trash`, {
    method: "DELETE",
  });
}

/** Fetch a recording file (authenticated) as a web stream for piping to S3. */
export async function fetchRecordingStream(creds: ZoomCreds, downloadUrl: string) {
  const token = await getAccessToken(creds);
  const res = await fetch(`${downloadUrl}?access_token=${token}`);
  if (!res.ok || !res.body) {
    throw new Error(`Recording download failed: ${res.status}`);
  }
  return res;
}

// ---- Reports (attendance backup) ----

export type ZoomParticipant = {
  id?: string;
  name: string;
  user_email?: string;
  join_time: string;
  leave_time: string;
  duration: number;
};

export async function getPastMeetingParticipants(creds: ZoomCreds, meetingId: string) {
  const out: ZoomParticipant[] = [];
  let token: string | undefined;
  do {
    const qs = new URLSearchParams({ page_size: "300" });
    if (token) qs.set("next_page_token", token);
    const data = await zoomFetch<{
      participants: ZoomParticipant[];
      next_page_token?: string;
    }>(creds, `/report/meetings/${meetingId}/participants?${qs}`);
    out.push(...data.participants);
    token = data.next_page_token || undefined;
  } while (token);
  return out;
}

// ---- Webhook verification (per-org secret token) ----

export function verifyWebhookSignature(
  secret: string,
  rawBody: string,
  signature: string | null,
  timestamp: string | null,
): boolean {
  if (!signature || !timestamp) return false;
  const message = `v0:${timestamp}:${rawBody}`;
  const hash = crypto.createHmac("sha256", secret).update(message).digest("hex");
  const expected = `v0=${hash}`;
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

/** Response payload for Zoom's endpoint.url_validation challenge. */
export function urlValidationResponse(secret: string, plainToken: string) {
  const encryptedToken = crypto
    .createHmac("sha256", secret)
    .update(plainToken)
    .digest("hex");
  return { plainToken, encryptedToken };
}
