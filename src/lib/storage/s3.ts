import { createHash, createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

interface PutS3ObjectOptions {
  body: Buffer;
  contentType: string;
  storageKey: string;
}

interface S3Config {
  accessKeyId: string;
  bucketName: string;
  endpoint: string;
  region: string;
  secretAccessKey: string;
  sessionToken?: string;
}

interface AwsCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
}

type S3Operation = "delete" | "download" | "upload";

const DEFAULT_BUCKET_NAME = "eapi-chc-dev-ets-attachments";
const DEFAULT_REGION = "us-east-1";
const SERVICE = "s3";
const TERMINATOR = "aws4_request";
const EMPTY_BODY_HASH = hashHex("");

export class S3StorageError extends Error {
  readonly operation: S3Operation;
  readonly responseText: string;
  readonly status: number;
  readonly statusText: string;

  constructor({
    operation,
    responseText,
    status,
    statusText,
  }: {
    operation: S3Operation;
    responseText: string;
    status: number;
    statusText: string;
  }) {
    super(
      `S3 ${operation} failed with ${status}${
        statusText ? ` ${statusText}` : ""
      }.`,
    );
    this.name = "S3StorageError";
    this.operation = operation;
    this.responseText = responseText;
    this.status = status;
    this.statusText = statusText;
  }
}

export function getS3UploadErrorMessage(error: unknown) {
  if (error instanceof S3StorageError) {
    return `Amazon S3 rejected the upload (${error.status}). Check AWS credentials, bucket permissions, and endpoint settings.`;
  }

  if (
    error instanceof Error &&
    error.message === "S3 storage is not configured."
  ) {
    return "Amazon S3 storage is not configured. Add AWS credentials or set S3_AWS_PROFILE/AWS_PROFILE to a profile in ~/.aws/credentials, then restart the dev server.";
  }

  return "Could not upload file. Try again.";
}

export async function putS3Object({
  body,
  contentType,
  storageKey,
}: PutS3ObjectOptions): Promise<void> {
  const bodyHash = hashHex(body);
  const response = await requestS3Object({
    body,
    bodyHash,
    contentType,
    method: "PUT",
    storageKey,
  });

  if (!response.ok) {
    throw await createS3StorageError("upload", response);
  }
}

export async function getS3Object(storageKey: string): Promise<Response> {
  const response = await requestS3Object({
    bodyHash: EMPTY_BODY_HASH,
    method: "GET",
    storageKey,
  });

  if (!response.ok) {
    throw await createS3StorageError("download", response);
  }

  return response;
}

export async function deleteS3Object(storageKey: string): Promise<void> {
  const response = await requestS3Object({
    bodyHash: EMPTY_BODY_HASH,
    method: "DELETE",
    storageKey,
  });

  if (!response.ok && response.status !== 404) {
    throw await createS3StorageError("delete", response);
  }
}

async function createS3StorageError(operation: S3Operation, response: Response) {
  let responseText = "";

  try {
    responseText = await response.text();
  } catch {
    responseText = "";
  }

  return new S3StorageError({
    operation,
    responseText,
    status: response.status,
    statusText: response.statusText,
  });
}

async function requestS3Object({
  body,
  bodyHash,
  contentType,
  method,
  storageKey,
}: {
  body?: Buffer;
  bodyHash: string;
  contentType?: string;
  method: "DELETE" | "GET" | "PUT";
  storageKey: string;
}) {
  const config = getS3Config();
  const now = new Date();
  const { headers, url } = signS3Request({
    bodyHash,
    config,
    contentType,
    method,
    now,
    storageKey,
  });

  const requestBody = body ? new Blob([new Uint8Array(body)]) : undefined;

  return fetch(url, {
    body: requestBody,
    headers,
    method,
  });
}

function getS3Config(): S3Config {
  const sharedCredentials = getSharedAwsCredentials();
  const accessKeyId =
    process.env.AWS_ACCESS_KEY_ID?.trim() || sharedCredentials?.accessKeyId;
  const secretAccessKey =
    process.env.AWS_SECRET_ACCESS_KEY?.trim() ||
    sharedCredentials?.secretAccessKey;
  const sessionToken =
    process.env.AWS_SESSION_TOKEN?.trim() || sharedCredentials?.sessionToken;
  const region =
    process.env.AWS_REGION?.trim() ||
    process.env.AWS_DEFAULT_REGION?.trim() ||
    DEFAULT_REGION;
  const bucketName = process.env.S3_BUCKET_NAME?.trim() || DEFAULT_BUCKET_NAME;
  const endpoint =
    process.env.S3_ENDPOINT?.trim().replace(/\/+$/, "") ||
    `https://${bucketName}.s3.${region}.amazonaws.com`;

  if (!accessKeyId || !secretAccessKey) {
    throw new Error("S3 storage is not configured.");
  }

  return {
    accessKeyId,
    bucketName,
    endpoint,
    region,
    secretAccessKey,
    sessionToken,
  };
}

