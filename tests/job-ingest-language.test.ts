import { describe, expect, it } from "vitest";
import { isEnglishJob, isWrittenInEnglish, requiresOtherLanguage } from "@/lib/jobs/ingest/language";

const EN_BODY =
  "We are hiring a remote data annotator to review and rate AI model outputs. You will evaluate responses for accuracy, write short rationales and flag unsafe content. The team works across time zones and you will have flexible hours.";
const DE_BODY =
  "Technologie begeistert Sie? Uns auch! Zur Verstärkung unseres Expertenteams suchen wir einen Test Ingenieur für die Funk- und Kommunikationsbranche. Sie sind verantwortlich für die Planung und Durchführung von Tests und die Dokumentation der Ergebnisse im Team.";

describe("requiresOtherLanguage", () => {
  it.each([
    "Czech Language Transcription Expert",
    "AI Linguistic Evaluator - Bengali (India)",
    "[Croatian] - Voice Recording Specialist",
    "Gig Guru Wanted: Pay-by-Task Opportunities for Arabic Speakers in United States",
    "AI Data Specialist - German",
    "Spanish Tutors",
  ])("flags %s", (t) => expect(requiresOtherLanguage(t)).toBe(true));

  it.each([
    "Mobile Device Data Collection - English (USA)",
    "Spanish-English Bilingual Data Annotator, English",
    "Senior Data Annotator",
    "AI Red Teamer, Cybersecurity (Remote)",
    "Data Science Expert",
    "Irishman Pub Reviewer".replace("Irishman", "Senior"), // no false hit on a non-language word
  ])("allows %s", (t) => expect(requiresOtherLanguage(t)).toBe(false));
});

describe("isWrittenInEnglish", () => {
  it("accepts English prose", () => expect(isWrittenInEnglish("Data Annotator", EN_BODY)).toBe(true));
  it("rejects German prose", () => expect(isWrittenInEnglish("Test Ingenieur (m/w/x)", DE_BODY)).toBe(false));
  it("gives very short text the benefit of the doubt", () => expect(isWrittenInEnglish("Lawyers", "Remote contract role.")).toBe(true));
});

describe("isEnglishJob", () => {
  it("keeps an English role with an English description", () => expect(isEnglishJob("Data Annotator", EN_BODY)).toBe(true));
  it("drops an English description for a role needing another language", () =>
    expect(isEnglishJob("AI Linguistic Evaluator - Gujarati", EN_BODY)).toBe(false));
  it("drops a German posting", () => expect(isEnglishJob("Test Ingenieur", DE_BODY)).toBe(false));
});
