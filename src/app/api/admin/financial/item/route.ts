import { NextRequest, NextResponse } from "next/server";
import { verifyToken, isAdmin } from "@/lib/auth";
import { db } from "@/lib/db/drizzle";
import { financialRevenueItems, financialCostItems } from "@/lib/db/schema";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { User } from "@/lib/sql";

const QuerySchema = z.object({
  id: z.string().uuid(),
  itemType: z.enum(["revenue", "cost"]),
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const itemType = searchParams.get("itemType");
    const parsed = QuerySchema.safeParse({ id, itemType });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query", issues: parsed.error.format() },
        { status: 400 }
      );
    }

    const { id: itemId, itemType: type } = parsed.data;
    const table =
      type === "revenue" ? financialRevenueItems : financialCostItems;

    const [item] = await db
      .select()
      .from(table)
      .where(eq(table.id, itemId))
      .limit(1);

    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ item }, { status: 200 });
  } catch (error) {
    console.error("/api/admin/financial/item GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
