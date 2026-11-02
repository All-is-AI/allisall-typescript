// The options of one call, and how they are checked and combined with the
// client's.

import { AllisallError } from "./errors.js";

/** The options of one call. Each member left out takes the client's. */
export interface RequestOptions {
  /** Cancels the call, including any wait between retries. */
  signal?: AbortSignal | undefined;
  /** The timeout of each attempt of this call, in milliseconds. */
  timeout?: number | undefined;
  /**
   * How many times this call is retried. It cannot make a request eligible
   * that the SDK never retries, such as a `PATCH`.
   */
  maxRetries?: number | undefined;
  /**
   * Extra headers for this call, sent over the client's `defaultHeaders`.
   * They may not name `Authorization`, `Content-Type`, `Idempotency-Key` or
   * `X-Request-Id`, which the SDK sets. In a browser, a header must be one
   * the API's CORS policy allows.
   */
  headers?: Readonly<Record<string, string>> | undefined;
}

/** The options of a call that creates something and takes an `Idempotency-Key`. */
export interface IdempotentRequestOptions extends RequestOptions {
  /**
   * The `Idempotency-Key` to send, as given. By default the SDK generates
   * one per call and sends it on every attempt of that call. Set your own
   * to make a create safe to repeat across process restarts.
   *
   * A second call with the same key and the same request, within 24 hours,
   * gets the first call's stored response. Only a `2xx` is stored, so a key
   * whose first call failed can be sent again. The same key with a
   * different body is refused with `422` `idempotency_key_reused`.
   *
   * The key must be a string the platform can send as a header value: a
   * newline, or a character above U+00FF, is a `TypeError` before sending.
   */
  idempotencyKey?: string | undefined;
}

export const DEFAULT_TIMEOUT_MS = 60_000;
export const DEFAULT_MAX_RETRIES = 2;

/** The headers the SDK sets itself, in lower case. */
const OWNED_HEADERS = new Set([
  "authorization",
  "content-type",
  "idempotency-key",
  "x-request-id",
]);

export function resolveTimeout(
  option: number | undefined,
  fallback: number,
): number {
  const timeout = option ?? fallback;
  if (
    typeof timeout !== "number" ||
    !Number.isFinite(timeout) ||
    timeout <= 0
  ) {
    throw new AllisallError(
      `allisall: timeout must be a positive number of milliseconds, not ${String(timeout)}`,
    );
  }
  return timeout;
}

export function resolveMaxRetries(
  option: number | undefined,
  fallback: number,
): number {
  const maxRetries = option ?? fallback;
  if (!Number.isInteger(maxRetries) || maxRetries < 0) {
    throw new AllisallError(
      `allisall: maxRetries must be a whole number, 0 or more, not ${String(maxRetries)}`,
    );
  }
  return maxRetries;
}

function isPlainObject(value: unknown): value is object {
  if (typeof value !== "object" || value === null) return false;
  const proto: unknown = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * Checks caller headers and returns a copy. `option` names the option the
 * headers came from, for the message.
 *
 * @throws {TypeError} when the headers are not a plain object, or a header
 * is one the SDK sets or is not a valid header name and string value.
 */
export function resolveHeaders(
  headers: Readonly<Record<string, string>> | undefined,
  option: string,
): Readonly<Record<string, string>> {
  if (headers === undefined) return {};
  if (!isPlainObject(headers)) {
    throw new TypeError(
      `allisall: ${option} must be a plain object of header names and string values`,
    );
  }
  const copy: Record<string, string> = {};
  for (const [name, value] of Object.entries(headers)) {
    if (OWNED_HEADERS.has(name.toLowerCase())) {
      throw new TypeError(
        `allisall: ${option} may not set ${name}; the SDK sets it`,
      );
    }
    if (typeof value !== "string") {
      throw new TypeError(
        `allisall: ${option} sets ${name} to ${typeof value}; a header value must be a string`,
      );
    }
    copy[name] = value;
  }
  // The platform's own check of names and values, so a malformed header is
  // refused here rather than failing every attempt as a connection error.
  new Headers(copy);
  return copy;
}

/** Sets each of `extra` in `target`, replacing a header of the same name in any case. */
export function mergeHeaders(
  target: Record<string, string>,
  extra: Readonly<Record<string, string>>,
): void {
  for (const [name, value] of Object.entries(extra)) {
    const lower = name.toLowerCase();
    for (const existing of Object.keys(target)) {
      if (existing.toLowerCase() === lower) delete target[existing];
    }
    target[name] = value;
  }
}
