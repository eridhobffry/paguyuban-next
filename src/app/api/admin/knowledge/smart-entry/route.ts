import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateText } from "@/lib/ai/gemini-client";

// Zod schema for smart entry request
const smartEntrySchema = z.object({
  description: z.string().min(1, "Description is required"),
  currentKnowledge: z.record(z.unknown()).default({}),
});

// POST /api/admin/knowledge/smart-entry - AI-powered smart knowledge entry
export async function POST(request: NextRequest) {
  try {
    // TODO: Add proper authentication when auth system is integrated

    const body = await request.json();
    const validatedData = smartEntrySchema.parse(body);

    const prompt = `You are an AI assistant helping to manage knowledge for the Paguyuban Messe 2026 event management system.

USER REQUEST: "${validatedData.description}"

CURRENT KNOWLEDGE STRUCTURE:
${JSON.stringify(validatedData.currentKnowledge, null, 2)}

INSTRUCTIONS:
1. Analyze the user's request and determine what knowledge should be added, updated, or deleted
2. Choose the appropriate path in the knowledge structure using dot notation
3. Determine the correct data type and value
4. If it's a new category, create a logical structure that fits the existing knowledge organization
5. Return the COMPLETE updated knowledge structure (not just the changes)

KNOWLEDGE CATEGORIES (use these for organization):
- event: Event details (name, dates, location, venue, attendance)
- financials: Revenue, costs, profit calculations
- sponsorship: Sponsor tiers, pricing, benefits
- tickets: Ticket types and pricing
- contact: Contact information
- program: Event schedule and activities
- technology: Tech platform details
- artists: Performer information
- market: Market data and statistics

RESPONSE FORMAT (JSON only):
{
  "updatedKnowledge": { /* complete updated knowledge object */ },
  "changes": [
    {
      "action": "added|updated|deleted",
      "path": "the.path.to.change",
      "value": "new value or null for deletions",
      "reasoning": "brief explanation"
    }
  ],
  "summary": "Brief summary of what was changed"
}

Respond with valid JSON only. Make intelligent decisions about data organization and structure.`;

    try {
      const aiResponse = await generateText(prompt, {
        temperature: 0.3,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2000,
      });

      if (!aiResponse) {
        throw new Error("No response from AI");
      }

      // Extract JSON from AI response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Invalid AI response format");
      }

      const result = JSON.parse(jsonMatch[0]);

      return NextResponse.json({
        updatedKnowledge:
          result.updatedKnowledge || validatedData.currentKnowledge,
        changes: result.changes || [],
        summary: result.summary || "Knowledge updated successfully",
        timestamp: new Date().toISOString(),
      });
    } catch (aiError) {
      console.error("AI processing error:", aiError);

      // Fallback: Simple text-based processing
      return NextResponse.json({
        updatedKnowledge: {
          ...validatedData.currentKnowledge,
          userEntries: {
            ...((validatedData.currentKnowledge as any)?.userEntries || {}),
            [new Date().toISOString()]: validatedData.description,
          },
        },
        changes: [
          {
            action: "added",
            path: `userEntries.${new Date().toISOString()}`,
            value: validatedData.description,
            reasoning:
              "Fallback: Added as user entry due to AI processing error",
          },
        ],
        summary: "Entry added (AI processing unavailable)",
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("Error processing smart entry:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request format", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to process smart entry" },
      { status: 500 }
    );
  }
}
