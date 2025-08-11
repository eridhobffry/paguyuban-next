import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { paguyubanChat } from "@/lib/gemini";

const BodySchema = z.object({
  message: z.string().min(1),
  assistantType: z.enum(["ucup", "rima"]).default("ucup"),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const json = await req.json();
    const body = BodySchema.parse(json);
    const reply = await paguyubanChat.chat(body.message, body.assistantType);
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("/api/chat/generate error", error);
    return NextResponse.json({ error: "chat_failed" }, { status: 500 });
  }
}
