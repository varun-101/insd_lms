"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Video, HardDrive, AlertCircle } from "lucide-react";
import { updateOrgIntegrations } from "@/lib/actions/platform";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/forms/submit-button";

export type IntegrationsOrg = {
  id: string;
  zoomAccountId: string | null;
  zoomClientId: string | null;
  hasZoomSecret: boolean;
  hasZoomWebhookSecret: boolean;
  s3Endpoint: string | null;
  s3Region: string | null;
  s3Bucket: string | null;
  s3AccessKey: string | null;
  hasS3Secret: boolean;
  s3PublicUrl: string | null;
};

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        autoComplete="off"
      />
    </div>
  );
}

export function IntegrationsForm({ org }: { org: IntegrationsOrg }) {
  const [error, setError] = useState<string>();
  const router = useRouter();

  const webhookPath = `/api/zoom/webhook/${org.id}`;
  const secretPlaceholder = (set: boolean) =>
    set ? "•••••••• (leave blank to keep)" : "";

  async function handle(formData: FormData) {
    setError(undefined);
    const res = await updateOrgIntegrations({}, formData);
    if (res.ok) {
      toast.success("Integrations saved");
      router.refresh();
    } else {
      setError(res.error);
    }
  }

  return (
    <form action={handle} className="space-y-5">
      <input type="hidden" name="orgId" value={org.id} />

      {/* Zoom */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Video className="size-4" /> Zoom (Server-to-Server OAuth)
          </CardTitle>
          <CardDescription>
            Webhook URL for this org:{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">{webhookPath}</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Account ID" name="zoomAccountId" defaultValue={org.zoomAccountId} />
          <Field label="Client ID" name="zoomClientId" defaultValue={org.zoomClientId} />
          <Field
            label="Client Secret"
            name="zoomClientSecret"
            type="password"
            placeholder={secretPlaceholder(org.hasZoomSecret)}
          />
          <Field
            label="Webhook Secret Token"
            name="zoomWebhookSecret"
            type="password"
            placeholder={secretPlaceholder(org.hasZoomWebhookSecret)}
          />
        </CardContent>
      </Card>

      {/* S3 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <HardDrive className="size-4" /> Object storage (S3-compatible)
          </CardTitle>
          <CardDescription>
            Recordings and uploads are stored here, namespaced under{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">org/{org.id}/</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Bucket" name="s3Bucket" defaultValue={org.s3Bucket} />
          <Field label="Region" name="s3Region" defaultValue={org.s3Region} placeholder="us-east-1" />
          <Field
            label="Endpoint (leave blank for AWS)"
            name="s3Endpoint"
            defaultValue={org.s3Endpoint}
            placeholder="https://s3.amazonaws.com"
          />
          <Field label="Public base URL" name="s3PublicUrl" defaultValue={org.s3PublicUrl} />
          <Field label="Access Key ID" name="s3AccessKey" defaultValue={org.s3AccessKey} />
          <Field
            label="Secret Access Key"
            name="s3SecretKey"
            type="password"
            placeholder={secretPlaceholder(org.hasS3Secret)}
          />
        </CardContent>
      </Card>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <SubmitButton>Save integrations</SubmitButton>
      </div>
    </form>
  );
}
