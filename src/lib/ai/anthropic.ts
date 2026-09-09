import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/lib/env";
import type { AIContext, AIProvider, AIResult } from "./types";
import { mockAIProvider } from "./mock";
import { getActiveSystemPrompt, type AIFeatureKey } from "./prompts";

const client = env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: env.ANTHROPIC_API_KEY }) : null;

const SYSTEM_BASE = `You are Career Forge's AI assistant. Rules you must never break:
- Never fabricate employment history, job titles, dates, degrees, certifications, licences or achievements.
- Only rephrase, structure, or improve information the user has provided.
- When a suggestion needs the user to confirm a fact, mark it clearly.
- Return ONLY valid JSON matching the requested schema, with no prose around it.`;

/**
 * Admins can override the feature-specific instruction via AIPrompt
 * (src/lib/ai/prompts.ts) without touching code; SYSTEM_BASE's safety rules
 * always apply on top, regardless of what an admin configures.
 */
async function jsonCall<T>(
  ctx: AIContext,
  defaultInstruction: string,
  userPrompt: string,
  schemaHint: string,
): Promise<AIResult<T>> {
  const started = Date.now();
  const custom = await getActiveSystemPrompt(ctx.feature as AIFeatureKey).catch(() => null);
  const res = await client!.messages.create({
    model: env.AI_MODEL,
    max_tokens: env.AI_MAX_OUTPUT_TOKENS,
    system: `${SYSTEM_BASE}\n\n${custom ?? defaultInstruction}\n\nSchema:\n${schemaHint}`,
    messages: [{ role: "user", content: userPrompt }],
  });
  const text = res.content.map((c) => (c.type === "text" ? c.text : "")).join("");
  const start = Math.max(text.indexOf("{"), text.indexOf("["));
  const parsed = JSON.parse(start >= 0 ? text.slice(start) : text) as T;
  return {
    data: parsed,
    meta: {
      provider: "anthropic",
      model: env.AI_MODEL,
      promptTokens: res.usage.input_tokens,
      outputTokens: res.usage.output_tokens,
      latencyMs: Date.now() - started,
      isAIGenerated: true,
    },
  };
}

/**
 * Anthropic-backed provider. Any method not yet wired to a real prompt — and
 * every method when ANTHROPIC_API_KEY is unset — transparently uses the
 * deterministic mock implementation, so the platform always works.
 */
