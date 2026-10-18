# roastmybio

roastmybio reviews a dating profile from uploaded screenshots. The same
analysis is delivered in one of two modes:

- **Roast** (the default): a comedy voice note at one of two heat levels (Go easy / No chill · 18+), plus shareable roast cards.
- **Serious**: a score out of 10, sub-scores, top fixes with sources, photo order and prompt rewrites.

Built with Next.js 16 (App Router) and React 19 from the design handoff.

## Run it

```bash
npm install
ANTHROPIC_API_KEY=... OPENAI_API_KEY=... npm run dev   # http://localhost:3000
npm test           # unit tests (vitest)
npm run lint
npm run typecheck
npm run build
```

Demo results you can open without uploading anything:

- `/result/demo-serious`: free teaser, then unlock to the full serious review
- `/result/demo-roast`: roast result, No chill
- `/result/demo-roast-easy`: roast result, Go easy
- `/s/demo-roast`: public share page, with the card as its `og:image`
- `/cards`: every roast card direction side by side (design review)

## Routes

| Route | What it is |
| --- | --- |
| `/` | Landing page, in roast mode by default. The Roast/Serious toggle re-themes the whole page. Contains the upload form, which previews each screenshot as it's added. `?mode=serious` opens in serious mode. |
| `/result/[id]` | The result. Serious analyses show the teaser/paywall, then the full review. Roast analyses show the roast; `?view=serious` shows the serious review of the same analysis. |
| `/s/[id]` | Public share page for a roast card. |
| `/cards` | Card gallery: all four directions, both heat levels, feed formats and the video frame. |
| `POST /api/analyze` | Multipart upload: `screenshots` (1–9 PNG/JPG, ≤10 MB each), `mode`, `looking`, `app`, `heat`, `voice`, `adult`. Returns `{ id }`. |
| `GET /api/voice/[id]` | The roast's voice note as MP3. Answers byte ranges (Safari needs them to play audio). 404 when the result has no recorded note. |
| `GET /api/card/[id]` | Card PNG. Query: `kind=verdict\|line`, `line`, `format=9:16\|4:5\|1:1`, `t=verdict\|poster\|voice\|receipt`. |
| `POST /api/roast/[id]/soften` | "Too much? Go easy on me": re-runs the roast at the lower heat and returns the new `{ id }`. |

## Roast cards

Card artwork is authored at export size (1080×1920, 1080×1350, 1080×1080). Each
card template is a React component that renders the shared `RoastCard` model
(`lib/types.ts`). The same component renders in two places:

- **In the browser** for previews (`components/cards/CardPreview.tsx`, `/cards`)
- **On the server as PNG** through `next/og` (Satori) in `/api/card/[id]`

Because of that, card markup follows Satori's rules. See the header of
`components/cards/kit.tsx`: it uses flex only, no fragments, no `calc()`, and
mixed-colour text is split into word boxes. Generated copy varies in length, so
text is sized to fit using the bundled fonts' advance widths
(`components/cards/fit.ts`). Static font files for Satori live in `assets/fonts/`.

The final card direction hasn't been chosen, so the layout is swappable:

| Template | Ref | Formats |
| --- | --- | --- |
| `verdict`: The Verdict (default) | 1a, 1e, 1f | 9:16, 4:5, 1:1 |
| `poster`: Hot Take Poster | 1b | 9:16 |
| `voice`: The Voice Note | 1c | 9:16 |
| `receipt`: The Receipt | 1d | 9:16 |

Set the default with `NEXT_PUBLIC_CARD_TEMPLATE`, or override it per image with
`?t=`. Directions that only have a 9:16 design fall back to The Verdict for 4:5
and 1:1.

## Roaster profiles

System prompts for each roaster persona live in [`prompts/roasters/`](prompts/roasters/):

| persona id | name | file |
| --- | --- | --- |
| `prosecutor` | The Prosecutor (No Chill) | [`prosecutor_system.md`](prompts/roasters/prosecutor_system.md) |
| `genz` | The Comment Section (Gen Z) | [`genz_system.md`](prompts/roasters/genz_system.md) |

Each prompt takes a JSON profile (`language`, `age`, `looking_for`, `photos`, `bio`, `prompts`) as the user message and returns a single JSON object with `persona`, `script`, `jokes`, `cards` and `word_count`.

## Analysis

