import { NextRequest, NextResponse } from "next/server";
import { verifyToken, isAdmin } from "@/lib/auth";
import {
  getAllDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  initializeDocumentTable,
  User,
  DocumentInput,
} from "@/lib/sql";
import { documentAnalyzer } from "@/lib/document-analyzer";

// Ensure the documents table exists
initializeDocumentTable().catch(console.error);

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

    const documents = await getAllDocuments();
    return NextResponse.json({ documents }, { status: 200 });
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

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const externalUrl = formData.get("external_url") as string | null;
    const manualData = formData.get("manual_data") as string | null;

    // Validate input - must have either file or external URL or manual data
    if (!file && !externalUrl && !manualData) {
      return NextResponse.json(
        {
          error:
            "Must provide either a file, external URL, or manual document data",
        },
        { status: 400 }
      );
    }

    let documentData: DocumentInput;

    if (manualData) {
      // Manual document creation
      const manual = JSON.parse(manualData);
      documentData = {
        title: manual.title,
        description: manual.description,
        preview: manual.preview,
        pages: manual.pages,
        type: manual.type,
        icon: manual.icon,
        external_url: manual.external_url,
        restricted: manual.restricted !== false,
        ai_generated: false,
        created_by: decoded.email,
      };
    } else if (file) {
      // File upload with AI analysis
      const fileContent = await file.text();

      const analysis = await documentAnalyzer.analyzeDocument({
        content: fileContent,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      });

      // Store file (simplified - in production, use cloud storage)
      const fileUrl = `/uploads/documents/${Date.now()}-${file.name}`;

      documentData = {
        title: analysis.title,
        description: analysis.description,
        preview: analysis.preview,
        pages: analysis.pages,
        type: analysis.type,
        icon: analysis.icon,
        file_url: fileUrl,
        restricted: analysis.suggestedRestricted,
        file_size: file.size,
        mime_type: file.type,
        ai_generated: true,
        created_by: decoded.email,
      };
    } else {
      // External URL with AI analysis
      try {
        // Fetch content from external URL for analysis
        const urlResponse = await fetch(externalUrl!);
        const urlContent = await urlResponse.text();

        const analysis = await documentAnalyzer.analyzeDocument({
          content: urlContent.substring(0, 10000), // Limit content for analysis
          fileName:
            new URL(externalUrl!).pathname.split("/").pop() || "document",
          fileSize: urlContent.length,
          mimeType: "text/html",
        });

        documentData = {
          title: analysis.title,
          description: analysis.description,
          preview: analysis.preview,
          pages: analysis.pages,
          type: analysis.type,
          icon: analysis.icon,
          external_url: externalUrl!,
          restricted: analysis.suggestedRestricted,
          ai_generated: true,
          created_by: decoded.email,
        };
      } catch (error) {
        console.error("Error fetching external URL:", error);
        return NextResponse.json(
          { error: "Failed to fetch content from external URL" },
          { status: 400 }
        );
      }
    }

    const document = await createDocument(documentData);

    return NextResponse.json(
      {
        message: "Document created successfully",
        document,
      },
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

    const { id, ...updates } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    const document = await updateDocument(id, updates);

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: "Document updated successfully",
        document,
      },
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

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    const success = await deleteDocument(id);

    if (!success) {
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
