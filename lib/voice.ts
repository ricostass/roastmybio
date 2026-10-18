import { joinMp3 } from './mp3';
import { round1 } from './scoring';
import type { Analysis, Heat, Roast, VoiceScript } from './types';

// Turns a roast's spoken script into the voice note. The rant (then the real
// fixes, when going easy) is read by OpenAI's text-to-speech in the heat's
// voice, and the clips are joined into one MP3. The note's length comes from
// the audio itself.

export function voiceConfigured() {
  return Boolean(process.env.OPENAI_API_KEY);
}

const DELIVERY: Record<Heat, { voice: string; roast: string; fixes?: string }> = {
  easy: {
    voice: 'coral',
    roast:
      "The funniest friend in the group chat, roasting a mate's dating profile out loud. Warm, playful and quick, like you're trying not to laugh. Give each punchline a beat before it lands.",
    fixes: 'The funniest friend in the group chat, dropping the bit to help. Warm, friendly and clear, still smiling.',
  },
  nochill: {
    voice: 'ash',
    roast:
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

/** Reads the script aloud, one request for the rant and one for the fixes, and times the note from its audio. */
export async function recordVoiceNote(
  heat: Heat,
  script: VoiceScript,
): Promise<{ mp3: Uint8Array<ArrayBuffer>; voice: Omit<Roast['voice'], 'audioUrl'> }> {
  const delivery = DELIVERY[heat];
  const parts = [{ text: script.roast, instructions: delivery.roast }];
  if (script.fixes) parts.push({ text: script.fixes, instructions: delivery.fixes ?? delivery.roast });
  const clips = await Promise.all(parts.map((p) => speak(p.text, delivery.voice, p.instructions)));
  const { mp3, durations } = joinMp3(clips);
  if (durations.some((d) => d === 0)) throw new Error('Text-to-speech returned a clip with no audio.');

  const durationSec = round1(durations.reduce((sum, d) => sum + d, 0));
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
