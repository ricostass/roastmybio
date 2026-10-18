export type Mode = 'serious' | 'roast';
export type Heat = 'easy' | 'nochill';
export type DatingApp = 'Hinge' | 'Bumble' | 'Tinder' | 'Other';
export type Looking = 'A relationship' | 'Something casual' | 'Not sure yet';

export const DATING_APPS: DatingApp[] = ['Hinge', 'Bumble', 'Tinder', 'Other'];
export const LOOKING_OPTIONS: Looking[] = ['A relationship', 'Something casual', 'Not sure yet'];

// ---------- Serious review ----------

export type Evidence = 'Platform data' | 'Survey' | 'Trend';

export interface Source {
  publisher: string;
  year: string;
  sample: string;
  finding: string;
}

export interface Fix {
  text: string;
  evidence: Evidence;
  source: Source;
}

export type PhotoTag = 'lead' | 'keep' | 'keep-one-group' | 'cut';

export interface PhotoPick {
  /** 1-based index of the photo as uploaded. */
  photo: number;
  tag: PhotoTag;
}

export interface PromptRewrite {
  label: string;
  current: string;
  suggested: string;
  why: string;
}

export interface SeriousReview {
  overall: number;
  sub: { photos: number; prompts: number; bio: number };
  summary: string;
  fixes: Fix[];
  photoOrder: PhotoPick[];
  trend: { title: string; body: string; source: string };
  rewrites: PromptRewrite[];
}

// ---------- Roast ----------

export interface RoastLine {
  /** What the joke targets, e.g. "PHOTO 5". Always something the user posted. */
  target: string;
  /** The user's own prompt answer, when the target is a prompt. */
  quote?: string;
  joke: string;
  /** One-line, plain-language fix. */
  wrong: string;
}

export interface ReceiptItem {
  label: string;
  cringe: number;
}

export interface VoiceSegment {
  /** Shown as "Now roasting: <label>". */
  label: string;
  startSec: number;
  /** What the roaster says in this part of the note, when there's a spoken script. */
  text?: string;
}

export interface Roast {
  heat: Heat;
  verdict: { setup: string; punchline: string };
  /** 0–10, one decimal. */
  cringe: number;
  lines: RoastLine[];
  receipt: ReceiptItem[];
  voice: {
    durationSec: number;
    /** Point in the note used for still frames of the card. */
    frameSec: number;
    audioUrl?: string;
    segments: VoiceSegment[];
  };
}

/** What the review read off the screenshots. Kept so a roast can be re-run without them. */
export interface ProfileFacts {
  photos: { index: number; description: string }[];
  bio: string | null;
  prompts: { question: string; answer: string }[];
  age: number | null;
}

export interface Analysis {
  id: string;
  createdAt: string;
  mode: Mode;
  app: DatingApp;
  looking: Looking;
  voice: boolean;
  meta: { photos: number; prompts: number };
  serious: SeriousReview;
  roast?: Roast;
  profile?: ProfileFacts;
  /** True when this is the built-in sample, not a review of uploaded screenshots. */
  demo?: boolean;
}

// ---------- Roast card (shared by every card template) ----------

export type CardKind = 'verdict' | 'line';
export type CardFormat = '9:16' | '4:5' | '1:1';
export const CARD_FORMATS: CardFormat[] = ['9:16', '4:5', '1:1'];

export interface RoastCard {
  kind: CardKind;
  heat: Heat;
  verdict?: { setup: string; punchline: string };
  cringe?: number;
  line?: RoastLine;
  meta: { photos: number; prompts: number };
  format: CardFormat;
  /** Line items for the receipt template. */
  receipt?: ReceiptItem[];
  /** Playback position for templates that draw the voice note. */
  voice?: { elapsedSec: number; durationSec: number };
}
