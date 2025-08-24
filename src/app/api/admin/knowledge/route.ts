import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { knowledge } from "@/lib/db/schemas/knowledge";
import { eq, desc } from "drizzle-orm";
import { dynamicKnowledgeBuilder } from "@/lib/knowledge/builder";
// Note: Using custom auth instead of next-auth for this project
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";

// Zod schema for knowledge validation
const knowledgeSchema = z.object({
  overlay: z.record(z.string(), z.any()).default({}),
  isActive: z.boolean().default(true),
});

const updateKnowledgeSchema = z.object({
  overlay: z.record(z.string(), z.any()).default({}),
  isActive: z.boolean().default(true),
});

// GET /api/admin/knowledge - Get active knowledge overlay
export async function GET(_request: NextRequest) {
  try {
    // const session = await getServerSession(authOptions);

    // if (!session || session.user.role !== "admin") {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    // Get the active knowledge overlay
    const compiledKnowledge = await dynamicKnowledgeBuilder.buildKnowledge();

    return NextResponse.json(compiledKnowledge);
  } catch (error) {
    console.error("Error fetching knowledge:", error);
    return NextResponse.json(
      { error: "Failed to fetch knowledge" },
      { status: 500 }
    );
  }
}

// POST /api/admin/knowledge - Create new knowledge overlay
export async function POST(request: NextRequest) {
  try {
    // const session = await getServerSession(authOptions);

    // if (!session || session.user.role !== "admin") {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

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

// PUT /api/admin/knowledge - Update existing knowledge overlay
export async function PUT(request: NextRequest) {
  try {
    // const session = await getServerSession(authOptions);

    // if (!session || session.user.role !== "admin") {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

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

// DELETE /api/admin/knowledge - Clear knowledge overlay
export async function DELETE(_request: NextRequest) {
  try {
    // TODO: Add proper authentication check

    await db
      .update(knowledge)
      .set({ overlay: {} })
      .where(eq(knowledge.isActive, true));

    return NextResponse.json({ message: "Knowledge overlay cleared" });
  } catch (error) {
    console.error("Error clearing knowledge:", error);
    return NextResponse.json(
      { error: "Failed to clear knowledge" },
      { status: 500 }
    );
  }
}
