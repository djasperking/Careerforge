import { NextResponse } from "next/server";
import { ZodError } from "zod";

/** Consistent JSON envelope for all /api routes. */
export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function fail(
  status: number,
  code: string,
  message: string,
  details?: unknown,
) {
  return NextResponse.json(
    { ok: false, error: { code, message, details } },
    { status },
  );
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

/** Wrap a route handler so thrown ApiError / ZodError become clean responses
 * and unexpected errors never leak a stack trace to the client. */
export function handler<Args extends unknown[]>(
  fn: (...args: Args) => Promise<Response>,
) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (err) {
      if (err instanceof ApiError) {
        return fail(err.status, err.code, err.message, err.details);
      }
      if (err instanceof ZodError) {
        return fail(422, "VALIDATION_ERROR", "Invalid request", err.flatten());
      }
      console.error("Unhandled API error:", err);
      return fail(500, "INTERNAL", "Something went wrong. Please try again.");
    }
  };
}
