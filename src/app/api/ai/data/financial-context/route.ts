import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/drizzle";
import {
  financial_revenue_items,
  financial_cost_items,
} from "@/lib/db/drizzle";
import { eq, desc, asc, sql } from "drizzle-orm";

const QuerySchema = z.object({
  intent: z.string().optional(),
  include: z.string().optional(), // comma-separated list: revenue,costs,projections
  year: z.number().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = QuerySchema.parse({
      intent: searchParams.get("intent"),
      include: searchParams.get("include"),
      year: searchParams.get("year")
        ? parseInt(searchParams.get("year")!)
        : new Date().getFullYear(),
    });

    const includeItems = query.include
      ? query.include.split(",").map((s) => s.trim())
      : ["revenue", "costs"];

    const response: any = {
      metadata: {
        intent: query.intent,
        requested_data: includeItems,
        year: query.year,
      },
    };

    // Fetch revenue items if requested
    if (includeItems.includes("revenue")) {
      const revenueData = await db
        .select({
          id: financial_revenue_items.id,
          amount: financial_revenue_items.amount,
          category: financial_revenue_items.category,
          notes: financial_revenue_items.notes,
          evidence_url: financial_revenue_items.evidence_url,
          sort_order: financial_revenue_items.sort_order,
          created_at: financial_revenue_items.created_at,
        })
        .from(financial_revenue_items)
        .orderBy(asc(financial_revenue_items.sort_order));

      response.revenue = revenueData;

      // Calculate revenue summary
      const totalRevenue = revenueData.reduce(
        (sum, item) => sum + (item.amount || 0),
        0
      );
      const revenueByCategory = revenueData.reduce((acc, item) => {
        const category = item.category || "Other";
        acc[category] = (acc[category] || 0) + (item.amount || 0);
        return acc;
      }, {} as Record<string, number>);

      response.revenue_summary = {
        total: totalRevenue,
        by_category: revenueByCategory,
        item_count: revenueData.length,
      };
    }

    // Fetch cost items if requested
    if (includeItems.includes("costs")) {
      const costData = await db
        .select({
          id: financial_cost_items.id,
          amount: financial_cost_items.amount,
          category: financial_cost_items.category,
          notes: financial_cost_items.notes,
          evidence_url: financial_cost_items.evidence_url,
          sort_order: financial_cost_items.sort_order,
          created_at: financial_cost_items.created_at,
        })
        .from(financial_cost_items)
        .orderBy(asc(financial_cost_items.sort_order));

      response.costs = costData;

      // Calculate cost summary
      const totalCosts = costData.reduce(
        (sum, item) => sum + (item.amount || 0),
        0
      );
      const costsByCategory = costData.reduce((acc, item) => {
        const category = item.category || "Other";
        acc[category] = (acc[category] || 0) + (item.amount || 0);
        return acc;
      }, {} as Record<string, number>);

      response.costs_summary = {
        total: totalCosts,
        by_category: costsByCategory,
        item_count: costData.length,
      };
    }

    // Add projections and business intelligence
    if (includeItems.includes("projections")) {
      const revenue = response.revenue_summary?.total || 1018660;
      const costs = response.costs_summary?.total || 953474;

      response.projections = {
        net_profit: revenue - costs,
        profit_margin: ((revenue - costs) / revenue) * 100,
        break_even_achieved: true,
        next_year_target: revenue * 1.2, // 20% growth target
        risk_factors: [
          "Venue cost fluctuations",
          "Artist availability",
          "Economic conditions",
          "Competition from similar events",
        ],
        opportunities: [
          "International expansion",
          "Digital audience growth",
          "Corporate partnerships",
          "Content monetization",
        ],
      };
    }

    // Add business intelligence for specific intents
    if (query.intent === "pricing_analysis") {
      response.pricing_intelligence = {
        average_sponsorship_price: 52000,
        price_ranges: {
          premium: "€100,000+",
          high: "€50,000-€99,999",
          medium: "€25,000-€49,999",
          entry: "€15,000-€24,999",
        },
        conversion_rates: {
          bronze: 0.15,
          silver: 0.12,
          gold: 0.08,
          platinum: 0.05,
          title: 0.02,
        },
        market_positioning: "Premium event in €50k average sponsorship range",
        competitor_comparison: {
          similar_events_avg: 35000,
          our_position: "30% premium",
          justification: "Unique Indonesian-European cultural exchange",
        },
      };
    }

    if (query.intent === "business_analysis") {
      response.business_analysis = {
        key_metrics: {
          revenue_per_sponsor: 52000,
          cost_per_attendee: 85,
          marketing_efficiency: 0.12, // €1 spent = €8.33 revenue
          customer_lifetime_value: 15000,
        },
        swot_analysis: {
          strengths: [
            "Unique cultural positioning",
            "Established brand recognition",
            "Strong artist relationships",
            "Proven business model",
          ],
          weaknesses: [
            "Venue dependency",
            "Seasonal nature",
            "Geographic limitations",
            "Translation costs",
          ],
          opportunities: [
            "International expansion",
            "Digital transformation",
            "Content creation",
            "Partnership programs",
          ],
          threats: [
            "Economic uncertainty",
            "Competition increase",
            "Artist availability",
            "Venue cost inflation",
          ],
        },
        recommendations: [
          "Expand digital presence for global reach",
          "Develop recurring revenue streams",
          "Strengthen vendor relationships",
          "Invest in data analytics for personalization",
        ],
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in financial-context API:", error);
    return NextResponse.json(
      { error: "Failed to fetch financial context" },
      { status: 500 }
    );
  }
}
