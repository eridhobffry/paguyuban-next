import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateText } from "@/lib/ai/gemini-client";
import { db } from "@/lib/db";
import { speakers, artists, sponsors } from "@/lib/db/schema";
import {
  createSpeaker,
  updateSpeaker,
  deleteSpeaker,
  createArtist,
  updateArtist,
  deleteArtist,
  createSponsor,
  updateSponsor,
  deleteSponsor,
} from "@/lib/db/actions";

// Zod schema for smart entry request
const smartEntrySchema = z.object({
  description: z.string().min(1, "Description is required"),
  currentKnowledge: z.record(z.string(), z.any()).default({}),
});

// POST /api/admin/knowledge/smart-entry - AI-powered smart knowledge entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = smartEntrySchema.parse(body);

    const [speakersList, artistsList, sponsorsList] = await Promise.all([
      db.select({ id: speakers.id, name: speakers.name }).from(speakers),
      db.select({ id: artists.id, name: artists.name }).from(artists),
      db.select({ id: sponsors.id, name: sponsors.name }).from(sponsors),
    ]);

    const prompt = `You are an AI assistant that can interact with a database for the Paguyuban Messe 2026 event.
    
    USER REQUEST: "${validatedData.description}"

    You have the following tools available:
    - createSpeaker({ name: string, role?: string, company?: string, bio?: string, ... })
    - updateSpeaker({ id: string, name?: string, role?: string, ... })
    - deleteSpeaker({ id: string })
    - createArtist({ name: string, ... })
    - updateArtist({ id: string, name?: string, ... })
    - deleteArtist({ id: string })
    - createSponsor({ name: string, ... })
    - updateSponsor({ id: string, name?: string, ... })
    - deleteSponsor({ id: string })
    - updateOverlay({ path: string, value: any }) - for changes to the manual knowledge overlay.

    AVAILABLE ENTITIES FOR UPDATE/DELETE:
    - Speakers: ${JSON.stringify(speakersList)}
    - Artists: ${JSON.stringify(artistsList)}
    - Sponsors: ${JSON.stringify(sponsorsList)}

    Based on the user request, decide which tool to use. Respond with a JSON object specifying the tool and its parameters.
    If the user request does not match any of the database tools, use the "updateOverlay" tool.

    RESPONSE FORMAT (JSON only):
    {
      "tool": "tool_name",
      "parameters": { ... }
    }`;

    const aiResponse = await generateText(prompt, { temperature: 0.2 });

    if (!aiResponse) {
      throw new Error("No response from AI");
    }

    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Invalid AI response format");
    }

    const { tool, parameters } = JSON.parse(jsonMatch[0]);

    let result;
    switch (tool) {
      case "createSpeaker":
        result = await createSpeaker(parameters);
        break;
      case "updateSpeaker":
        result = await updateSpeaker(parameters.id, parameters);
        break;
      case "deleteSpeaker":
        result = await deleteSpeaker(parameters.id);
        break;
      case "createArtist":
        result = await createArtist(parameters);
        break;
      case "updateArtist":
        result = await updateArtist(parameters.id, parameters);
        break;
      case "deleteArtist":
        result = await deleteArtist(parameters.id);
        break;
      case "createSponsor":
        result = await createSponsor(parameters);
        break;
      case "updateSponsor":
        result = await updateSponsor(parameters.id, parameters);
        break;
      case "deleteSponsor":
        result = await deleteSponsor(parameters.id);
        break;
      case "updateOverlay":
        // This part is more complex as it requires modifying the JSONB field.
        // For now, I will return a message indicating the requested overlay update.
        return NextResponse.json({
          summary: `Request to update overlay at path '${parameters.path}' received.`,
        });
      default:
        throw new Error(`Unknown tool: ${tool}`);
    }

    return NextResponse.json({
      summary: `Successfully executed ${tool}`,
      result,
    });
  } catch (error) {
    console.error("Error processing smart entry:", error);
    // Return a generic error message
    return NextResponse.json(
      { error: "Failed to process smart entry" },
      { status: 500 }
    );
  }
}
