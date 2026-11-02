// One HTTP attempt (headers, timeout, reading the response) and the loop
// that repeats it under the retry rules in retry.ts, for any method and
// any body.

import { AllisallError, ApiError, ConnectionError } from "./errors.js";
import { mergeHeaders } from "./options.js";
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
  /**
   * The client's credential. Absent for a shared report, whose call carries
   * its own share token and sends no client credential.
   */
  readonly credential: Credential | undefined;
  readonly timeout: number;
  readonly maxRetries: number;
  readonly fetch: FetchLike | undefined;
  /** Whether a token that is an API key is refused: a browser without the opt-in. */
  readonly refuseApiKeys: boolean;
  /** The `User-Agent` to send; `undefined` in a browser. */
  readonly userAgent: string | undefined;
  /** Headers sent on every request, already checked. */
  readonly defaultHeaders: Readonly<Record<string, string>>;
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
  if (credential === undefined) {
    throw new AllisallError("allisall: this call has no client credential");
  }
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
 * How a successful body is read. `undefined` means the body was not the
 * expected shape, which is an `ApiError` carrying the status.
 */
export type ReadBody<T> = (text: string) => { readonly value: T } | undefined;

/**
 * The `Authorization` a request sends: the client's credential as a bearer,
 * none, or a share token under the `Report` scheme.
 */
export type Authorization = "bearer" | "none" | { readonly report: string };

/** One request, fixed before the first attempt and sent unchanged on each. */
export interface Outgoing {
  readonly method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  readonly url: string;
  readonly authorization: Authorization;
  /** The body: bytes, or a form whose boundary `fetch` writes. */
  readonly body: Uint8Array | FormData | undefined;
  /** The body's `Content-Type`; `undefined` for no body, or a form. */
  readonly contentType: string | undefined;
  /** The `Idempotency-Key` sent on every attempt, if any. */
  readonly idempotencyKey: string | undefined;
}

/** What one call may do, from its operation and its options. */
export interface CallPolicy {
  readonly timeout: number;
  readonly maxRetries: number;
  /** The call's headers, already checked. */
  readonly headers: Readonly<Record<string, string>>;
  readonly signal: AbortSignal | undefined;
  /** Whether a retry cannot apply the request twice, so it may be retried at all. */
  readonly eligible: boolean;
  /** Whether a `409` `idempotency_key_in_use` is retried: the request carries a reused key. */
  readonly retryKeyInUse: boolean;
}

/**
 * Sends one attempt. Resolves with the read `2xx` body; throws an
 * `ApiError` for any other status or an unreadable `2xx` body, a
 * `ConnectionError` when no response arrived, or the caller's abort reason.
 */
async function attempt<T>(
  config: TransportConfig,
  out: Outgoing,
  read: ReadBody<T>,
  authorization: string | undefined,
  requestId: string,
  policy: CallPolicy,
): Promise<T> {
  const headers: Record<string, string> = {};
  if (authorization !== undefined) headers.Authorization = authorization;
  if (out.contentType !== undefined) headers["Content-Type"] = out.contentType;
  headers["X-Request-Id"] = requestId;
  if (config.userAgent !== undefined) headers["User-Agent"] = config.userAgent;
  if (out.idempotencyKey !== undefined) {
    headers["Idempotency-Key"] = out.idempotencyKey;
  }
  mergeHeaders(headers, config.defaultHeaders);
  mergeHeaders(headers, policy.headers);

  const { signal } = policy;
  const timeout = AbortSignal.timeout(policy.timeout);
  const combined =
    signal === undefined ? timeout : AbortSignal.any([signal, timeout]);
  const doFetch = config.fetch ?? globalThis.fetch;

  const init: RequestInit = {
    method: out.method,
    headers,
    ...(out.body === undefined ? {} : { body: out.body }),
    signal: combined,
    // A redirect is never followed, so Authorization never travels to
    // another location.
    redirect: "manual",
  };

  let response: Response;
  let text: string;
  try {
    response = await doFetch(out.url, init);
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
    const result = read(text);
    if (result !== undefined) return result.value;
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

function worthRepeating(
  err: ApiError | ConnectionError,
  policy: CallPolicy,
): boolean {
  if (err instanceof ConnectionError) return true;
  if (isRetryableStatus(err.status)) return true;
  // The first request with this key is still running; a later attempt can
  // collect its outcome.
  return (
    policy.retryKeyInUse &&
    err.status === 409 &&
    err.code === "idempotency_key_in_use"
  );
}

/** The `Authorization` value of one attempt, reading a fresh bearer token. */
async function authorizationOf(
  config: TransportConfig,
  out: Outgoing,
): Promise<string | undefined> {
  const { authorization } = out;
  if (authorization === "none") return undefined;
  if (authorization === "bearer") return `Bearer ${await bearerToken(config)}`;
  return `Report ${authorization.report}`;
}

/**
 * Sends a request, retrying a failure worth repeating when the request is
 * eligible. The body is the same on every attempt. Each attempt reads a
 * fresh token and sends a fresh `X-Request-Id`.
 */
export async function send<T>(
  config: TransportConfig,
  out: Outgoing,
  read: ReadBody<T>,
  policy: CallPolicy,
): Promise<T> {
  const maxRetries = policy.eligible ? policy.maxRetries : 0;
  for (let retry = 0; ; retry++) {
    // An error from the token provider ends the call unwrapped and unretried.
    const authorization = await authorizationOf(config, out);
    try {
      return await attempt(config, out, read, authorization, uuidv4(), policy);
    } catch (err) {
      if (!(err instanceof ApiError || err instanceof ConnectionError))
        throw err;
      if (!worthRepeating(err, policy) || retry >= maxRetries) throw err;
      let wait: number;
      if (err instanceof ApiError && err.retryAfter !== undefined) {
        if (err.retryAfter > MAX_RETRY_AFTER_MS) throw err;
        wait = err.retryAfter;
      } else {
        wait = backoffMs(retry + 1);
      }
      await sleep(wait, policy.signal);
    }
  }
}

/**
 * Posts a JSON body that a retry cannot apply twice, such as an ingest
 * batch, retrying a failure worth repeating.
 */
export function post<T>(
  config: TransportConfig,
  path: string,
  body: Uint8Array,
  read: (body: unknown) => T | undefined,
  policy: Omit<CallPolicy, "eligible" | "retryKeyInUse">,
): Promise<T> {
  return send(
    config,
    {
      method: "POST",
      url: joinURL(config.baseURL, path),
      authorization: "bearer",
      body,
      contentType: "application/json",
      idempotencyKey: undefined,
    },
    (text) => {
      const parsed = parseJSON(text);
      const value = parsed === undefined ? undefined : read(parsed);
      return value === undefined ? undefined : { value };
    },
    { ...policy, eligible: true, retryKeyInUse: false },
  );
}
