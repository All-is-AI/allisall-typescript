// Reading a shared report with its share token. It is a function, not a
// client method: its caller, such as a server rendering the report's page,
// holds no API key and no session, which a client requires.

import { transportSettings } from "./client.js";
import { AllisallError } from "./errors.js";
import { request } from "./request.js";
import { isBrowser } from "./runtime.js";
import {
  type FetchLike,
  isPrintableCredential,
  type TransportConfig,
} from "./transport.js";
import type { PublicReport } from "./types.js";

/** The options of `getSharedReport`. Every one is optional. */
export interface SharedReportOptions {
  /**
   * The API's base URL, absolute, `http` or `https`. Defaults to
   * `AIA_BASE_URL` from the environment, then `https://api.allisai.ai`.
   * In a browser it may also be a path on the page's own origin, starting
   * with a single `/`.
   */
  baseURL?: string | undefined;
  /** The timeout of each attempt, in milliseconds. Defaults to 60,000. */
  timeout?: number | undefined;
  /** How many times a failure worth repeating is retried. Defaults to 2; 0 turns retries off. */
  maxRetries?: number | undefined;
  /** The `fetch` to send the request with. Defaults to the platform's own. */
  fetch?: FetchLike | undefined;
  /** Cancels the call, including any wait between retries. */
  signal?: AbortSignal | undefined;
  /**
   * Extra headers to send. They may not name `Authorization`,
   * `Content-Type`, `Idempotency-Key` or `X-Request-Id`, which the SDK sets.
   */
  headers?: Readonly<Record<string, string>> | undefined;
}

/** Trims a share token and checks it can travel in a header. */
function checkedShareToken(shareToken: unknown): string {
  const token = typeof shareToken === "string" ? shareToken.trim() : "";
  if (token === "") {
    throw new AllisallError("allisall: the share token is empty");
  }
  if (!isPrintableCredential(token)) {
    throw new AllisallError(
      "allisall: the share token holds a character other than printable ASCII, which cannot be sent",
    );
  }
  return token;
}

/**
 * Reads a shared report with its share token, as the report's recipient
 * sees it. Needs no API key and no session, and never reads `AIA_API_KEY`.
 *
 * A share token is a bearer capability: anyone holding it can read the
 * report. Handle it like a secret, and keep it out of URLs and logs. The
 * SDK sends it only in the `Authorization` header, as
 * `Authorization: Report <token>`, and keeps it for this call alone.
 *
 * Every failure, a missing, unknown or revoked token included, is the same
 * `404`, as an `ApiError`. Each read stamps the report's view times, and a
 * retry after a lost response stamps them again.
 *
 * Operation `getSharedReport`.
 *
 * @param shareToken - the report's share token.
 * @throws {AllisallError} when the share token is empty or holds a
 * character other than printable ASCII, or an option is one a client would
 * refuse, before anything is sent.
 * @throws {TypeError} when `options.headers` is not a plain object of
 * header names and string values, or names a header the SDK sets, before
 * anything is sent.
 * @throws {ApiError} for an error response, such as the `404` for a token
 * that reads no report.
 * @throws {ConnectionError} when no response arrived, after any retries.
 */
export async function getSharedReport(
  shareToken: string,
  options: SharedReportOptions = {},
): Promise<PublicReport> {
  const token = checkedShareToken(shareToken);
  const config: TransportConfig = {
    ...transportSettings(options, isBrowser()),
    // The share token is the call's only credential, and it is not an API
    // key, so no browser opt-in applies. No client sends default headers.
    credential: undefined,
    refuseApiKeys: false,
    defaultHeaders: {},
  };
  return request(config, "getSharedReport", {
    shareToken: token,
    options: { signal: options.signal, headers: options.headers },
  });
}
