import { NextResponse } from "next/server";
import { getPrompt, isPromptCategory } from "@/lib/blunt/prompts";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let payload: { category?: unknown; seed?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (typeof payload.category !== "string" || !isPromptCategory(payload.category)) {
    return NextResponse.json(
      { error: "Pick a real prompt category" },
      { status: 400 },
    );
  }

  const seed = typeof payload.seed === "number" ? payload.seed : undefined;
  return NextResponse.json({ prompt: getPrompt(payload.category, seed) });
}
