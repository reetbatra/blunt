# Blunt

An AI speech coach that roasts how you actually talk, tells you exactly what to fix, and makes you say it again until you stop rambling.

This repo now ships both:

- `/`: the waitlist landing page
- `/coach`: the product loop itself

Production domain: `https://bluntapp.reetbatra.com`

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS v4
- Convex for the waitlist (and session storage once the product ships)
- Deployed on Vercel

## Local development

You need two processes:

```bash
# 1. Convex backend (anonymous local mode works without an account)
npx convex dev

# 2. Next.js
npm run dev
```

`npx convex dev` writes `NEXT_PUBLIC_CONVEX_URL` to `.env.local` on first run. See `.env.example` for the variables the app expects.

For the product loop at `/coach`, you also need:

```bash
OPENAI_API_KEY=...
```

Optional, but recommended for spoken critique:

```bash
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID=...
```

If ElevenLabs is missing or fails, the UI falls back to text critique instead of hanging.

## Product loop

The coaching app lives at `/coach` and implements the full MVP loop:

1. Pick a category and spin a prompt
2. Record a mic answer with a 60-second cap
3. Transcribe with OpenAI
4. Score against the rubric with structured JSON output
5. Generate spoken critique with ElevenLabs when available
6. Force the same-prompt re-record loop
7. Show before/after comparison for fillers, pace, structure, and transcript

The core product rules from the PRD are enforced:

- Critique must cite actual user words
- English only
- No auth wall before first value
- Recordings under ~3 seconds return a clean retry message
- Voice generation failure falls back to text critique
- Re-records are blocked unless a first scored take exists, and the API also validates the session link

## Persistence

Convex now stores:

- `waitlist`
- `users`
- `sessions`

Session records include the prompt, transcript, status, rubric metrics, critique text, optional spoken critique audio, and the `previousSessionId` link for re-record comparisons.

## Tests

Run the automated checks with:

```bash
npm run lint
npm run test:run
npm run build
```

The test suite covers prompt generation, analysis fallbacks, route validation, and key UI guardrails.

## Waitlist data

Emails live in the Convex `waitlist` table. The export queries are internal, so they are not callable from the public deployment URL:

```bash
npx convex run waitlist:list    # all signups, newest first
npx convex run waitlist:count   # total
```

## API

`POST /api/waitlist` with `{ "email": "...", "source": "..." }`. Validates and lowercases the email, dedupes against existing signups, and drops honeypot submissions without storing them.

Additional product endpoints:

- `POST /api/prompt`
- `POST /api/session`
- `GET /api/session/:id`
