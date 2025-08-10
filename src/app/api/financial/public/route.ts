import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import { financialRevenueItems, financialCostItems } from "@/lib/db/schema";
import { verifyToken } from "@/lib/auth";
import type { User } from "@/lib/sql";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decoded = verifyToken(token) as User | null;
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    return NextResponse.json(
      { revenues, costs },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    console.error("/api/financial/public GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
