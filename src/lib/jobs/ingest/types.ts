import type { JobLocationType, JobType } from "@prisma/client";

/** A job in our own shape, produced by a source adapter. */
export interface NormalizedJob {
  externalId: string;
  title: string;
  company: string;
  location?: string;
  locationType: JobLocationType;
  type: JobType;
  category?: string;
  salaryText?: string;
  description: string;
  applyUrl: string;
  postedAt?: Date;
}

export type SourceConfig = Record<string, unknown>;

export interface AdapterResult {
  jobs: NormalizedJob[];
  /** Human-readable problem (missing key, bad board name…) — job list may be empty. */
  error?: string;
}
