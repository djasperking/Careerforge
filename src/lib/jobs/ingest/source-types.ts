import type { JobSourceType } from "@prisma/client";

// Client-safe (no env/server imports): the admin form reads this too.
/** What each type needs from the admin form. */
export const SOURCE_TYPES: {
  type: JobSourceType;
  label: string;
  fields: { key: string; label: string; placeholder: string; required?: boolean }[];
}[] = [
  { type: "GREENHOUSE", label: "Greenhouse company board", fields: [
    { key: "board", label: "Board name", placeholder: "stripe", required: true },
    { key: "company", label: "Company display name", placeholder: "Stripe" } ] },
  { type: "LEVER", label: "Lever company board", fields: [
    { key: "board", label: "Company name", placeholder: "palantir", required: true },
    { key: "company", label: "Company display name", placeholder: "Palantir" } ] },
  { type: "ASHBY", label: "Ashby company board", fields: [
    { key: "board", label: "Board name", placeholder: "ashby", required: true },
    { key: "company", label: "Company display name", placeholder: "Ashby" } ] },
  { type: "WEWORKREMOTELY", label: "We Work Remotely (RSS)", fields: [
    { key: "feed", label: "Feed URL (optional)", placeholder: "https://weworkremotely.com/remote-jobs.rss" } ] },
  { type: "ARBEITNOW", label: "Arbeitnow (free API)", fields: [] },
  { type: "ADZUNA", label: "Adzuna (needs API key)", fields: [
    { key: "country", label: "Country code", placeholder: "gb" },
    { key: "what", label: "Search keywords", placeholder: "remote developer" } ] },
  { type: "JOOBLE", label: "Jooble (needs API key)", fields: [
    { key: "keywords", label: "Keywords", placeholder: "remote" },
    { key: "location", label: "Location", placeholder: "Nigeria" } ] },
];
