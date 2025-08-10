import { NextRequest, NextResponse } from "next/server";
import { verifyToken, isAdmin } from "@/lib/auth";
import { db, schema } from "@/lib/db/index";
import { desc, eq } from "drizzle-orm";
import { documentAnalyzer } from "@/lib/document-analyzer";
import { put as putBlob } from "@vercel/blob";
import { documentAdminUpdateSnakeSchema } from "@/types/validation";
import type { User } from "@/lib/sql";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const token = request.cookies.get("auth-token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token) as User;
    if (!decoded || !isAdmin(decoded)) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const documents = await db
      .select()
      .from(schema.documents)
      .orderBy(desc(schema.documents.createdAt));

    // Weak ETag based on count+latest update timestamp to support admin polling 304s
    const lastUpdated = documents[0]?.updatedAt?.toISOString() || "0";
    const etag = `W/"docs-${documents.length}-${lastUpdated}"`;
    const reqTag = request.headers.get("if-none-match");
    if (reqTag === etag) {
      return new NextResponse(null, { status: 304, headers: { ETag: etag } });
    }

    return NextResponse.json(
      { documents },
      { status: 200, headers: { ETag: etag } }
    );
  } catch (error) {
    console.error("Get documents error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const token = request.cookies.get("auth-token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token) as User;
    if (!decoded || !isAdmin(decoded)) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // NOTE: Storage should be handled via /api/admin/upload (Vercel Blob) in UI.
    // For now, support two simple creation paths: manual_data (no analysis) and external_url (with analysis).
    const formData = await request.formData();
    const manualData = formData.get("manual_data") as string | null;
    const externalUrl = formData.get("external_url") as string | null;
    const file = formData.get("file") as File | null;

    if (!manualData && !externalUrl && !file) {
      return NextResponse.json(
        { error: "Provide file, manual_data or external_url" },
        { status: 400 }
      );
    }

    type InsertDocument = typeof schema.documents.$inferInsert;
    let payload: InsertDocument | null = null;

    if (manualData) {
      const manual = JSON.parse(manualData);
      payload = {
        title: manual.title,
        description: manual.description,
        preview: manual.preview,
        pages: manual.pages,
        type: manual.type,
        icon: manual.icon,
        externalUrl: manual.external_url || null,
        fileUrl: manual.file_url || null,
        marketingHighlights: manual.marketing_highlights || null,
        restricted: manual.restricted !== false,
        aiGenerated: false,
        createdBy: decoded.email,
      };
    } else if (externalUrl) {
      try {
        // Prefer extracting raw text for Google Docs links to improve analysis quality
        let urlContent = "";
        const gdocMatch = externalUrl!.match(
          /docs.google.com\/document\/d\/([a-zA-Z0-9_-]+)/
        );
        if (gdocMatch?.[1]) {
          const exportTxt = `https://docs.google.com/document/d/${gdocMatch[1]}/export?format=txt`;
          const exportRes = await fetch(exportTxt, {
            headers: { "User-Agent": "Mozilla/5.0" },
          });
          if (exportRes.ok) {
            urlContent = await exportRes.text();
          }
        }
        // Fallback to generic fetch if we couldn't get text
        if (!urlContent) {
          const urlResponse = await fetch(externalUrl!, {
            headers: { "User-Agent": "Mozilla/5.0" },
          });
          urlContent = await urlResponse.text();
        }
        const analysis = await documentAnalyzer.analyzeDocument({
          content: urlContent.substring(0, 10000),
          fileName:
            new URL(externalUrl!).pathname.split("/").pop() || "document",
          fileSize: urlContent.length,
          mimeType: "text/html",
        });
        payload = {
          title: analysis.title,
          description: analysis.description,
          preview: analysis.preview,
          pages: analysis.pages,
          type: analysis.type,
          icon: analysis.icon,
          externalUrl: externalUrl!,
          marketingHighlights: analysis.marketingHighlights || null,
          restricted: analysis.suggestedRestricted,
          aiGenerated: true,
          createdBy: decoded.email,
        };
      } catch (error) {
        console.error("Error fetching external URL:", error);
        return NextResponse.json(
          { error: "Failed to fetch content from external URL" },
          { status: 400 }
        );
      }
    } else if (file) {
      // Backward-compatible file upload path: upload to Vercel Blob, then attempt simple text analysis if possible
      const safeName = (file.name || "upload").replace(/[^a-zA-Z0-9._-]/g, "_");
      const pathname = `documents/${safeName}`;
      const blob = await putBlob(pathname, file, {
        access: "public",
        addRandomSuffix: true,
        contentType: file.type || "application/octet-stream",
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });

      let analysisTitle = safeName;
      let analysisDesc = "";
      let analysisPreview = "";
      let analysisPages = "";
      let analysisType = "Executive Document";
      let analysisIcon = "FileText";
      let analysisHighlights: string[] | null = null;
      try {
        const content = await file.text();
        const analysis = await documentAnalyzer.analyzeDocument({
          content: content.substring(0, 10000),
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
        });
        analysisTitle = analysis.title;
        analysisDesc = analysis.description;
        analysisPreview = analysis.preview;
        analysisPages = analysis.pages;
        analysisType = analysis.type;
        analysisIcon = analysis.icon;
        analysisHighlights = analysis.marketingHighlights || null;
      } catch {
        // Non-fatal if analysis fails; fallback metadata
      }

      payload = {
        title: analysisTitle,
        description: analysisDesc,
        preview: analysisPreview,
        pages: analysisPages,
        type: analysisType,
        icon: analysisIcon,
        fileUrl: blob.url,
        restricted: true,
        fileSize: file.size,
        mimeType: file.type,
        marketingHighlights: analysisHighlights,
        aiGenerated: !!analysisPreview || !!analysisDesc,
        createdBy: decoded.email,
      };
    }

    if (!payload) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const [inserted] = await db
      .insert(schema.documents)
      .values(payload as InsertDocument)
      .returning();

    const document = {
      id: inserted.id,
      title: inserted.title,
      description: inserted.description,
      preview: inserted.preview,
      pages: inserted.pages,
      type: inserted.type,
      icon: inserted.icon,
      file_url: inserted.fileUrl ?? undefined,
      external_url: inserted.externalUrl ?? undefined,
      restricted: inserted.restricted,
      file_size: inserted.fileSize ?? undefined,
      mime_type: inserted.mimeType ?? undefined,
      ai_generated: inserted.aiGenerated,
      created_by: inserted.createdBy,
      created_at: inserted.createdAt as unknown as string,
      updated_at: inserted.updatedAt as unknown as string,
    };

    return NextResponse.json(
      { message: "Document created successfully", document },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create document error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const token = request.cookies.get("auth-token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token) as User;
    if (!decoded || !isAdmin(decoded)) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const payload = documentAdminUpdateSnakeSchema.parse(await request.json());
    const { id, ...rest } = payload;

    // Map snake_case payload to DB columns
    const patch: Partial<typeof schema.documents.$inferInsert> = {
      title: rest.title,
      description: rest.description,
      preview: rest.preview,
      pages: rest.pages,
      type: rest.type,
      icon: rest.icon,
      fileUrl: rest.file_url ?? undefined,
      externalUrl: rest.external_url ?? undefined,
      restricted: rest.restricted,
      marketingHighlights: rest.marketing_highlights ?? undefined,
      updatedAt: new Date(),
    };

    const [updated] = await db
      .update(schema.documents)
      .set(patch)
      .where(eq(schema.documents.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    const document = {
      id: updated.id,
      title: updated.title,
      description: updated.description,
      preview: updated.preview,
      pages: updated.pages,
      type: updated.type,
      icon: updated.icon,
      file_url: updated.fileUrl ?? undefined,
      external_url: updated.externalUrl ?? undefined,
      restricted: updated.restricted,
      file_size: updated.fileSize ?? undefined,
      mime_type: updated.mimeType ?? undefined,
      ai_generated: updated.aiGenerated,
      created_by: updated.createdBy,
      created_at: updated.createdAt as unknown as string,
      updated_at: updated.updatedAt as unknown as string,
    };

    return NextResponse.json(
      { message: "Document updated successfully", document },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update document error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const token = request.cookies.get("auth-token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token) as User;
    if (!decoded || !isAdmin(decoded)) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { id } = (await request.json()) as { id?: string };
    if (!id)
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );

    const [deleted] = await db
      .delete(schema.documents)
      .where(eq(schema.documents.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Document deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete document error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