`analyzeProfile()` in `lib/analyze.ts` sends the screenshots (downscaled to JPEG with `sharp`) to Claude in one call (`lib/review.ts`). The model first writes down what is on the profile (each photo, the bio, every prompt), then scores photos, prompts and bio against a fixed rubric, and writes the fixes, photo order, rewrites and, in roast mode, the roast.

The arithmetic happens in code (`lib/scoring.ts`), not in the model:

- **Overall score** = photos × 0.5 + prompts × 0.3 + bio × 0.2, one decimal.
- **Cringe-o-meter** = the sum of the roast receipt's line items, capped at 10.
- **Photo / prompt counts** in the result header are the numbers the model read off the screenshots.

The result is stored once, and the free preview, the paywall teaser and the unlocked review all render that same stored result, so the score shown before paying is the score after. "Too much? Go easy on me" re-runs only the roast from the stored profile facts; the serious review and score carry over unchanged.

## Voice note

When the roast is delivered as a voice note (the "Voice note" switch on the upload form), it is recorded right after the review:

1. **Script.** In the same call that writes the roast, Claude also writes `script`: one spoken part per roast line, in the order they are delivered (the first opens with the verdict), then a closing part that runs through the real fixes. It is written for the ear, in the heat's voice. `toRoast()` stores each part on its voice-note segment (`segment.text`). A line the script skipped is read as its joke.
2. **Audio.** `voiceOver()` in `lib/voice.ts` sends each part to OpenAI's text-to-speech (`gpt-4o-mini-tts`) in parallel. Go easy uses a warm, teasing voice (`coral`) and No chill a cold, deadpan one (`onyx`). The closing fixes part gets its own delivery instructions so the bit drops for the fixes.
3. **Timing.** The clips are joined into one MP3 (`lib/mp3.ts` copies the audio frames over and leaves out each clip's tags and VBR header). Each clip's length is read from its frames, so the note's length and every "Now roasting" start time come from the real audio instead of a word-count estimate.
4. **Playback.** The MP3 is stored with the result and served from `/api/voice/[id]`, which `roast.voice.audioUrl` points at. The play button plays it, and "Share card + voice note" attaches it to the share sheet (or downloads it). "Share this line" shares only the card.

"Too much? Go easy on me" records a new note for the softer roast. If text-to-speech isn't configured or fails, the roast still works: the result keeps its estimated timings, the player runs on a clock, and the share button reads "Share card". The demo results have no recorded audio.

Without `ANTHROPIC_API_KEY`, `npm run dev` falls back to the sample result with a visible "Sample result" notice, and production returns a 503 instead of showing made-up numbers.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | — | Required for real analysis. |
| `ANTHROPIC_WORKSPACE_ID` | — | Only for API keys that aren't scoped to a workspace: the workspace to bill requests to. |
| `OPENAI_API_KEY` | — | Records the roast's voice note with OpenAI text-to-speech. Without it, there's no audio. |
| `OPENAI_TTS_MODEL` | `gpt-4o-mini-tts` | Text-to-speech model. It must accept `instructions`. |
| `OPENAI_BASE_URL` | `https://api.openai.com/v1` | Only to send text-to-speech through a proxy or a compatible endpoint. |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | Absolute base for share-page metadata (`og:image`). Its host is also the link printed on roast cards (just "roastmybio" when local). |
| `NEXT_PUBLIC_CARD_TEMPLATE` | `verdict` | Which roast card direction the share flow uses. |

## Not built yet

These parts are stubbed so the whole flow can be exercised end to end:

- **Sources**: fixes carry an evidence tag, but their source fields are still placeholders. Screenshots are discarded after analysis; only what was read off them is kept.
- **Storage**: results and their voice-note MP3s (a few hundred KB each) are kept in memory (`lib/store.ts`). They're lost on restart and aren't shared across server instances.
- **Checkout**: the unlock buttons reveal the review in place. Quick check shows only the biggest fix. Unlock state isn't persisted.
- **Video**: the 1f frame is drawn, but MP4 rendering isn't built. The "+ video" share option stays hidden until it is.
- **Photo order tiles**: these show placeholders. The real tiles would be the user's photos, which aren't retained.
- **Placeholders from the design**: `[PRICE]`, `[PRIVACY PROMISE]`, source fields, and the Privacy / Terms / Sources pages.
