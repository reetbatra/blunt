# Blunt

An AI speech coach that roasts how you actually talk, tells you exactly what to fix, and makes you say it again until you stop rambling.

This repo currently holds the waitlist landing page. The product (record, get roasted, re-record) ships next, in this same app.

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

## Waitlist data

Emails live in the Convex `waitlist` table. The export queries are internal, so they are not callable from the public deployment URL:

```bash
npx convex run waitlist:list    # all signups, newest first
npx convex run waitlist:count   # total
```

## API

`POST /api/waitlist` with `{ "email": "...", "source": "..." }`. Validates and lowercases the email, dedupes against existing signups, and drops honeypot submissions without storing them.
