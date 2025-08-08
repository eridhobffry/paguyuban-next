import { NextRequest, NextResponse } from "next/server";
import { verifyToken, isAdmin } from "@/lib/auth";
import { db } from "@/lib/db/drizzle";
import { financialRevenueItems, financialCostItems } from "@/lib/db/schema";
import { z } from "zod";
import { User } from "@/lib/db";

const FinancialResponse = z.object({
  revenues: z.array(
    z.object({
      id: z.string().uuid(),
      category: z.string(),
      amount: z.number(),
      notes: z.string().nullable().optional(),
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
