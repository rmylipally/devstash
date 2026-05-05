import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getItemDetail } from "@/lib/db/items";
import { getS3Object } from "@/lib/storage/s3";

export const runtime = "nodejs";

interface ItemDownloadRouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  request: Request,
  { params }: ItemDownloadRouteContext,
): Promise<Response> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json(
      {
        success: false,
        error: "You must be signed in to download files.",
      },
      { status: 401 },
    );
  }

  const { id } = await params;
  const item = await getItemDetail({ itemId: id, userId });

  if (!item || item.contentKind !== "file" || !item.storageKey) {
    return NextResponse.json(
      {
        success: false,
        error: "File not found.",
      },
      { status: 404 },
    );
  }

  try {
    const s3Response = await getS3Object(item.storageKey);
    const headers = new Headers();
    const contentType =
      s3Response.headers.get("content-type") ??
      item.mimeType ??
      "application/octet-stream";
    const contentLength = s3Response.headers.get("content-length");
    const dispositionType = new URL(request.url).searchParams.has("download")
      ? "attachment"
      : "inline";

    headers.set("Content-Type", contentType);
    headers.set(
      "Content-Disposition",
      `${dispositionType}; filename="${sanitizeHeaderFileName(
        item.originalFileName ?? item.title,
      )}"`,
    );
    headers.set("Cache-Control", "private, no-store");

    if (contentLength) {
      headers.set("Content-Length", contentLength);
    }

    return new Response(s3Response.body, {
      headers,
      status: 200,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Could not download file. Try again.",
      },
      { status: 500 },
    );
  }
}

function sanitizeHeaderFileName(fileName: string) {
  return fileName.replace(/["\\\r\n]/g, "_");
}
