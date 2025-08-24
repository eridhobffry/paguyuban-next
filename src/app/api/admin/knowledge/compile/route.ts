import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { knowledge } from "@/lib/db/schemas/knowledge";
import { eq, desc } from "drizzle-orm";

// POST /api/admin/knowledge/compile - AI-powered knowledge compilation
export async function POST(request: NextRequest) {
  try {
    // TODO: Add proper authentication when auth system is integrated

    const body = await request.json();

    // Manual validation instead of Zod
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const newKnowledge = body.newKnowledge || {};
    const context = body.context || undefined;
    const compilationType = body.compilationType || "merge";
    const autoApply = body.autoApply || false;

    const validatedData = {
      newKnowledge,
      context,
      compilationType,
      autoApply,
    };

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

    // For now, return a simple merge result
    // TODO: Re-enable AI compilation once dependencies are resolved
    const mergedKnowledge = {
      ...existingKnowledge,
      ...validatedData.newKnowledge,
    };

    // Auto-apply if requested
    if (validatedData.autoApply) {
      if (activeKnowledge.length > 0) {
        await db
          .update(knowledge)
          .set({
            overlay: mergedKnowledge,
            updatedAt: new Date(),
          })
          .where(eq(knowledge.id, activeKnowledge[0].id));
      } else {
        await db.insert(knowledge).values({
          overlay: mergedKnowledge,
          isActive: true,
        });
      }
    }

    return NextResponse.json({
      compiledKnowledge: mergedKnowledge,
      conflicts: [],
      enhancements: [],
      summary: "Simple merge completed (AI compilation temporarily disabled)",
      applied: validatedData.autoApply,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error compiling knowledge:", error);

    // Since we're not using Zod for now, just return a simple error
    return NextResponse.json(
      { error: "Failed to compile knowledge", details: String(error) },
      { status: 500 }
    );
  }
}
