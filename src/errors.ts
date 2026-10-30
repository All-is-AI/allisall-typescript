import type { ErrorCode, EventInput, IngestSummary, Problem } from "./types.js";

/**
 * The base of every error the SDK throws. Catch it to handle any SDK
 * failure; catch `ApiError`, `ConnectionError` or `IngestError` to handle
 * one condition.
 */
export class AllisallError extends Error {
  override name = "AllisallError";
}

/** The members of an `ApiError`. */
export interface ApiErrorInit {
  status: number;
  problem?: Problem | undefined;
  requestId?: string | undefined;
  retryAfter?: number | undefined;
  headers: Headers;
  message?: string | undefined;
}

/**
 * An error response from the API, or a successful response whose body was
 * not the expected shape. Branch on `code`; for a code you do not
 * recognise, fall back on `status`.
 */
export class ApiError extends AllisallError {
  override name = "ApiError";
  /** The HTTP status. */
  readonly status: number;
  /** The problem's `code`. Absent when the body was not a problem document. */
  readonly code: ErrorCode | undefined;
  /** The whole problem document. Absent when the body was not one. */
  readonly problem: Problem | undefined;
  /** The problem's `request_id`, or else the response's `X-Request-Id`. */
  readonly requestId: string | undefined;
  /**
   * The response's `Retry-After`, in milliseconds from when the response
   * arrived. Absent when the response had none, or one that did not parse
   * or named a time in the past.
   */
  readonly retryAfter: number | undefined;
  /** The response headers. */
  readonly headers: Headers;

  constructor(init: ApiErrorInit) {
    super(init.message ?? apiErrorMessage(init.status, init.problem));
    this.status = init.status;
    this.problem = init.problem;
    this.code = init.problem?.code;
    const problemId = init.problem?.request_id;
    this.requestId =
      problemId !== undefined && problemId !== "" ? problemId : init.requestId;
    this.retryAfter = init.retryAfter;
    this.headers = init.headers;
  }
}

function apiErrorMessage(status: number, problem: Problem | undefined): string {
  const parts = [`allisall: the API answered ${status}`];
  if (problem?.code !== undefined) parts.push(problem.code);
  if (problem?.detail !== undefined) parts.push(problem.detail);
  return parts.join(": ");
}

/**
 * A request that got no response: the connection failed, was reset, or the
 * attempt timed out. `cause` holds the underlying error.
 */
export class ConnectionError extends AllisallError {
  override name = "ConnectionError";
  /** The `X-Request-Id` the SDK sent on the last attempt, to quote when reporting it. */
  readonly requestId: string;

  constructor(requestId: string, cause: unknown) {
    super(
      `allisall: no response from the API (request ${requestId}): ${causeText(cause)}`,
      { cause },
    );
    this.requestId = requestId;
  }
}

function causeText(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}

/**
 * A batch of an `ingest` call failed, so the call stopped and sent nothing
 * after it. `cause` holds what failed the batch: an `ApiError`, a
 * `ConnectionError`, the caller's cancellation, or the error from getting
 * the token: the token provider's own error, unchanged, or the
 * `AllisallError` refusing a provider's API key in a browser. To recover,
 * send `remaining` again: every event in it keeps the `event_id` it was
 * sent with, so any the failed batch stored come back as duplicates.
 */
export class IngestError extends AllisallError {
  override name = "IngestError";
  /** The combined outcome of the batches that succeeded before the failed one. */
  readonly summary: IngestSummary;
  /**
   * Copies of every event from the failed batch onward, each with its
   * `event_id`, less any event too large to send: those are rows of
   * `summary.errors` and never in `remaining`. To map `remaining` back to
   * your list, walk it from `remainingFrom` and skip the `index` of every
   * `summary.errors` row at or past `remainingFrom`. With no such row,
   * `remaining[i]` is your event `remainingFrom + i`.
   */
  readonly remaining: EventInput[];
  /** The index, in the list passed to `ingest`, of the first event in `remaining`. */
  readonly remainingFrom: number;

  constructor(
    cause: unknown,
    summary: IngestSummary,
    remaining: EventInput[],
    remainingFrom: number,
  ) {
    super(
      `allisall: an ingest batch failed and the call stopped; send the ${remaining.length} event(s) in remaining, from index ${remainingFrom}, again: ${causeText(cause)}`,
      { cause },
    );
    this.summary = summary;
    this.remaining = remaining;
    this.remainingFrom = remainingFrom;
  }
}
