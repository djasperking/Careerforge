/**
 * "English jobs only" filter for imported listings. Two separate questions:
 *  1. Is the posting itself written in English?
 *  2. Does the role require another language (e.g. "Czech Transcription Expert")?
 * Both are heuristics — fast, free and good enough to keep the review queue clean.
 */

const OTHER_LANGUAGES = [
  "spanish", "french", "german", "italian", "portuguese", "dutch", "polish", "czech", "slovak", "croatian", "serbian",
  "bosnian", "slovenian", "bulgarian", "romanian", "hungarian", "greek", "turkish", "russian", "ukrainian", "arabic",
  "hebrew", "persian", "farsi", "urdu", "hindi", "bengali", "bangla", "gujarati", "marathi", "tamil", "telugu",
  "malayalam", "kannada", "punjabi", "nepali", "sinhala", "thai", "vietnamese", "indonesian", "malay", "tagalog",
  "filipino", "chinese", "mandarin", "cantonese", "japanese", "korean", "swahili", "amharic", "danish", "swedish",
  "norwegian", "finnish", "icelandic", "lithuanian", "latvian", "estonian", "afrikaans", "zulu", "xhosa", "somali",
  "hausa", "igbo", "yoruba", "pashto", "kurdish", "georgian", "armenian", "azerbaijani", "kazakh", "uzbek",
  "mongolian", "khmer", "lao", "burmese", "catalan", "basque", "galician", "welsh", "irish",
];
const OTHER_LANGUAGE_RE = new RegExp(`\\b(${OTHER_LANGUAGES.join("|")})\\b`, "i");

// Frequent English function words; real English prose is full of them.
const ENGLISH_WORDS = new Set(
  "the and to of a in for with is are you we our will be as on or an that this your at by from have has it not can all they their who what about work team role experience".split(" "),
);

/** Share of words that are common English words (0–1). */
export function englishWordRatio(text: string): number {
  const words = text.toLowerCase().match(/[a-zà-ÿ']+/g) ?? [];
  if (words.length === 0) return 0;
  return words.filter((w) => ENGLISH_WORDS.has(w)).length / words.length;
}

/** Whether the posting text reads as English (short texts get the benefit of the doubt). */
export function isWrittenInEnglish(title: string, description: string): boolean {
  const sample = `${title}. ${description}`.slice(0, 1500);
  const words = sample.match(/[a-zà-ÿ']+/gi)?.length ?? 0;
  if (words < 25) return true;
  return englishWordRatio(sample) >= 0.14;
}

/** Whether the role asks for a language other than English. */
export function requiresOtherLanguage(title: string): boolean {
  if (/\benglish\b/i.test(title)) return false; // "Spanish–English Bilingual …" etc. is open to English speakers
  return OTHER_LANGUAGE_RE.test(title);
}

export function isEnglishJob(title: string, description: string): boolean {
  return !requiresOtherLanguage(title) && isWrittenInEnglish(title, description);
}
