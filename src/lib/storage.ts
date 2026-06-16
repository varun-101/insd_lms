import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { Readable } from "node:stream";
import type { Organization } from "@prisma/client";
import { decrypt } from "@/lib/crypto";

/**
 * Per-org object storage. Each organization configures its own S3-compatible
 * bucket; objects are additionally namespaced under `org/<orgId>/...` so a
 * shared bucket would still keep tenants isolated.
 */
export type OrgStorage = {
  client: S3Client;
  bucket: string;
  publicBase: string;
  /** Prefix an object key with the org namespace. */
  key: (path: string) => string;
  publicUrl: (key: string) => string;
  putObject: (
    key: string,
    body: Buffer | Uint8Array | Readable,
    contentType?: string,
    contentLength?: number,
  ) => Promise<string>;
  deleteObject: (key: string) => Promise<void>;
  presignedUploadUrl: (key: string, contentType: string, expiresIn?: number) => Promise<string>;
  presignedDownloadUrl: (key: string, expiresIn?: number) => Promise<string>;
};

type StorageConfig = Pick<
  Organization,
  | "id"
  | "s3Endpoint"
  | "s3Region"
  | "s3Bucket"
  | "s3AccessKey"
  | "s3SecretKeyEnc"
  | "s3PublicUrl"
>;

/** True if the org has the minimum S3 config needed to build a client. */
export function storageConfigured(org: StorageConfig): boolean {
  return !!(org.s3Bucket && org.s3AccessKey && org.s3SecretKeyEnc);
}

/** Build a storage helper bound to one organization, or null if unconfigured. */
export function storageFor(org: StorageConfig): OrgStorage | null {
  if (!storageConfigured(org)) return null;

  const endpoint = org.s3Endpoint ?? undefined;
  const region = org.s3Region ?? "us-east-1";
  const bucket = org.s3Bucket!;
  const publicBase = org.s3PublicUrl ?? `${endpoint ?? ""}/${bucket}`;

  const client = new S3Client({
    endpoint,
    region,
    // Path-style is required for MinIO and harmless for AWS in most setups.
    forcePathStyle: !!endpoint,
    credentials: {
      accessKeyId: org.s3AccessKey!,
      secretAccessKey: decrypt(org.s3SecretKeyEnc!),
    },
  });

  const key = (path: string) => `org/${org.id}/${path}`;
  const publicUrl = (k: string) => `${publicBase}/${k}`;

  return {
    client,
    bucket,
    publicBase,
    key,
    publicUrl,
    async putObject(k, body, contentType, contentLength) {
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: k,
          Body: body,
          ContentType: contentType,
          ContentLength: contentLength,
        }),
      );
      return k;
    },
    async deleteObject(k) {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: k }));
    },
    presignedUploadUrl(k, contentType, expiresIn = 900) {
      return getSignedUrl(
        client,
        new PutObjectCommand({ Bucket: bucket, Key: k, ContentType: contentType }),
        { expiresIn },
      );
    },
    presignedDownloadUrl(k, expiresIn = 3600) {
      return getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: k }), {
        expiresIn,
      });
    },
  };
}
