import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { knowledge } from "@/lib/db/schemas/knowledge";
import { eq, desc } from "drizzle-orm";

// Zod schema for knowledge validation
const knowledgeSchema = z.object({
  overlay: z.record(z.string(), z.any()).default({}),
  isActive: z.boolean().default(true),
});

const updateKnowledgeSchema = z.object({
  overlay: z.record(z.string(), z.any()).default({}),
  isActive: z.boolean().default(true),
});

// GET /api/admin/knowledge-simple - Get active knowledge overlay (no auth for testing)
export async function GET(_request: NextRequest) {
  try {
    // Get the active knowledge overlay
    const activeKnowledge = await db
      .select()
      .from(knowledge)
      .where(eq(knowledge.isActive, true))
      .orderBy(desc(knowledge.updatedAt))
      .limit(1);

    if (!activeKnowledge.length) {
      return NextResponse.json({
        overlay: {},
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      id: activeKnowledge[0].id,
      overlay: activeKnowledge[0].overlay,
      isActive: activeKnowledge[0].isActive,
      createdAt: activeKnowledge[0].createdAt?.toISOString(),
      updatedAt: activeKnowledge[0].updatedAt?.toISOString(),
    });
  } catch (error) {
    console.error("Error fetching knowledge:", error);
    return NextResponse.json(
      { error: "Failed to fetch knowledge" },
      { status: 500 }
    );
  }
}

// POST /api/admin/knowledge-simple - Create new knowledge overlay (no auth for testing)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = knowledgeSchema.parse(body);

    // First, deactivate all existing knowledge overlays
    await db
      .update(knowledge)
      .set({ isActive: false })
      .where(eq(knowledge.isActive, true));

    // Create new active knowledge overlay
    const [newKnowledge] = await db
      .insert(knowledge)
      .values({
        overlay: validatedData.overlay,
        isActive: validatedData.isActive,
      })
      .returning();

    return NextResponse.json(
      {
        id: newKnowledge.id,
        overlay: newKnowledge.overlay,
        isActive: newKnowledge.isActive,
        createdAt: newKnowledge.createdAt?.toISOString(),
        updatedAt: newKnowledge.updatedAt?.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating knowledge:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data format", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create knowledge" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/knowledge-simple - Update existing knowledge overlay (no auth for testing)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = updateKnowledgeSchema.parse(body);

    // Get the active knowledge overlay
    const activeKnowledge = await db
      .select()
      .from(knowledge)
      .where(eq(knowledge.isActive, true))
      .orderBy(desc(knowledge.updatedAt))
      .limit(1);

    if (!activeKnowledge.length) {
      // If no active knowledge exists, create one
      const [newKnowledge] = await db
        .insert(knowledge)
        .values({
          overlay: validatedData.overlay,
          isActive: validatedData.isActive,
        })
        .returning();

      return NextResponse.json({
        id: newKnowledge.id,
        overlay: newKnowledge.overlay,
        isActive: newKnowledge.isActive,
        createdAt: newKnowledge.createdAt?.toISOString(),
        updatedAt: newKnowledge.updatedAt?.toISOString(),
      });
    }

    // Update existing knowledge overlay
    const [updatedKnowledge] = await db
      .update(knowledge)
      .set({
        overlay: validatedData.overlay,
        isActive: validatedData.isActive,
        updatedAt: new Date(),
      })
      .where(eq(knowledge.id, activeKnowledge[0].id))
      .returning();

    return NextResponse.json({
      id: updatedKnowledge.id,
      overlay: updatedKnowledge.overlay,
      isActive: updatedKnowledge.isActive,
      createdAt: updatedKnowledge.createdAt?.toISOString(),
      updatedAt: updatedKnowledge.updatedAt?.toISOString(),
    });
  } catch (error) {
    console.error("Error updating knowledge:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data format", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update knowledge" },
      { status: 500 }
    );
  }
}
