"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "success" | "already" | "error";

export function WaitlistForm({ source }: { source: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const company = String(data.get("company") ?? "");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setStatus("error");
      setErrorMessage("That email doesn't look right. Blunt notices these things.");
      return;
    }

    setStatus("loading");
    setErrorMessage(null);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source, company }),
      });
      const json = (await res.json()) as { already?: boolean; error?: string };
      if (!res.ok) {
        throw new Error(json.error ?? "Request failed");
      }
      setStatus(json.already ? "already" : "success");
    } catch {
      setStatus("error");
      setErrorMessage("Couldn't save that. Give it another shot in a second.");
    }
  }

  if (status === "success") {
    return (
      <p
        role="status"
        className="border border-line px-5 py-4 font-mono text-sm text-foreground"
      >
        <span className="text-accent">You&apos;re in.</span> One email when Blunt
        opens. Practice your pauses until then.
      </p>
    );
  }

  if (status === "already") {
    return (
      <p
        role="status"
        className="border border-line px-5 py-4 font-mono text-sm text-foreground"
      >
        <span className="text-accent">Already on the list.</span> Eager. Blunt
        respects that.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="w-full">
      <div className="flex w-full flex-col gap-3 sm:flex-row">
        <label htmlFor={`email-${source}`} className="sr-only">
          Email address
        </label>
        <input
          id={`email-${source}`}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@wherever.com"
          className="h-14 w-full flex-1 border border-line bg-transparent px-5 font-mono text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
        />
        {/* Honeypot: hidden from real users, bots fill it and get ignored */}
        <input
          type="text"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute -left-[9999px] h-0 w-0 opacity-0"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="h-14 cursor-pointer bg-accent px-8 font-mono text-base font-bold uppercase tracking-wide text-background transition-colors duration-200 hover:bg-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 disabled:cursor-wait disabled:opacity-60"
        >
          {status === "loading" ? "Saving..." : "Get early access"}
        </button>
      </div>
      <p className="mt-3 font-mono text-xs text-muted">
        No spam. One email when Blunt opens the doors.
      </p>
      {status === "error" && errorMessage && (
        <p role="alert" className="mt-3 font-mono text-sm text-accent">
          {errorMessage}
        </p>
      )}
    </form>
  );
}
