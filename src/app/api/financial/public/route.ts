import { NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import {
  financialRevenueItems,
  financialCostItems,
} from "@/lib/db/schemas/financial";

export async function GET() {
  try {
    // CI smoke mode: return empty arrays without hitting DB
    if (process.env.CI_SMOKE === "1") {
      return NextResponse.json(
        { revenues: [], costs: [] },
        {
          status: 200,
          headers: {
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
          },
        }
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

    console.log("Financial API Debug:");
    console.log("Revenues count:", revenues.length);
    console.log("Costs count:", costs.length);
    console.log("Revenues array:", revenues);
    console.log("Costs array:", costs);
    console.log("Database query successful, checking if tables exist...");

    // Also test a simple count query
    const revenueCount = await db.$count(financialRevenueItems);
    const costCount = await db.$count(financialCostItems);
    console.log("Revenue table count:", revenueCount);
    console.log("Cost table count:", costCount);

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
