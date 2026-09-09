import type { AIContext, AIProvider, AIResult } from "./types";
import { mockAIProvider } from "./mock";

/**
 * A transport that takes a system instruction + user prompt + schema hint and
 * returns parsed JSON. Google and OpenRouter both implement this over raw HTTP;
 * `buildJsonProvider` turns one into a full AIProvider so the prompts and
 * schemas live in exactly one place.
 */
export type JsonCall = <T>(
  ctx: AIContext,
  defaultInstruction: string,
  userPrompt: string,
  schemaHint: string,
  opts?: { maxTokens?: number },
) => Promise<AIResult<T>>;

export function buildJsonProvider(name: string, jsonCall: JsonCall): AIProvider {
  return {
    ...mockAIProvider,
    name,

    async generateCV(input, ctx) {
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
      return jsonCall(
        ctx,
        "Parse the raw CV text into the structured schema. Extract ONLY information that is " +
          "actually present — never invent employers, titles, dates, degrees, metrics or skills. " +
          "Preserve the candidate's real history exactly. If a target job description is given, you " +
          "MAY reorder experience bullets and skills to put the most relevant first, rewrite the " +
          "professional summary and existing bullet wording to mirror the job's language, and drop " +
          "clearly irrelevant filler — but you may NOT add experience, responsibilities or " +
          "achievements the person did not state. Put anything the candidate should double-check " +
          "into tailoringNotes.",
        `Raw CV text:\n${input.rawText}` +
          (input.targetJobDescription ? `\n\nTarget job description:\n${input.targetJobDescription}` : ""),
        `{ content: { personalInfo:{fullName,headline,email,phone,location,website,linkedin}, professionalSummary, careerObjective, ` +
          `experience:[{company,title,location,startDate,endDate,current,bullets:[string]}], ` +
          `education:[{institution,degree,field,startDate,endDate,description}], skills:[string], ` +
          `certifications:[{name,issuer,issueDate,credentialId}], projects:[{name,description,url}], ` +
          `achievements:[string], languages:[{name,proficiency}], ` +
          `volunteerExperience:[{organization,role,startDate,endDate,description}], ` +
          `references:[{name,relationship,contact}], additionalInformation }, tailoringNotes:[string] }`,
        { maxTokens: 8192 },
      );
    },

    async analyzeCV(input, ctx) {
      return jsonCall(
        ctx,
        "Analyse the CV against the job description and identify concrete, actionable gaps.",
        `CV:\n${JSON.stringify(input.cv)}\n\nJob description:\n${input.jobDescription}`,
        `{ matchScore:number, missingKeywords:string[], missingSkills:string[], weakSections:string[], suggestions:[{section:string,suggestion:string,requiresVerification:boolean}], atsRecommendations:string[], improvedSummary:string }`,
        { maxTokens: 6144 },
      );
    },

    async generateCoverLetter(input, ctx) {
      return jsonCall(
        ctx,
        "Write a concise, specific cover letter using ONLY facts present in the CV — never invent employers, titles or achievements.",
        `CV:\n${JSON.stringify(input.cv)}\n\nJob description:\n${input.jobDescription}\nTone: ${input.tone ?? "professional"}`,
        `{ coverLetter:string }`,
      );
    },

    async careerAdvice(input, ctx) {
      return jsonCall(
        ctx,
        "Give specific, actionable career guidance in a warm, direct tone. Ask a clarifying question only when truly necessary.",
        `Conversation so far:\n${JSON.stringify(input.history ?? [])}\n\nUser question: ${input.question}`,
        `{ reply:string }`,
      );
    },

    async generateQuestions(input, ctx) {
      return jsonCall(
        ctx,
        "Generate fair, unambiguous exam questions with exactly one best answer (unless multiple-answer) and a clear explanation.",
        `Generate ${input.count} ${input.difficulty} ${input.type} questions on "${input.topic}"${input.courseTitle ? ` for the course "${input.courseTitle}"` : ""}.`,
        `[{ prompt:string, options:[{text:string,isCorrect:boolean}], correctAnswerText?:string, explanation:string, difficulty:string, topic:string }]`,
      );
    },

    async importCourseFromText(input, ctx) {
      return jsonCall(
        ctx,
        "Turn the document into a course outline. Use ONLY what the document contains — never invent modules, lessons, learning outcomes or facts. " +
          "Split it into modules, each with an ordered list of lessons. Set lesson.type to QUIZ / ASSIGNMENT / VIDEO when the heading clearly implies it, else TEXT. " +
          "Fill lesson.content (Markdown) ONLY when the document actually includes that lesson's written material — otherwise leave it an empty string. " +
          "Keep the author's wording. Put anything you were unsure about, or that is missing (videos, images, exercises), into notes.",
        `Course document:\n${input.rawText}`,
        `{ title:string, description:string, level:"BEGINNER"|"INTERMEDIATE"|"ADVANCED", objectives:string[], ` +
          `modules:[{ title:string, lessons:[{ title:string, type:"TEXT"|"VIDEO"|"QUIZ"|"ASSIGNMENT", content:string }] }], notes:string[] }`,
        { maxTokens: 8192 },
      );
    },

    async importJobPosting(input, ctx) {
      return jsonCall(
        ctx,
        "Extract a job posting from the pasted text. Use ONLY what's in the text — never invent a salary, company or requirement. " +
          "locationType: REMOTE / HYBRID / ONSITE. type: FULL_TIME / PART_TIME / CONTRACT / FREELANCE / INTERNSHIP (default FULL_TIME). " +
          "category: a short field label like 'Data annotation' or 'Customer support' if obvious, else empty. " +
          "description: the full posting body tidied into clean Markdown (## headings, - bullet lists) — keep all responsibilities, requirements and benefits; drop site navigation, cookie notices and 'apply now' boilerplate. Leave any field you can't find as an empty string.",
        `Job posting:\n${input.rawText}`,
        `{ title:string, company:string, location:string, locationType:"REMOTE"|"HYBRID"|"ONSITE", ` +
          `type:"FULL_TIME"|"PART_TIME"|"CONTRACT"|"FREELANCE"|"INTERNSHIP", category:string, salaryText:string, description:string }`,
        { maxTokens: 6144 },
      );
    },
  };
}
