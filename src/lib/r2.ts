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
  });
}

declare global {
  // eslint-disable-next-line no-var
  var __voicesR2Client: S3Client | undefined;
}

function getClient(): S3Client {
  if (!globalThis.__voicesR2Client) {
    globalThis.__voicesR2Client = makeClient();
  }
  return globalThis.__voicesR2Client;
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

/** Prefer the public base URL when configured, else a signed URL. */
export async function publicUrl(key: string): Promise<string> {
  const base = process.env.R2_PUBLIC_BASE_URL;
  if (base) return `${base.replace(/\/$/, "")}/${key}`;
  return getSignedDownloadUrl(key);
}

export function keyFor(prefix: "originals" | "greetings" | "ambients" | "previews", filename: string): string {
  return `${prefix}/${filename}`;
}
