// The client: its options, and how the credential and the base URL are
// resolved at construction.

import { AllisallError } from "./errors.js";
import {
  DEFAULT_MAX_RETRIES,
  DEFAULT_TIMEOUT_MS,
  resolveHeaders,
  resolveMaxRetries,
  resolveTimeout,
} from "./options.js";
import { Agents } from "./resources/agents.js";
import { Analytics } from "./resources/analytics.js";
import { ApiKeys } from "./resources/api-keys.js";
import { Calculations } from "./resources/calculations.js";
import { Clients } from "./resources/clients.js";
import { Cost } from "./resources/cost.js";
import { DashboardOperations } from "./resources/dashboard.js";
import { Events } from "./resources/events.js";
import { HealthOperations } from "./resources/health.js";
import { Imports } from "./resources/imports.js";
import { OutcomeTypes } from "./resources/outcome-types.js";
import { Reports } from "./resources/reports.js";
import { ValueModels } from "./resources/value-models.js";
import { globalValue, isBrowser, readEnv, userAgent } from "./runtime.js";
import {
  BROWSER_KEY_MESSAGE,
  type Credential,
  type FetchLike,
  isPrintableCredential,
  type TokenProvider,
  type TransportConfig,
} from "./transport.js";

const DEFAULT_BASE_URL = "https://api.allisai.ai";

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
   *
   * In a browser it may also be a path on the page's own origin, starting
   * with a single `/`, such as `/api` for a proxy. It is resolved against
   * the page's address once, when the client is constructed.
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
  /**
   * Headers sent on every request. They may not name `Authorization`,
   * `Content-Type`, `Idempotency-Key` or `X-Request-Id`, which the SDK sets.
   * A call's own `headers` are sent over them.
   */
  defaultHeaders?: Readonly<Record<string, string>> | undefined;
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

/** Reads `globalThis.location.href`, where it exists. */
function pageAddress(): string | undefined {
  const location = globalValue("location");
  if (typeof location !== "object" || location === null) return undefined;
  const href: unknown = Reflect.get(location, "href");
  return typeof href === "string" ? href : undefined;
}

/**
 * Resolves the base URL: the option, else `AIA_BASE_URL`, else the API's
 * own host. In a browser, a path starting with a single `/` is resolved
 * against the page's address and must keep its origin.
 *
 * @throws {AllisallError} for a base URL the client refuses.
 */
function resolveBaseURL(option: string | undefined, browser: boolean): URL {
  const raw = option ?? readEnv("AIA_BASE_URL") ?? DEFAULT_BASE_URL;
  // A path on the page's own origin, such as "/api". A leading "//" names
  // another host, so it is not a path.
  const pathOnly =
    typeof raw === "string" && raw.startsWith("/") && !raw.startsWith("//");
  const page = browser && pathOnly ? pageAddress() : undefined;
  let url: URL;
  try {
    url = page === undefined ? new URL(raw) : new URL(raw, page);
  } catch {
    throw new AllisallError(
      pathOnly && browser
        ? `allisall: the base URL ${JSON.stringify(raw)} is a path, and the page's address could not be read to resolve it`
        : `allisall: the base URL ${JSON.stringify(raw)} is not an absolute URL`,
    );
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new AllisallError(
      `allisall: the base URL ${JSON.stringify(raw)} is not http or https`,
    );
  }
  // URL parsing reads a backslash as "/" and drops tabs and newlines, so a
  // value such as "/\other.example/api" passes the "//" check above and
  // still names another host. Only the resolved origin settles it.
  if (page !== undefined && url.origin !== new URL(page).origin) {
    throw new AllisallError(
      `allisall: the base URL ${JSON.stringify(raw)} is a path, but resolves to another origin, ${url.origin}`,
    );
  }
  return url;
}

/** The options a client and a shared-report call resolve alike. */
export type TransportOptions = Pick<
  ClientOptions,
  "baseURL" | "timeout" | "maxRetries" | "fetch"
>;

/**
 * Resolves what every request needs apart from its credential and default
 * headers: the base URL, timeout, retries, `fetch` and `User-Agent`, which
 * a browser does not send.
 *
 * @throws {AllisallError} for a base URL, timeout or `maxRetries` the
 * client refuses.
 */