export const anthropicAIProvider: AIProvider = {
  ...mockAIProvider,
  name: client ? "anthropic" : "mock",

  async generateCV(input, ctx) {
    if (!client) return mockAIProvider.generateCV(input, ctx);
    const result = await jsonCall<{ professionalSummary: string }>(
      ctx,
      "Write a professional summary for this CV: 2-4 sentences, first-person implied (no 'I'), " +
        "specific to the person's actual roles, industries and skills. Use ONLY facts present in " +
        "the CV data — never invent employers, titles, dates, metrics or achievements. If the CV " +
        "is sparse, keep the summary short rather than padding it with invented detail. If a target " +
        "job description is given, orient the emphasis toward it without claiming unproven experience.",
      `CV data:\n${JSON.stringify(input.rawProfile)}` +
        (input.targetJobDescription ? `\n\nTarget job description:\n${input.targetJobDescription}` : ""),
      `{ professionalSummary: string }`,
    );
    return {
      data: { ...(input.rawProfile as Record<string, unknown>), professionalSummary: result.data.professionalSummary },
      meta: result.meta,
    };
  },

  async importCV(input, ctx) {
    if (!client) return mockAIProvider.importCV(input, ctx);
    return jsonCall(
      ctx,
      "Parse the raw CV text into the structured schema. Extract ONLY information that is " +
        "actually present — never invent employers, titles, dates, degrees, metrics or skills. " +
        "Preserve the candidate's real history exactly. If a target job description is given, you " +
        "MAY reorder experience bullets and skills to put the most relevant first, rewrite the " +
        "professional summary and existing bullet wording to mirror the job's language, and drop " +
        "clearly irrelevant filler — but you may NOT add experience, responsibilities or " +
        "achievements the person did not state. Put anything the candidate should double-check " +
        "(ambiguous dates, unclear scope, inferred titles) into tailoringNotes.",
      `Raw CV text:\n${input.rawText}` +
        (input.targetJobDescription ? `\n\nTarget job description:\n${input.targetJobDescription}` : ""),
      `{ content: { personalInfo:{fullName,headline,email,phone,location,website,linkedin}, professionalSummary, careerObjective, ` +
        `experience:[{company,title,location,startDate,endDate,current,bullets:[string]}], ` +
        `education:[{institution,degree,field,startDate,endDate,description}], skills:[string], ` +
        `certifications:[{name,issuer,issueDate,credentialId}], projects:[{name,description,url}], ` +
        `achievements:[string], languages:[{name,proficiency}], ` +
        `volunteerExperience:[{organization,role,startDate,endDate,description}], ` +
        `references:[{name,relationship,contact}], additionalInformation }, tailoringNotes:[string] }`,
    );
  },

  async analyzeCV(input, ctx) {
    if (!client) return mockAIProvider.analyzeCV(input, ctx);
    return jsonCall(
      ctx,
      "Analyse the CV against the job description and identify concrete, actionable gaps.",
      `CV:\n${JSON.stringify(input.cv)}\n\nJob description:\n${input.jobDescription}`,
      `{ matchScore:number, missingKeywords:string[], missingSkills:string[], weakSections:string[], suggestions:[{section:string,suggestion:string,requiresVerification:boolean}], atsRecommendations:string[], improvedSummary:string }`,
    );
  },

  async generateCoverLetter(input, ctx) {
    if (!client) return mockAIProvider.generateCoverLetter(input, ctx);
    return jsonCall(
      ctx,
      "Write a concise, specific cover letter using ONLY facts present in the CV — never invent employers, titles or achievements.",
      `CV:\n${JSON.stringify(input.cv)}\n\nJob description:\n${input.jobDescription}\nTone: ${input.tone ?? "professional"}`,
      `{ coverLetter:string }`,
    );
  },

  async careerAdvice(input, ctx) {
    if (!client) return mockAIProvider.careerAdvice(input, ctx);
    return jsonCall(
      ctx,
      "Give specific, actionable career guidance in a warm, direct tone. Ask a clarifying question only when truly necessary.",
      `Conversation so far:\n${JSON.stringify(input.history ?? [])}\n\nUser question: ${input.question}`,
      `{ reply:string }`,
    );
  },

  async generateQuestions(input, ctx) {
    if (!client) return mockAIProvider.generateQuestions(input, ctx);
    return jsonCall(
      ctx,
      "Generate fair, unambiguous exam questions with exactly one best answer (unless multiple-answer) and a clear explanation.",
      `Generate ${input.count} ${input.difficulty} ${input.type} questions on "${input.topic}"${input.courseTitle ? ` for the course "${input.courseTitle}"` : ""}.`,
      `[{ prompt:string, options:[{text:string,isCorrect:boolean}], correctAnswerText?:string, explanation:string, difficulty:string, topic:string }]`,
    );
  },

  async importCourseFromText(input, ctx) {
    if (!client) return mockAIProvider.importCourseFromText(input, ctx);
    return jsonCall(
      ctx,
      "Turn the document into a course outline. Use ONLY what the document contains — never invent modules, lessons, learning outcomes or facts. " +
        "Split it into modules, each with an ordered list of lessons. Set lesson.type to QUIZ / ASSIGNMENT / VIDEO when the heading clearly implies it, else TEXT. " +
        "Fill lesson.content (Markdown) ONLY when the document actually includes that lesson's written material — otherwise leave it an empty string. " +
        "Keep the author's wording. Put anything unclear or missing (videos, images, exercises) into notes.",
      `Course document:\n${input.rawText}`,
      `{ title:string, description:string, level:"BEGINNER"|"INTERMEDIATE"|"ADVANCED", objectives:string[], ` +
        `modules:[{ title:string, lessons:[{ title:string, type:"TEXT"|"VIDEO"|"QUIZ"|"ASSIGNMENT", content:string }] }], notes:string[] }`,
    );
  },

  async importJobPosting(input, ctx) {
    if (!client) return mockAIProvider.importJobPosting(input, ctx);
    return jsonCall(
      ctx,
      "Extract a job posting from the pasted text. Use ONLY what's in the text — never invent a salary, company or requirement. " +
        "locationType: REMOTE / HYBRID / ONSITE. type: FULL_TIME / PART_TIME / CONTRACT / FREELANCE / INTERNSHIP (default FULL_TIME). " +
        "category: a short field label if obvious, else empty. " +
        "description: the full posting body tidied into clean Markdown, keeping all responsibilities/requirements/benefits and dropping nav, cookie notices and apply boilerplate.",
      `Job posting:\n${input.rawText}`,
      `{ title:string, company:string, location:string, locationType:"REMOTE"|"HYBRID"|"ONSITE", ` +
        `type:"FULL_TIME"|"PART_TIME"|"CONTRACT"|"FREELANCE"|"INTERNSHIP", category:string, salaryText:string, description:string }`,
    );
  },
};
