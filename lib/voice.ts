import { joinMp3 } from './mp3';
import { round1 } from './scoring';
import type { Analysis, Heat, Roast } from './types';

// Turns a roast's spoken script into the voice note: the rant is read by
// OpenAI's text-to-speech in the heat's voice. The note's length comes from
// the audio itself.

export function voiceConfigured() {
  return Boolean(process.env.OPENAI_API_KEY);
}

const DELIVERY: Record<Heat, { voice: string; instructions: string }> = {
  genz: {
    voice: 'nova',
    instructions:
      "THE COMMENT SECTION: 22, chronically online, reading a stranger's dating profile out loud to the group chat at 2am. Bored, and the boredom is the insult: fast, flat, a little vocal fry, every line tilting slightly up at the end like a question that isn't. Never excited, never shouting; the meanest lines are the most casual. Anything in single quotes is their own words, read back flat and mocking. At most a short, dry exhale through the nose where something is genuinely funny, never a real laugh. Where the line trails off with a dash, lose interest and just stop.",
  },
  nochill: {
    voice: 'ash',
    instructions:
      "NO CHILL: an explosive, foul-mouthed roaster recording a voice memo seconds after opening someone's dating profile, and you are NOT okay. You take this profile as a personal attack. Volatile at all times: pitch shooting up, voice cracking on the peak word, explosive shouts, rapid-fire runs, dead stops. Moments of shrill, hysterical, near-screaming disbelief; shout the pivotal phrase like it's physically escaping you. Laughter that breaks through mid-sentence because you can't believe what you're looking at, then gets swallowed by more outrage. Incredulous scoffs, sharp inhales, a stunned silence before the next hit. Sometimes drop to a creepy calm and say a few words slowly, one at a time, before detonating again. Never flatline, and never scream the whole time: every outburst is triggered by a specific detail, and the calm parts make the next explosion bigger. Don't repeat the same laugh, gasp or scream pattern twice. The words stay intelligible even at full volume.",
  },
};

async function speak(text: string, voice: string, instructions: string): Promise<Uint8Array> {
  const base = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
  const res = await fetch(`${base}/audio/speech`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts',
      voice,
      input: text,
      instructions,
      response_format: 'mp3',
    }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new Error(`Text-to-speech failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
  return new Uint8Array(await res.arrayBuffer());
}

/** Reads the script aloud and times the note from its audio. */
export async function recordVoiceNote(
  heat: Heat,
  script: string,
): Promise<{ mp3: Uint8Array<ArrayBuffer>; voice: Omit<Roast['voice'], 'audioUrl'> }> {
  const { voice, instructions } = DELIVERY[heat];
  const { mp3, durations } = joinMp3([await speak(script, voice, instructions)]);
  if (durations.some((d) => d === 0)) throw new Error('Text-to-speech returned a clip with no audio.');

  const durationSec = round1(durations[0]);
  return { mp3, voice: { durationSec, frameSec: Math.round(durationSec * 0.3), script } };
}

/**
 * Records the voice note for a roast that asked for one, and points the
 * player at it. Without a key, a script or working text-to-speech, the roast
 * is returned as it was: the player then runs on its clock.
 */
export async function voiceOver(analysis: Analysis): Promise<{ analysis: Analysis; voiceNote?: Uint8Array<ArrayBuffer> }> {
  const roast = analysis.roast;
  if (!analysis.voice || !roast || !voiceConfigured()) return { analysis };
  if (!roast.voice.script) return { analysis };
  try {
    const { mp3, voice } = await recordVoiceNote(roast.heat, roast.voice.script);
    const audioUrl = `/api/voice/${encodeURIComponent(analysis.id)}`;
    return { analysis: { ...analysis, roast: { ...roast, voice: { ...voice, audioUrl } } }, voiceNote: mp3 };
  } catch (err) {
    console.error('voice note failed', err);
    return { analysis };
  }
}
