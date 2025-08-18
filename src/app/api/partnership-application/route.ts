import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  ensurePartnershipApplicationsTable,
  createPartnershipApplication,
  type PartnershipApplicationInput,
} from "@/lib/sql";
import { notifyAdminNewPartnershipApplication } from "@/lib/email";
import { db } from "@/lib/db/drizzle";
import { chatbotSummaries, analyticsSessions } from "@/lib/db/schema";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

const Schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email(),
  company: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  interest: z.string().optional().nullable(),
  budget: z.string().optional().nullable(),
  message: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    await ensurePartnershipApplicationsTable();
    const body = await request.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", issues: parsed.error.format() },
        { status: 400 }
      );
    }

    const input: PartnershipApplicationInput = parsed.data;
    const created = await createPartnershipApplication(input);

    // Also create a chatbot summary so the admin follow-ups list is populated
    // Create a session first to satisfy FK, then insert the summary.
    try {
      const sessionId = randomUUID();
      // Build a comprehensive, human-readable summary paragraph
      const parts: string[] = [];
      const who = created.name ? `${created.name}` : "A prospective partner";
      const fromCompany = created.company ? ` from ${created.company}` : "";
      parts.push(`${who}${fromCompany} submitted a partnership inquiry via the website.`);

      if (created.interest) {
        parts.push(`They are interested in: ${created.interest}.`);
      }
      if (created.budget) {
        parts.push(`Budget indicated: ${created.budget}.`);
      }
      const contacts: string[] = [];
      if (created.email) contacts.push(created.email);
      if (created.phone) contacts.push(created.phone);
      if (contacts.length) {
        parts.push(`Contact: ${contacts.join(" · ")}.`);
      }
      if (created.source) {
        parts.push(`Source: ${created.source}.`);
      }
      if (created.message) {
        parts.push(`Message: ${created.message}`);
      }
      const summary = parts.join(" ");

      // Create analytics session row (minimal fields; startedAt defaults)
      await db.insert(analyticsSessions).values({
        id: sessionId,
        routeFirst: "/api/partnership-application",
        referrer: created.source ?? null,
      });

      await db
        .insert(chatbotSummaries)
        .values({ sessionId, summary, sentiment: "neutral" });
    } catch {}

    // Best-effort admin notification
    try {
      await notifyAdminNewPartnershipApplication({
        name: created.name,
        email: created.email,
        company: created.company ?? null,
        phone: created.phone ?? null,
        interest: created.interest ?? null,
        message: created.message ?? null,
        source: created.source ?? null,
      });
    } catch {}

    return NextResponse.json(
      { message: "Application received", application: created },
      { status: 201 }
    );
  } catch (error) {
    console.error("/api/partnership-application POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
