import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8001";

const BodySchema = z.object({
  message: z.string().min(1),
  assistantType: z.enum(["ucup", "rima"]).default("ucup"),
  mode: z.enum(["auto", "local"]).optional(),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: any;

  try {
    const json = await req.json();
    body = BodySchema.parse(json);
  } catch (validationError) {
    console.error("Validation error:", validationError);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    // First, try the EventChatAgent for event-specific questions
    try {
      const eventResponse = await fetch(`${AI_SERVICE_URL}/api/event/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: body.message,
        }),
      });

      if (eventResponse.ok) {
        const eventData = await eventResponse.json();
        return NextResponse.json({
          reply: eventData.result,
          agent: "event_chat",
          fallback: false,
        });
      }
    } catch (eventError) {
      // EventChatAgent failed, continue to general chat
      console.log("EventChatAgent failed, trying general chat:", eventError);
    }

    // Fallback to general conversational agent
    const response = await fetch(`${AI_SERVICE_URL}/api/chat/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: body.message,
        context: {
          assistant_type: body.assistantType,
          mode: body.mode || "auto",
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`AI service responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json({
      reply: data.result,
      agent: "conversational",
      fallback: false,
    });
  } catch (error) {
    console.error("/api/chat/generate error", error);

    // Fallback to local knowledge if AI service is unavailable
    try {
      const { paguyubanChat } = await import("@/lib/gemini");
      const reply = await paguyubanChat.chat(body.message, body.assistantType, {
        mode: "local",
      });
      return NextResponse.json({ reply, fallback: true });
    } catch (fallbackError) {
      console.error("Fallback also failed:", fallbackError);
      return NextResponse.json({ error: "chat_failed" }, { status: 500 });
    }
  }
}
