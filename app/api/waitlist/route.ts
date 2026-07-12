import { NextResponse } from "next/server";
import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const runtime = "nodejs";

export async function POST(request: Request) {
  let payload: { email?: unknown; source?: unknown; company?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Honeypot field: humans never see it. Bots that fill it get a fake
  // success so they stop retrying, and nothing is stored.
  if (typeof payload.company === "string" && payload.company.length > 0) {
    return NextResponse.json({ ok: true, already: false });
  }

  const email =
    typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json(
      { error: "Enter a valid email address" },
      { status: 400 },
    );
  }

  const source =
    typeof payload.source === "string" ? payload.source.slice(0, 64) : undefined;

  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    console.error("NEXT_PUBLIC_CONVEX_URL is not set");
    return NextResponse.json(
      { error: "Waitlist is not configured" },
      { status: 500 },
    );
  }

  try {
    const result = await fetchMutation(api.waitlist.join, { email, source });
    return NextResponse.json({ ok: true, already: result.already });
  } catch (error) {
    console.error("Waitlist join failed:", error);
    return NextResponse.json(
      { error: "Couldn't save your email, try again" },
      { status: 500 },
    );
  }
}