export function transportSettings(
  options: TransportOptions,
  browser: boolean,
): Pick<
  TransportConfig,
  "baseURL" | "timeout" | "maxRetries" | "fetch" | "userAgent"
> {
  return {
    baseURL: resolveBaseURL(options.baseURL, browser),
    timeout: resolveTimeout(options.timeout, DEFAULT_TIMEOUT_MS),
    maxRetries: resolveMaxRetries(options.maxRetries, DEFAULT_MAX_RETRIES),
    fetch: options.fetch,
    userAgent: userAgent(),
  };
}

/**
 * Checks the client's options and fixes everything a request needs.
 *
 * @throws {AllisallError} for an option the client refuses.
 * @throws {TypeError} when `defaultHeaders` is not a plain object of
 * header names and string values, names a header the SDK sets, or holds a
 * name or value the platform cannot send.
 */
export function transportConfig(options: ClientOptions): TransportConfig {
  const credential = resolveCredential(options);
  const browser = isBrowser();
  const refuseApiKeys = browser && options.dangerouslyAllowBrowser !== true;
  if (refuseApiKeys && credential.kind === "apiKey") {
    throw new AllisallError(BROWSER_KEY_MESSAGE);
  }
  return {
    ...transportSettings(options, browser),
    credential,
    refuseApiKeys,
    defaultHeaders: resolveHeaders(options.defaultHeaders, "defaultHeaders"),
  };
}

/**
 * The allisall API client. Construct one and reuse it.
 *
 * Its operations are grouped by what they act on, one property per group,
 * such as `client.clients.list()`. A failed call rejects with an `ApiError`
 * for an error response, or a `ConnectionError` when no response arrived.
 */
export class Allisall {
  /** Events: ingest, and the events behind a client's totals. */
  readonly events: Events;
  /** CSV imports of events. */
  readonly imports: Imports;
  /** Clients, and the agents assigned to each. */
  readonly clients: Clients;
  /** Agents. */
  readonly agents: Agents;
  /** Value models, by their own id or by their client's, and value templates. */
  readonly valueModels: ValueModels;
  /** Outcome types, for the workspace or for one client. */
  readonly outcomeTypes: OutcomeTypes;
  /** Cost line items and the price table. */
  readonly cost: Cost;
  /** A client's value, cost, ROI and anomalies over a period. */
  readonly analytics: Analytics;
  /** Calculations, and the human steps that validate, publish and reopen them. */
  readonly calculations: Calculations;
  /** Reports on calculations, and the human steps that share and revoke them. */
  readonly reports: Reports;
  /** The workspace's month, and renewal readiness. */
  readonly dashboard: DashboardOperations;
  /** API keys, managed with a session token. */
  readonly apiKeys: ApiKeys;
  /** The API's liveness. */
  readonly health: HealthOperations;

  /**
   * @throws {AllisallError} when there is no credential, or both an API key
   * and a token provider; when the base URL is neither an absolute `http`
   * or `https` URL nor, in a browser, a path starting with a single `/`
   * that resolves to the page's own origin; when `maxRetries` is negative
   * or `timeout` is not positive; or when an API key is used in a browser
   * without `dangerouslyAllowBrowser`.
   * @throws {TypeError} when `defaultHeaders` is not a plain object of
   * header names and string values, names a header the SDK sets, or holds a
   * name or value the platform cannot send.
   */
  constructor(options: ClientOptions = {}) {
    const config = transportConfig(options);
    this.events = new Events(config);
    this.imports = new Imports(config);
    this.clients = new Clients(config);
    this.agents = new Agents(config);
    this.valueModels = new ValueModels(config);
    this.outcomeTypes = new OutcomeTypes(config);
    this.cost = new Cost(config);
    this.analytics = new Analytics(config);
    this.calculations = new Calculations(config);
    this.reports = new Reports(config);
    this.dashboard = new DashboardOperations(config);
    this.apiKeys = new ApiKeys(config);
    this.health = new HealthOperations(config);
  }
}
