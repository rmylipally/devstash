import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, it, vi } from "vitest";

import {
  getS3UploadErrorMessage,
  putS3Object,
  S3StorageError,
} from "../src/lib/storage/s3";

const originalEnv = {
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_DEFAULT_REGION: process.env.AWS_DEFAULT_REGION,
  AWS_DEFAULT_PROFILE: process.env.AWS_DEFAULT_PROFILE,
  AWS_PROFILE: process.env.AWS_PROFILE,
  AWS_REGION: process.env.AWS_REGION,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_SESSION_TOKEN: process.env.AWS_SESSION_TOKEN,
  AWS_SHARED_CREDENTIALS_FILE: process.env.AWS_SHARED_CREDENTIALS_FILE,
  S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
  S3_ENDPOINT: process.env.S3_ENDPOINT,
  S3_AWS_PROFILE: process.env.S3_AWS_PROFILE,
  S3_UPLOAD_PREFIX: process.env.S3_UPLOAD_PREFIX,
};

describe("S3 storage", () => {
  let temporaryDirectory: string | null = null;

  beforeEach(() => {
    process.env.AWS_ACCESS_KEY_ID = "access-key";
    process.env.AWS_DEFAULT_REGION = "";
    process.env.AWS_DEFAULT_PROFILE = "";
    process.env.AWS_PROFILE = "";
    process.env.AWS_REGION = "us-east-1";
    process.env.AWS_SECRET_ACCESS_KEY = "secret-key";
    process.env.AWS_SESSION_TOKEN = "session-token";
    process.env.AWS_SHARED_CREDENTIALS_FILE = "";
    process.env.S3_BUCKET_NAME = "";
    process.env.S3_ENDPOINT = "";
    process.env.S3_AWS_PROFILE = "";
    process.env.S3_UPLOAD_PREFIX = "";
  });

  afterEach(async () => {
    restoreEnvVar("AWS_ACCESS_KEY_ID", originalEnv.AWS_ACCESS_KEY_ID);
    restoreEnvVar("AWS_DEFAULT_REGION", originalEnv.AWS_DEFAULT_REGION);
    restoreEnvVar("AWS_DEFAULT_PROFILE", originalEnv.AWS_DEFAULT_PROFILE);
    restoreEnvVar("AWS_PROFILE", originalEnv.AWS_PROFILE);
    restoreEnvVar("AWS_REGION", originalEnv.AWS_REGION);
    restoreEnvVar("AWS_SECRET_ACCESS_KEY", originalEnv.AWS_SECRET_ACCESS_KEY);
    restoreEnvVar("AWS_SESSION_TOKEN", originalEnv.AWS_SESSION_TOKEN);
    restoreEnvVar(
      "AWS_SHARED_CREDENTIALS_FILE",
      originalEnv.AWS_SHARED_CREDENTIALS_FILE,
    );
    restoreEnvVar("S3_BUCKET_NAME", originalEnv.S3_BUCKET_NAME);
    restoreEnvVar("S3_ENDPOINT", originalEnv.S3_ENDPOINT);
    restoreEnvVar("S3_AWS_PROFILE", originalEnv.S3_AWS_PROFILE);
    restoreEnvVar("S3_UPLOAD_PREFIX", originalEnv.S3_UPLOAD_PREFIX);
    if (temporaryDirectory) {
      await rm(temporaryDirectory, { force: true, recursive: true });
      temporaryDirectory = null;
    }
    vi.restoreAllMocks();
  });

  it("uploads to the configured bucket and devstash prefix by default", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));

    await putS3Object({
      body: Buffer.from("probe"),
      contentType: "text/plain",
      storageKey: "devstash/api/uploads/user-123/file/probe.txt",
    });

    const [url, init] = fetchMock.mock.calls[0] ?? [];

    assert.equal(
      String(url),
      "https://eapi-chc-dev-ets-attachments.s3.us-east-1.amazonaws.com/devstash/api/uploads/user-123/file/probe.txt",
    );
    assert.equal(init?.method, "PUT");
    assert.equal(init?.headers?.["x-amz-security-token"], "session-token");
    assert.match(
      init?.headers?.authorization ?? "",
      /^AWS4-HMAC-SHA256 Credential=/,
    );
  });

  it("falls back to a shared AWS credentials profile when env keys are absent", async () => {
    temporaryDirectory = await mkdtemp(join(tmpdir(), "devstash-aws-"));
    const credentialsPath = join(temporaryDirectory, "credentials");

    await writeFile(
      credentialsPath,
      [
        "[default]",
        "aws_access_key_id = default-access",
        "aws_secret_access_key = default-secret",
        "",
        "[saml-dev]",
        "aws_access_key_id = profile-access",
        "aws_secret_access_key = profile-secret",
        "aws_session_token = profile-token",
      ].join("\n"),
    );

    process.env.AWS_ACCESS_KEY_ID = "";
    process.env.AWS_SECRET_ACCESS_KEY = "";
    process.env.AWS_SESSION_TOKEN = "";
    process.env.AWS_SHARED_CREDENTIALS_FILE = credentialsPath;
    process.env.S3_AWS_PROFILE = "saml-dev";

    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));

    await putS3Object({
      body: Buffer.from("probe"),
      contentType: "text/plain",
      storageKey: "devstash/api/uploads/user-123/file/probe.txt",
    });

    const [, init] = fetchMock.mock.calls[0] ?? [];
    const authorization = init?.headers?.authorization ?? "";

    assert.match(authorization, /Credential=profile-access\//);
    assert.equal(init?.headers?.["x-amz-security-token"], "profile-token");
  });

  it("throws S3 status details when an upload is rejected", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("<Error><Code>AccessDenied</Code></Error>", {
        status: 403,
        statusText: "Forbidden",
      }),
    );

    await assert.rejects(
      putS3Object({
        body: Buffer.from("probe"),
        contentType: "text/plain",
        storageKey: "devstash/api/uploads/user-123/file/probe.txt",
      }),
      (error: unknown) => {
        assert.equal(error instanceof S3StorageError, true);
        assert.equal((error as S3StorageError).status, 403);
        assert.match((error as S3StorageError).responseText, /AccessDenied/);
        assert.match(
          (error as Error).message,
          /S3 upload failed with 403 Forbidden/,
        );

        return true;
      },
    );
  });

  it("maps S3 upload errors to a clear message", () => {
    const error = new S3StorageError({
      operation: "upload",
      responseText: "<Error><Code>AccessDenied</Code></Error>",
      status: 403,
      statusText: "Forbidden",
    });

    assert.equal(
      getS3UploadErrorMessage(error),
      "Amazon S3 rejected the upload (403). Check AWS credentials, bucket permissions, and endpoint settings.",
    );
  });

  it("maps missing AWS credentials to a profile-aware message", () => {
    assert.equal(
      getS3UploadErrorMessage(new Error("S3 storage is not configured.")),
      "Amazon S3 storage is not configured. Add AWS credentials or set S3_AWS_PROFILE/AWS_PROFILE to a profile in ~/.aws/credentials, then restart the dev server.",
    );
  });
});

function restoreEnvVar(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}
