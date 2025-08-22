import { NextResponse } from "next/server";
import { reportingService } from "@/lib/reporting";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as
      | "financial"
      | "event"
      | "knowledge"
      | "chatbot"
      | undefined;

    if (type) {
      const report = await reportingService.generateReport(type);
      return NextResponse.json(report);
    } else {
      const reports = await reportingService.getAllReports();
      return NextResponse.json({
        reports,
        summary: {
          total: reports.length,
          types: reports.map((r) => r.type),
          generated: new Date().toISOString(),
        },
      });
    }
  } catch (error) {
    console.error("/api/reports GET error:", error);
    return NextResponse.json(
      { error: "Failed to generate reports" },
      { status: 500 }
    );
  }
}
