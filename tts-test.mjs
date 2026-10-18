// Quick TTS test for ProfileCheck — no dependencies, Node 18+.
// Run from this folder:  node tts-test.mjs            (default persona)
//                        node tts-test.mjs chef       (another persona)
// Writes test-output/<persona>.mp3

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

// Minimal .env loader so this works without dotenv or --env-file
try {
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {}

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error("OPENAI_API_KEY missing — check .env in this folder.");
  process.exit(1);
}

const PERSONAS = {
  prosecutor: {
    voice: "ash",
    instructions:
      "Dry, clinical, mildly disgusted. Speaks like reading evidence into the court record. Pause before the damning detail, then hit the last word hard.",
  },
  chef: {
    voice: "onyx",
    instructions:
      "Loud, exasperated, theatrical outrage, like a head chef inspecting a ruined plate. Speeds up when angry, then drops to a cold, quiet final line.",
  },
  mother: {
    voice: "coral",
    instructions:
      "Quiet, weary, a sigh in every sentence. Never shouts. Every line sounds like she expected better and is no longer surprised.",
  },
};

const ROAST = `Exhibit A. Six photos. Four of them... are you holding a fish.

At some point you have to ask who is actually being caught here.

Your bio says "love to travel." So does every airport. The airport at least has a personality.

And your prompt answer, "I'm looking for my partner in crime." The only crime here... is the lighting.`;

const persona = process.argv[2] ?? "prosecutor";
const p = PERSONAS[persona];
if (!p) {
  console.error(`Unknown persona "${persona}". Try: ${Object.keys(PERSONAS).join(", ")}`);
  process.exit(1);
}

const t0 = Date.now();
const res = await fetch("https://api.openai.com/v1/audio/speech", {
  method: "POST",
  headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "gpt-4o-mini-tts",
    voice: p.voice,
    instructions: p.instructions,
    input: ROAST,
    response_format: "mp3",
  }),
});

if (!res.ok) {
  console.error(`OpenAI error ${res.status}:`, await res.text());
  process.exit(1);
}

mkdirSync("test-output", { recursive: true });
const out = `test-output/${persona}.mp3`;
writeFileSync(out, Buffer.from(await res.arrayBuffer()));
console.log(`Saved ${out} (${ROAST.length} chars, ${((Date.now() - t0) / 1000).toFixed(1)}s)`);
