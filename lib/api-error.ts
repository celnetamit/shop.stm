import { NextResponse } from "next/server";

/**
 * Log the real error server-side and return a SAFE, generic message to the client.
 *
 * Centralizes our error-handling policy so individual routes never leak internal
 * detail (Prisma table/column names, stack traces, connection strings) to callers.
 * Use this in every route `catch` block instead of echoing `error.message`.
 *
 * @param context  short tag for server logs, e.g. "coupons.POST"
 * @param error    the caught error (logged in full, never returned)
 * @param publicMessage  safe message shown to the client
 * @param status   HTTP status (default 500)
 */
export function errorResponse(
  context: string,
  error: unknown,
  publicMessage = "Something went wrong. Please try again.",
  status = 500
) {
  console.error(`[${context}]`, error);
  return NextResponse.json({ ok: false, error: publicMessage }, { status });
}
