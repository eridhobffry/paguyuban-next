import { NextRequest, NextResponse } from "next/server";
import { verifyToken, isAdmin } from "@/lib/auth";
import { db } from "@/lib/db/drizzle";
import { financialRevenueItems, financialCostItems } from "@/lib/db/schema";
import { z } from "zod";
import { User } from "@/lib/db";
import { eq } from "drizzle-orm";

const FinancialResponse = z.object({
  revenues: z.array(
    z.object({
      id: z.string().uuid(),
      category: z.string(),
      amount: z.number(),
      notes: z.string().nullable().optional(),
      evidenceUrl: z.string().nullable().optional(),
      sortOrder: z.number().nullable().optional(),
      createdAt: z.date().nullable().optional(),
      updatedAt: z.date().nullable().optional(),
    })
  ),
  costs: z.array(
    z.object({
      id: z.string().uuid(),
      category: z.string(),
      amount: z.number(),
      notes: z.string().nullable().optional(),
      evidenceUrl: z.string().nullable().optional(),
      sortOrder: z.number().nullable().optional(),
      createdAt: z.date().nullable().optional(),
      updatedAt: z.date().nullable().optional(),
    })
  ),
});

export async function GET(request: NextRequest) {
  try {
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

    const [revenues, costs] = await Promise.all([
      db
        .select()
        .from(financialRevenueItems)
        .orderBy(financialRevenueItems.sortOrder),
      db
        .select()
        .from(financialCostItems)
        .orderBy(financialCostItems.sortOrder),
    ]);

    const payload = { revenues, costs };
    const parsed = FinancialResponse.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.format() },
        { status: 500 }
      );
    }

    return NextResponse.json(parsed.data, { status: 200 });
  } catch (error) {
    console.error("/api/admin/financial GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Schemas for CRUD
const ItemTypeSchema = z.enum(["revenue", "cost"]);
const BaseItemSchema = z.object({
  category: z.string().min(1),
  amount: z.number().finite(),
  notes: z.string().optional().nullable(),
  evidenceUrl: z.string().url().optional().nullable(),
  sortOrder: z.number().optional().nullable(),
});

const CreateSchema = z.object({
  itemType: ItemTypeSchema,
  item: BaseItemSchema,
});

const UpdateSchema = z.object({
  itemType: ItemTypeSchema,
  id: z.string().uuid(),
  item: BaseItemSchema.partial(),
});

const DeleteSchema = z.object({
  itemType: ItemTypeSchema,
  id: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json();
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", issues: parsed.error.format() },
        { status: 400 }
      );
    }

    const { itemType, item } = parsed.data;
    const table =
      itemType === "revenue" ? financialRevenueItems : financialCostItems;
    const [created] = await db
      .insert(table)
      .values({
        category: item.category,
        amount: item.amount,
        notes: item.notes ?? null,
        evidenceUrl: item.evidenceUrl ?? null,
        sortOrder: item.sortOrder ?? null,
      })
      .returning();

    return NextResponse.json({ item: created }, { status: 201 });
  } catch (error) {
    console.error("/api/admin/financial POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
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

    const body = await request.json();
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", issues: parsed.error.format() },
        { status: 400 }
      );
    }

    const { itemType, id, item } = parsed.data;
    const table =
      itemType === "revenue" ? financialRevenueItems : financialCostItems;
    const [updated] = await db
      .update(table)
      .set({
        ...(item.category !== undefined ? { category: item.category } : {}),
        ...(item.amount !== undefined ? { amount: item.amount } : {}),
        ...(item.notes !== undefined ? { notes: item.notes } : {}),
        ...(item.evidenceUrl !== undefined
          ? { evidenceUrl: item.evidenceUrl }
          : {}),
        ...(item.sortOrder !== undefined ? { sortOrder: item.sortOrder } : {}),
      })
      .where(eq(table.id, id))
      .returning();

    return NextResponse.json({ item: updated }, { status: 200 });
  } catch (error) {
    console.error("/api/admin/financial PUT error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
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

    const body = await request.json();
    const parsed = DeleteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", issues: parsed.error.format() },
        { status: 400 }
      );
    }

    const { itemType, id } = parsed.data;
    const table =
      itemType === "revenue" ? financialRevenueItems : financialCostItems;
    const [deleted] = await db
      .delete(table)
      .where(eq(table.id, id))
      .returning();

    return NextResponse.json({ item: deleted }, { status: 200 });
  } catch (error) {
    console.error("/api/admin/financial DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
