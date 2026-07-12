import { fetchQuery } from "convex/nextjs";
import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";

export const runtime = "nodejs";
// Convex runtime references exist even when local generated typings lag behind
// new modules during implementation.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sessionsApi = (api as Record<string, any>).sessions;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const anonymousId = searchParams.get("anonymousId")?.trim();

  if (!anonymousId) {
    return NextResponse.json(
      { error: "Anonymous id is required" },
      { status: 400 },
    );
  }

  const [sessions, progress] = await Promise.all([
    fetchQuery(sessionsApi.listByAnonymousId, { anonymousId }),
    fetchQuery(sessionsApi.getProgressByAnonymousId, { anonymousId }),
  ]);

  return NextResponse.json({ sessions, progress });
}
