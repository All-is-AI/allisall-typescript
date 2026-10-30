// The client: its options, and how the credential and the base URL are
// resolved at construction.

import { AllisallError } from "./errors.js";
import { ingest, readIngestResult } from "./ingest.js";
import { isBrowser, readEnv, userAgent } from "./runtime.js";
import {
  BROWSER_KEY_MESSAGE,
  type Credential,
  type FetchLike,
  isPrintableCredential,
  post,
  type TokenProvider,
  type TransportConfig,
} from "./transport.js";
import type { EventInput, IngestSummary } from "./types.js";

const DEFAULT_BASE_URL = "https://api.allisai.ai";
const DEFAULT_TIMEOUT_MS = 60_000;
const DEFAULT_MAX_RETRIES = 2;

/** The options of `new Allisall()`. Every one is optional. */
export interface ClientOptions {
  /**
   * The API key. Defaults to `AIA_API_KEY` from the environment. Pass
   * either this or `tokenProvider`, not both.
   */
  apiKey?: string | undefined;
  /**
   * A callback returning the bearer token to send, called before every
   * attempt, retries included. Use it to supply an API key fetched at run
   * time, for example from a secret store.
   */
  tokenProvider?: TokenProvider | undefined;
  /**
   * The API's base URL, absolute, `http` or `https`. Defaults to
   * `AIA_BASE_URL` from the environment, then `https://api.allisai.ai`.
   */
  baseURL?: string | undefined;
  /** The timeout of each attempt, in milliseconds. Defaults to 60,000. */
  timeout?: number | undefined;
  /** How many times a failure worth repeating is retried. Defaults to 2; 0 turns retries off. */
  maxRetries?: number | undefined;
  /** The `fetch` to send requests with. Defaults to the platform's own. */
  fetch?: FetchLike | undefined;
  /**
   * Allows an API key in a browser, where anyone who loads the page can
   * read it. Defaults to `false`.
   */
  dangerouslyAllowBrowser?: boolean | undefined;
}

/** The options of one call. */
export interface RequestOptions {
  /** Cancels the call, including any wait between retries. */
  signal?: AbortSignal | undefined;
}

function resolveCredential(options: ClientOptions): Credential {
  const { apiKey, tokenProvider } = options;
  if (apiKey !== undefined && tokenProvider !== undefined) {
    throw new AllisallError(
      "allisall: pass either apiKey or tokenProvider, not both",
    );
  }
  if (tokenProvider !== undefined) {
    if (typeof tokenProvider !== "function") {
      throw new AllisallError("allisall: tokenProvider must be a function");
    }
    return { kind: "provider", provider: tokenProvider };
  }
  if (apiKey !== undefined) {
    const key = typeof apiKey === "string" ? apiKey.trim() : "";
    if (key === "") {
      throw new AllisallError("allisall: apiKey is empty");
    }
    if (!isPrintableCredential(key)) {
      throw new AllisallError(
        "allisall: apiKey holds a character other than printable ASCII, which cannot be sent",
      );
    }
    return { kind: "apiKey", apiKey: key };
  }
  // A variable of white space alone counts as unset.
  const fromEnv = readEnv("AIA_API_KEY")?.trim();
  if (fromEnv !== undefined && fromEnv !== "") {
    if (!isPrintableCredential(fromEnv)) {
      throw new AllisallError(
        "allisall: AIA_API_KEY holds a character other than printable ASCII, which cannot be sent",
      );
    }
    return { kind: "apiKey", apiKey: fromEnv };
  }
  throw new AllisallError(
    "allisall: no credential; pass apiKey or tokenProvider, or set AIA_API_KEY",
  );
}

function resolveBaseURL(option: string | undefined): URL {
  const raw = option ?? readEnv("AIA_BASE_URL") ?? DEFAULT_BASE_URL;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new AllisallError(
      `allisall: the base URL ${JSON.stringify(raw)} is not an absolute URL`,
    );
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new AllisallError(
      `allisall: the base URL ${JSON.stringify(raw)} is not http or https`,
    );
  }
  return url;
}

function resolveTimeout(option: number | undefined): number {
  const timeout = option ?? DEFAULT_TIMEOUT_MS;
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

function resolveMaxRetries(option: number | undefined): number {
  const maxRetries = option ?? DEFAULT_MAX_RETRIES;
  if (!Number.isInteger(maxRetries) || maxRetries < 0) {
    throw new AllisallError(
      `allisall: maxRetries must be a whole number, 0 or more, not ${String(maxRetries)}`,
    );
  }
  return maxRetries;
}

/** The `events` operations. */
class Events {
  readonly #config: TransportConfig;

  constructor(config: TransportConfig) {
    this.#config = config;
  }

  /**
   * Ingests any number of events. They are sent in batches of at most 500
   * events and 5,000,000 bytes, one batch after another, each retried as
   * the client allows. Every event without an `event_id` gets a generated
   * one, so a retry never stores an event twice. Your objects are not
   * modified.
   *
   * An event too large to send even alone is not sent, and is reported as a
   * rejected row with the code `too_large`.
   *
   * @returns the combined outcome over the whole list.
   * @throws {IngestError} when a batch fails; the call stops there, and the
   * error carries the summary so far and every event from the failed batch
   * onward, to send again. A batch fails on an error response, on no
   * response, on the caller's cancellation, or when its token cannot be
   * had: an error from `tokenProvider`, or, in a browser without
   * `dangerouslyAllowBrowser`, a provider's token that is an API key. The
   * error is the `IngestError`'s `cause`.
   * @throws {TypeError} when an event cannot be encoded, before anything is sent.
   */
  ingest(
    events: readonly EventInput[],
    options: RequestOptions = {},
  ): Promise<IngestSummary> {
    const config = this.#config;
    return ingest(
      events,
      (body, count, signal) =>
        post(
          config,
          "/v1/events",
          body,
          (value) => readIngestResult(value, count),
          signal,
        ),
      options.signal,
    );
  }
}

/** The allisall API client. Construct one and reuse it. */
export class Allisall {
  /** The `events` operations. */
  readonly events: Events;

  /**
   * @throws {AllisallError} when there is no credential, or both an API key
   * and a token provider; when the base URL is not an absolute `http` or
   * `https` URL; when `maxRetries` is negative or `timeout` is not
   * positive; or when an API key is used in a browser without
   * `dangerouslyAllowBrowser`.
   */
  constructor(options: ClientOptions = {}) {
    const credential = resolveCredential(options);
    const browser = isBrowser();
    const refuseApiKeys = browser && options.dangerouslyAllowBrowser !== true;
    if (refuseApiKeys && credential.kind === "apiKey") {
      throw new AllisallError(BROWSER_KEY_MESSAGE);
    }
    this.events = new Events({
      baseURL: resolveBaseURL(options.baseURL),
      credential,
      timeout: resolveTimeout(options.timeout),
      maxRetries: resolveMaxRetries(options.maxRetries),
      fetch: options.fetch,
      refuseApiKeys,
      userAgent: userAgent(),
    });
  }
}
