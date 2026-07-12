import { fetchQuery } from "convex/nextjs";
import { NextResponse } from "next/server";
import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";

export const runtime = "nodejs";
// Convex runtime references exist even when local generated typings lag behind
// new modules during implementation.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sessionsApi = (api as Record<string, any>).sessions;

export async function GET(
  _request: Request,
  context: RouteContext<"/api/session/[id]">,
) {
  const { id } = await context.params;
  const session = await fetchQuery(sessionsApi.getById, {
    id: id as Id<"sessions">,
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json({ session });
}