function getSharedAwsCredentials(): AwsCredentials | null {
  const profileName =
    process.env.S3_AWS_PROFILE?.trim() ||
    process.env.AWS_PROFILE?.trim() ||
    process.env.AWS_DEFAULT_PROFILE?.trim() ||
    "default";
  const credentialsPath =
    process.env.AWS_SHARED_CREDENTIALS_FILE?.trim() ||
    join(/* turbopackIgnore: true */ homedir(), ".aws", "credentials");
  let credentialsFile = "";

  try {
    credentialsFile = readFileSync(
      /* turbopackIgnore: true */ credentialsPath,
      "utf8",
    );
  } catch {
    return null;
  }

  const profile = parseAwsCredentialsFile(credentialsFile)[profileName];

  if (!profile?.aws_access_key_id || !profile.aws_secret_access_key) {
    return null;
  }

  return {
    accessKeyId: profile.aws_access_key_id,
    secretAccessKey: profile.aws_secret_access_key,
    sessionToken: profile.aws_session_token || profile.aws_security_token,
  };
}

function parseAwsCredentialsFile(contents: string) {
  const profiles: Record<string, Record<string, string>> = {};
  let currentProfile: string | null = null;

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#") || line.startsWith(";")) {
      continue;
    }

    const sectionMatch = /^\[([^\]]+)\]$/.exec(line);

    if (sectionMatch) {
      currentProfile = normalizeAwsProfileName(sectionMatch[1]?.trim() ?? "");
      profiles[currentProfile] ??= {};
      continue;
    }

    if (!currentProfile) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex < 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim().toLowerCase();
    const value = line.slice(separatorIndex + 1).trim();

    profiles[currentProfile][key] = value;
  }

  return profiles;
}

function normalizeAwsProfileName(profileName: string) {
  return profileName.startsWith("profile ")
    ? profileName.slice("profile ".length).trim()
    : profileName;
}

function signS3Request({
  bodyHash,
  config,
  contentType,
  method,
  now,
  storageKey,
}: {
  bodyHash: string;
  config: S3Config;
  contentType?: string;
  method: string;
  now: Date;
  storageKey: string;
}) {
  const endpointUrl = new URL(config.endpoint);
  const canonicalUri = `/${encodeObjectKey(storageKey)}`;
  const url = new URL(canonicalUri, endpointUrl);
  const amzDate = toAmzDate(now);
  const dateStamp = amzDate.slice(0, 8);
  const credentialScope = `${dateStamp}/${config.region}/${SERVICE}/${TERMINATOR}`;
  const signedHeaderNames = [
    "host",
    "x-amz-content-sha256",
    "x-amz-date",
    ...(config.sessionToken ? ["x-amz-security-token"] : []),
  ];
  const signedHeaders = signedHeaderNames.join(";");
  const canonicalHeaders = [
    `host:${url.host}`,
    `x-amz-content-sha256:${bodyHash}`,
    `x-amz-date:${amzDate}`,
    ...(config.sessionToken
      ? [`x-amz-security-token:${config.sessionToken}`]
      : []),
    "",
  ].join("\n");
  const canonicalRequest = [
    method,
    canonicalUri,
    "",
    canonicalHeaders,
    signedHeaders,
    bodyHash,
  ].join("\n");
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    hashHex(canonicalRequest),
  ].join("\n");
  const signingKey = getSigningKey({
    dateStamp,
    region: config.region,
    secretAccessKey: config.secretAccessKey,
  });
  const signature = hmacHex(signingKey, stringToSign);
  const headers: Record<string, string> = {
    authorization: [
      "AWS4-HMAC-SHA256",
      [
        `Credential=${config.accessKeyId}/${credentialScope}`,
        `SignedHeaders=${signedHeaders}`,
        `Signature=${signature}`,
      ].join(", "),
    ].join(" "),
    "x-amz-content-sha256": bodyHash,
    "x-amz-date": amzDate,
  };

  if (config.sessionToken) {
    headers["x-amz-security-token"] = config.sessionToken;
  }

  if (contentType) {
    headers["content-type"] = contentType;
  }

  return {
    headers,
    url,
  };
}

function getSigningKey({
  dateStamp,
  region,
  secretAccessKey,
}: {
  dateStamp: string;
  region: string;
  secretAccessKey: string;
}) {
  const dateKey = hmacBuffer(`AWS4${secretAccessKey}`, dateStamp);
  const dateRegionKey = hmacBuffer(dateKey, region);
  const dateRegionServiceKey = hmacBuffer(dateRegionKey, SERVICE);

  return hmacBuffer(dateRegionServiceKey, TERMINATOR);
}

function encodeObjectKey(storageKey: string) {
  return storageKey.split("/").map(encodePathPart).join("/");
}

function encodePathPart(value: string) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (char) =>
    `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function toAmzDate(date: Date) {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

function hashHex(value: string | Buffer) {
  return createHash("sha256").update(value).digest("hex");
}

function hmacBuffer(key: string | Buffer, value: string) {
  return createHmac("sha256", key).update(value).digest();
}

function hmacHex(key: Buffer, value: string) {
  return createHmac("sha256", key).update(value).digest("hex");
}
