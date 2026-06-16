import crypto from "node:crypto";

/**
 * Symmetric encryption for secrets stored at rest (per-org Zoom/S3 credentials).
 *
 * Format: `v1:<iv>:<authTag>:<ciphertext>` (all base64). AES-256-GCM with a
 * 32-byte key supplied via APP_ENCRYPTION_KEY (base64 or hex, or any string we
 * hash down to 32 bytes as a fallback for dev).
 */

const VERSION = "v1";

function key(): Buffer {
  const raw = process.env.APP_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "APP_ENCRYPTION_KEY is not set. Generate one with: openssl rand -base64 32",
    );
  }
  // Accept a proper 32-byte base64/hex key; otherwise derive 32 bytes via SHA-256
  // so a human-typed value still works in development.
  for (const enc of ["base64", "hex"] as const) {
    try {
      const buf = Buffer.from(raw, enc);
      if (buf.length === 32) return buf;
    } catch {
      // try next encoding
    }
  }
  return crypto.createHash("sha256").update(raw).digest();
}

/** Encrypt a UTF-8 string. Returns the versioned, base64-packed token. */
export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return [
    VERSION,
    iv.toString("base64"),
    authTag.toString("base64"),
    ciphertext.toString("base64"),
  ].join(":");
}

/** Decrypt a token produced by {@link encrypt}. */
export function decrypt(token: string): string {
  const [version, ivB64, tagB64, dataB64] = token.split(":");
  if (version !== VERSION || !ivB64 || !tagB64 || !dataB64) {
    throw new Error("Invalid ciphertext format.");
  }
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key(),
    Buffer.from(ivB64, "base64"),
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

/** Encrypt unless the value is empty/undefined (returns null for storage). */
export function encryptOptional(value: string | null | undefined): string | null {
  return value ? encrypt(value) : null;
}

/** Decrypt unless the stored value is null/empty. */
export function decryptOptional(value: string | null | undefined): string | null {
  return value ? decrypt(value) : null;
}
