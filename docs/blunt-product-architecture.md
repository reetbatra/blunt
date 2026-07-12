# Blunt Product Architecture

## Surface area

- Production host: `https://bluntapp.reetbatra.com`
- `/` stays the marketing and waitlist page
- `/coach` is the product loop
- `POST /api/prompt` returns a prompt for a chosen category
- `POST /api/session` handles one recorded attempt
- `GET /api/session/[id]` returns a stored session record

## Session pipeline

1. Client requests a prompt by category.
2. Browser records audio with `MediaRecorder`.
3. Client posts `multipart/form-data` with:
   - `audio`
   - `prompt`
   - `durationMs`
   - optional `previousSessionId`
4. Server rejects malformed uploads and invalid re-record chains early.
5. Recordings under three seconds short-circuit into a retry response.
6. OpenAI transcribes the audio.
7. OpenAI scores the transcript into strict JSON when available.
8. If scoring fails, a local heuristic fallback still returns quote-based feedback.
9. ElevenLabs turns critique text into audio when configured.
10. Convex stores the finished session and links re-records to the original.

## Convex tables

### `waitlist`

Existing landing-page emails. Export queries remain internal-only.

### `users`

Reserved for future paid/history flows.

### `sessions`

Stores:

- prompt metadata
- transcript
- duration
- status (`scored`, `too_short`, `non_english`)
- filler metrics
- framework metrics
- pace
- vocabulary level
- critique text
- optional critique audio data URL
- strongest/weakest quoted lines
- optional `previousSessionId`

## Failure modes

### Too short

Anything under roughly three seconds returns:

`Didn't catch enough to score that, try again.`

No spinner trap, no fake metrics.

### Non-English

The scorer returns an explicit English-only critique instead of pretending it can judge accurately.

### Voice generation failure

If ElevenLabs is missing, slow, or errors, the UI still renders the written critique and the session persists.

### Invalid re-record

The UI disables re-record until a first scored take exists. The API also rejects missing or mismatched `previousSessionId` values.

## Testing strategy

- Unit tests for prompt selection and fallback analysis
- Route tests for `/api/prompt`
- UI tests for landing-page continuity and re-record guardrails
- Production build verification with Next.js
