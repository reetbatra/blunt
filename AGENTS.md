<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Blunt — agent instructions

Blunt is an AI speech coach: the user records themselves answering a prompt, gets a spoken critique that is specific and a little mean, then immediately re-records the same prompt and sees a before/after comparison. The re-record loop is the product. Never cut it, never bury it behind a "done" or "share" action.

## Current state

The waitlist landing page is live at `/`. The product loop is not built yet. When building it, keep the landing page working: it collects emails and must never break.

## Product rules (from the PRD, non-negotiable)

- Critique feedback must cite the user's actual words. "You said 'like' six times, try a pause instead" is the standard. Generic feedback like "be more confident" is banned everywhere: prompts, UI copy, LLM system prompts.
- No auth wall before first value. Anonymous sessions by default.
- English only for now, and the UI says so out loud.
- Edge cases are features, not skips: recordings under ~3 seconds get "didn't catch enough to score that, try again"; voice generation failure falls back to written critique, never a hanging spinner; a re-record without a prior session is blocked in the UI.

## Stack

- Next.js App Router + TypeScript + Tailwind v4, deployed on Vercel
- Convex: `waitlist` table now; `users` and `sessions` tables when the product ships
- Product services (not wired yet): OpenAI Whisper for transcription, OpenAI for scoring, ElevenLabs for the spoken critique

## Conventions

- Waitlist export queries (`waitlist:list`, `waitlist:count`) are `internalQuery`. Anything that reads the email list must stay internal.
- Brand voice in all user-facing copy: blunt, specific, slightly mean, never corporate. No em dashes.
- Design tokens live in `app/globals.css`: near-black background, off-white text, `#ff4d00` accent, Archivo Black for display type, Geist Mono for transcript-styled text.
- Run `npx convex dev` alongside `npm run dev`; the API route needs a live Convex backend.
