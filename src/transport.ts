// One HTTP attempt (headers, timeout, reading the response) and the loop
// that repeats it under the retry rules in retry.ts.

import { AllisallError, ApiError, ConnectionError } from "./errors.js";
import {
  backoffMs,
  isRetryableStatus,
  MAX_RETRY_AFTER_MS,
  parseRetryAfter,
  sleep,
} from "./retry.js";
import type { FieldError, Problem } from "./types.js";
import { uuidv4 } from "./uuid.js";

/** A `fetch`-compatible function. */
export type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

/** A callback returning the bearer token to send, called before every attempt. */
export type TokenProvider = () => string | Promise<string>;

/** Where the bearer token comes from. */
export type Credential =
  | { readonly kind: "apiKey"; readonly apiKey: string }
  | { readonly kind: "provider"; readonly provider: TokenProvider };

/** Everything an attempt needs, fixed when the client is constructed. */
export interface TransportConfig {
  readonly baseURL: URL;
  readonly credential: Credential;
  readonly timeout: number;
  readonly maxRetries: number;
  readonly fetch: FetchLike | undefined;
  /** Whether a token that is an API key is refused: a browser without the opt-in. */
  readonly refuseApiKeys: boolean;
  /** The `User-Agent` to send; `undefined` in a browser. */
  readonly userAgent: string | undefined;
}

/** The message of the error refusing an API key in a browser. */
export const BROWSER_KEY_MESSAGE =
  "allisall: refusing to use an API key in a browser, where it is readable by anyone who loads the page. " +
  "Call the API from your server instead, or pass dangerouslyAllowBrowser: true if you accept that risk.";

/** Reports whether a bearer token is an API key, which starts `aia_`. */
export function isApiKey(token: string): boolean {
  return token.startsWith("aia_");
}

/** Joins the base URL and an operation's path with exactly one `/`. */
export function joinURL(base: URL, path: string): string {
  const url = new URL(base.href);
  url.pathname = url.pathname.replace(/\/+$/, "") + path;
  return url.href;
}

/**
 * Reports whether every character of a credential, already trimmed, is
 * printable ASCII (U+0021 to U+007E), as a bearer credential is. Anything
 * else, a control character, an inner space or a non-ASCII character,
 * cannot travel in the header. The check never quotes the credential, so
 * no error built from it can leak the secret.
 */
export function isPrintableCredential(credential: string): boolean {
  for (let i = 0; i < credential.length; i++) {
    const c = credential.charCodeAt(i);
    if (c < 0x21 || c > 0x7e) return false;
  }
  return true;
}

