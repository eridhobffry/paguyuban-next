import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { knowledge } from "@/lib/db/schemas/knowledge";
import { eq, desc } from "drizzle-orm";
import { aiKnowledgeCompiler } from "@/lib/knowledge/ai-compiler";

// Zod schema for compilation request
const compileRequestSchema = z.object({
  newKnowledge: z.record(z.unknown()),
  context: z.string().optional(),
  compilationType: z
    .enum(["merge", "enhance", "validate", "optimize"])
    .default("merge"),
  autoApply: z.boolean().default(false),
});

// POST /api/admin/knowledge/compile - AI-powered knowledge compilation
export async function POST(request: NextRequest) {
  try {
    // TODO: Add proper authentication when auth system is integrated

    const body = await request.json();
    const validatedData = compileRequestSchema.parse(body);

    // Get current active knowledge
    const activeKnowledge = await db
      .select()
      .from(knowledge)
      .where(eq(knowledge.isActive, true))
      .orderBy(desc(knowledge.updatedAt))
      .limit(1);

    const existingKnowledge =
      activeKnowledge.length > 0
        ? (activeKnowledge[0].overlay as Record<string, unknown>)
        : {};

    // Compile knowledge using AI
    const compilationResult = await aiKnowledgeCompiler.compileKnowledge({
      existingKnowledge,
      newKnowledge: validatedData.newKnowledge,
      context: validatedData.context,
      compilationType: validatedData.compilationType,
    });

    // Auto-apply if requested
    if (validatedData.autoApply) {
      if (activeKnowledge.length > 0) {
        await db
          .update(knowledge)
          .set({
            overlay: compilationResult.compiledKnowledge,
            updatedAt: new Date(),
          })
          .where(eq(knowledge.id, activeKnowledge[0].id));
      } else {
        await db.insert(knowledge).values({
          overlay: compilationResult.compiledKnowledge,
          isActive: true,
        });
      }
    }

    return NextResponse.json({
      ...compilationResult,
      applied: validatedData.autoApply,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error compiling knowledge:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request format", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to compile knowledge" },
      { status: 500 }
    );
  }
}

// GET /api/admin/knowledge/compile/preview - Preview compilation without applying
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const newKnowledgeParam = searchParams.get("newKnowledge");
    const context = searchParams.get("context");
    const compilationType =
      (searchParams.get("type") as
        | "merge"
        | "enhance"
        | "validate"
        | "optimize") || "merge";

    if (!newKnowledgeParam) {
      return NextResponse.json(
        { error: "newKnowledge parameter required" },
        { status: 400 }
      );
    }

    let newKnowledge: Record<string, unknown>;
    try {
      newKnowledge = JSON.parse(newKnowledgeParam);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid JSON in newKnowledge parameter" },
        { status: 400 }
      );
    }

    // Get current active knowledge
    const activeKnowledge = await db
      .select()
      .from(knowledge)
      .where(eq(knowledge.isActive, true))
      .orderBy(desc(knowledge.updatedAt))
      .limit(1);

    const existingKnowledge =
      activeKnowledge.length > 0
        ? (activeKnowledge[0].overlay as Record<string, unknown>)
        : {};

    // Preview compilation
    const compilationResult = await aiKnowledgeCompiler.compileKnowledge({
      existingKnowledge,
      newKnowledge,
      context: context || undefined,
      compilationType,
    });

    return NextResponse.json({
      ...compilationResult,
      preview: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error previewing knowledge compilation:", error);
    return NextResponse.json(
      { error: "Failed to preview compilation" },
      { status: 500 }
    );
  }
}
