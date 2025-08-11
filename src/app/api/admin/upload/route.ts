import { NextRequest, NextResponse } from "next/server";
import { verifyToken, isAdmin } from "@/lib/auth";
import type { User } from "@/lib/sql";
import { put, del as deleteBlob } from "@vercel/blob";
import { isVercelBlobUrl } from "@/lib/blob-utils";

const ALLOWED_FOLDERS = new Set([
  "speakers",
  "artists",
  "documents",
  "logos",
  "agenda",
]);

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value;
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const decoded = verifyToken(token) as User | null;
    if (!decoded || !isAdmin(decoded))
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );

    const { searchParams } = new URL(request.url);
    const folder = (searchParams.get("folder") || "").trim();
    if (!ALLOWED_FOLDERS.has(folder)) {
      return NextResponse.json({ error: "Invalid folder" }, { status: 400 });
    }

    const form = await request.formData();
    const file = form.get("file") as File | null;
    if (!file)
      return NextResponse.json({ error: "Missing file" }, { status: 400 });

    const safeName = (file.name || "upload").replace(/[^a-zA-Z0-9._-]/g, "_");
    const pathname = `${folder}/${safeName}`;

    const blob = await put(pathname, file, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type || "application/octet-stream",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return NextResponse.json({ url: blob.url }, { status: 201 });
  } catch (error) {
    console.error("/api/admin/upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value;
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const decoded = verifyToken(token) as User | null;
    if (!decoded || !isAdmin(decoded))
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );

    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");
    if (!url || !isVercelBlobUrl(url)) {
      return NextResponse.json({ error: "Invalid url" }, { status: 400 });
    }
    await deleteBlob(url, { token: process.env.BLOB_READ_WRITE_TOKEN });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("/api/admin/upload DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