async function bearerToken(config: TransportConfig): Promise<string> {
  const { credential } = config;
  if (credential.kind === "apiKey") return credential.apiKey;
  const raw = await credential.provider();
  const token = typeof raw === "string" ? raw.trim() : raw;
  if (token === "") {
    throw new AllisallError(
      "allisall: the token provider returned an empty token",
    );
  }
  if (typeof token === "string" && !isPrintableCredential(token)) {
    throw new AllisallError(
      "allisall: the token provider returned a token holding a character other than printable ASCII, which cannot be sent",
    );
  }
  if (config.refuseApiKeys && typeof token === "string" && isApiKey(token)) {
    throw new AllisallError(BROWSER_KEY_MESSAGE);
  }
  return token;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseJSON(text: string): unknown {
  try {
    const value: unknown = JSON.parse(text);
    return value;
  } catch {
    return undefined;
  }
}

const OPTIONAL_LOCATORS = [
  "pointer",
  "parameter",
  "header",
  "part",
  "column",
] as const;

function readFieldError(value: unknown): FieldError | undefined {
  if (!isObject(value)) return undefined;
  const { code, detail } = value;
  if (typeof code !== "string" || typeof detail !== "string") return undefined;
  const out: FieldError = { code, detail };
  for (const name of OPTIONAL_LOCATORS) {
    const locator = value[name];
    if (typeof locator === "string") out[name] = locator;
  }
  return out;
}

const PROBLEM_STRINGS = [
  "type",
  "title",
  "detail",
  "code",
  "request_id",
] as const;

/**
 * Reads an `application/problem+json` body as a problem document. Returns
 * `undefined` for any other body, or one that is not a JSON object. A
 * member of the wrong type is left out on its own, as is a malformed
 * entry of `errors`; the rest of the problem is kept. Members the SDK does
 * not know are ignored.
 */
export function readProblem(
  contentType: string | null,
  text: string,
): Problem | undefined {
  const mediaType = contentType?.split(";")[0]?.trim().toLowerCase();
  if (mediaType !== "application/problem+json") return undefined;
  const body = parseJSON(text);
  if (!isObject(body)) return undefined;
  const problem: Problem = {};
  for (const name of PROBLEM_STRINGS) {
    const value = body[name];
    if (typeof value === "string") problem[name] = value;
  }
  if (typeof body.status === "number") problem.status = body.status;
  if (Array.isArray(body.errors)) {
    problem.errors = body.errors
      .map(readFieldError)
      .filter((e): e is FieldError => e !== undefined);
  }
  return problem;
}

function headerOrUndefined(headers: Headers, name: string): string | undefined {
  return headers.get(name) ?? undefined;
}

/**
 * Sends one attempt. Resolves with the parsed `2xx` body; throws an
 * `ApiError` for any other status or an unreadable `2xx` body, a
 * `ConnectionError` when no response arrived, or the caller's abort reason.
 */
async function attempt<T>(
  config: TransportConfig,
  url: string,
  body: Uint8Array,
  read: (body: unknown) => T | undefined,
  token: string,
  requestId: string,
  signal: AbortSignal | undefined,
): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "X-Request-Id": requestId,
  };
  if (config.userAgent !== undefined) headers["User-Agent"] = config.userAgent;

  const timeout = AbortSignal.timeout(config.timeout);
  const combined =
    signal === undefined ? timeout : AbortSignal.any([signal, timeout]);
  const doFetch = config.fetch ?? globalThis.fetch;

  let response: Response;
  let text: string;
  try {
    response = await doFetch(url, {
      method: "POST",
      headers,
      body,
      signal: combined,
      // A redirect is never followed, so Authorization never travels to
      // another location.
      redirect: "manual",
    });
    text = await response.text();
  } catch (err) {
    if (signal?.aborted) throw signal.reason;
    throw new ConnectionError(requestId, err);
  }

  const status = response.status;
  const responseId = headerOrUndefined(response.headers, "X-Request-Id");
  // A 3xx, or a browser's opaque redirect, whose status is 0.
  if ((status >= 300 && status < 400) || response.type === "opaqueredirect") {
    throw new ApiError({
      status,
      headers: response.headers,
      requestId: responseId,
      message: `allisall: the API answered ${status} with a redirect, which the SDK does not follow`,
    });
  }
  if (status >= 200 && status < 300) {
    const parsed = parseJSON(text);
    const value = parsed === undefined ? undefined : read(parsed);
    if (value !== undefined) return value;
    throw new ApiError({
      status,
      headers: response.headers,
      requestId: responseId,
      message: `allisall: the API answered ${status} with a body the SDK could not read`,
    });
  }
  throw new ApiError({
    status,
    problem: readProblem(response.headers.get("Content-Type"), text),
    requestId: responseId,
    retryAfter: parseRetryAfter(
      response.headers.get("Retry-After"),
      Date.now(),
    ),
    headers: response.headers,
  });
}

/**
 * Posts a JSON body, retrying a failure worth repeating. The body is the
 * same bytes on every attempt. Each attempt reads a fresh token and sends
 * a fresh `X-Request-Id`.
 */
export async function post<T>(
  config: TransportConfig,
  path: string,
  body: Uint8Array,
  read: (body: unknown) => T | undefined,
  signal: AbortSignal | undefined,
): Promise<T> {
  const url = joinURL(config.baseURL, path);
  for (let retry = 0; ; retry++) {
    // An error from the token provider ends the call unwrapped and unretried.
    const token = await bearerToken(config);
    try {
      return await attempt(config, url, body, read, token, uuidv4(), signal);
    } catch (err) {
      if (!(err instanceof ApiError || err instanceof ConnectionError))
        throw err;
      const retryable =
        err instanceof ConnectionError || isRetryableStatus(err.status);
      if (!retryable || retry >= config.maxRetries) throw err;
      let wait: number;
      if (err instanceof ApiError && err.retryAfter !== undefined) {
        if (err.retryAfter > MAX_RETRY_AFTER_MS) throw err;
        wait = err.retryAfter;
      } else {
        wait = backoffMs(retry + 1);
      }
      await sleep(wait, signal);
    }
  }
}
