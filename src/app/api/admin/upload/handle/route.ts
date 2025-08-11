import { NextRequest, NextResponse } from "next/server";
import { isAdmin, verifyToken } from "@/lib/auth";
import type { User } from "@/lib/sql";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

const ALLOWED_FOLDERS = new Set([
  "speakers",
  "artists",
  "documents",
  "logos",
  "agenda",
]);

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Admin auth for generating client tokens and receiving completion webhooks
  const token = request.cookies.get("auth-token")?.value;
  if (!token)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const decoded = verifyToken(token) as User | null;
  if (!decoded || !isAdmin(decoded))
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 }
    );

  // We expect JSON per @vercel/blob/client upload
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      request,
      body,
      // Authenticate/authorize already done above
      onBeforeGenerateToken: async (pathname) => {
        // Ensure the client-provided pathname stays within an allowed folder
        const firstSegment = (pathname || "").split("/")[0] ?? "";
        if (!ALLOWED_FOLDERS.has(firstSegment)) {
          throw new Error("Invalid upload folder");
        }
        return {
          addRandomSuffix: true,
          allowedContentTypes: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
            "image/avif",
            "application/pdf",
          ],
          maximumSizeInBytes: 25 * 1024 * 1024, // 25MB safety cap
        };
      },
      onUploadCompleted: async () => {
        // No-op for now. We rely on DB writes in subsequent POST/PUT.
        // Could record audit logs here if needed.
        return;
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
