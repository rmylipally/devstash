import { NextResponse } from "next/server";

import { auth } from "@/auth";
import {
  deleteS3Object,
  getS3UploadErrorMessage,
  putS3Object,
} from "@/lib/storage/s3";
import {
  createStorageKey,
  isStorageKeyForUpload,
  isUploadItemKind,
  validateUploadMetadata,
} from "@/lib/storage/uploads";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json(
      {
        success: false,
        error: "You must be signed in to upload files.",
      },
      { status: 401 },
    );
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid upload body.",
      },
      { status: 400 },
    );
  }

  const kindValue = formData.get("kind");
  const fileValue = formData.get("file");

  if (!isUploadItemKind(kindValue)) {
    return NextResponse.json(
      {
        success: false,
        error: "Choose file or image upload type.",
      },
      { status: 400 },
    );
  }

  if (!(fileValue instanceof File)) {
    return NextResponse.json(
      {
        success: false,
        error: "Choose a file to upload.",
      },
      { status: 400 },
    );
  }

  const validation = validateUploadMetadata({
    fileName: fileValue.name,
    kind: kindValue,
    mimeType: fileValue.type,
    size: fileValue.size,
  });

  if (!validation.success) {
    return NextResponse.json(
      {
        success: false,
        error: validation.error,
      },
      { status: 400 },
    );
  }

  const storageKey = createStorageKey({
    fileName: fileValue.name,
    kind: kindValue,
    userId,
  });

  try {
    const body = Buffer.from(await fileValue.arrayBuffer());

    await putS3Object({
      body,
      contentType: fileValue.type,
      storageKey,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: getS3UploadErrorMessage(error),
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      fileSizeBytes: fileValue.size,
      mimeType: fileValue.type,
      originalFileName: fileValue.name,
      storageKey,
    },
  });
}

export async function DELETE(request: Request): Promise<NextResponse> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json(
      {
        success: false,
        error: "You must be signed in to remove uploads.",
      },
      { status: 401 },
    );
  }

  let input: unknown;

  try {
    input = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid upload cleanup body.",
      },
      { status: 400 },
    );
  }

  if (typeof input !== "object" || input === null) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid upload cleanup body.",
      },
      { status: 400 },
    );
  }

  const { kind, storageKey } = input as Record<string, unknown>;

  if (
    !isUploadItemKind(kind) ||
    typeof storageKey !== "string" ||
    !isStorageKeyForUpload({ kind, storageKey, userId })
  ) {
    return NextResponse.json(
      {
        success: false,
        error: "Upload not found.",
      },
      { status: 404 },
    );
  }

  try {
    await deleteS3Object(storageKey);
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Could not remove upload. Try again.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
  });
}
