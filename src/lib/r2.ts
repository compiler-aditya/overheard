import "server-only";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} missing`);
  return v;
}

function makeClient() {
  const accountId = requireEnv("R2_ACCOUNT_ID");
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
    },
    // R2 rejects virtual-host-style signed GETs with 403. Path-style works.
    forcePathStyle: true,
  });
}

declare global {
  var __aurisR2Client: S3Client | undefined;
}

function getClient(): S3Client {
  if (!globalThis.__aurisR2Client) {
    globalThis.__aurisR2Client = makeClient();
  }
  return globalThis.__aurisR2Client;
}

const bucket = () => requireEnv("R2_BUCKET_NAME");

export async function putObject(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
): Promise<void> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

export async function getSignedDownloadUrl(
  key: string,
  expiresSeconds = 3600,
): Promise<string> {
  return getSignedUrl(
    getClient(),
    new GetObjectCommand({ Bucket: bucket(), Key: key }),
    { expiresIn: expiresSeconds },
  );
}

/**
 * Return a URL the browser can GET for a stored object.
 *
 * Uses R2_PUBLIC_BASE_URL only when it's a real public host (custom domain
 * or r2.dev subdomain). The `*.r2.cloudflarestorage.com` endpoint is the
 * S3-compatible API — it requires AWS v4 signing and 400s without it,
 * so we detect that case and fall back to short-lived signed GET URLs.
 */
export async function publicUrl(key: string): Promise<string> {
  const base = process.env.R2_PUBLIC_BASE_URL;
  if (base && !base.includes("r2.cloudflarestorage.com")) {
    return `${base.replace(/\/$/, "")}/${key}`;
  }
  return getSignedDownloadUrl(key);
}

export function keyFor(prefix: "originals" | "greetings" | "ambients" | "previews", filename: string): string {
  return `${prefix}/${filename}`;
}
