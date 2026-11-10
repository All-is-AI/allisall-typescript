// One operation, driven by the operation table: the URL and its query, the
// headers, the body encoded once, the retries the operation is eligible
// for, and the decoded response. Every resource method calls `request` or
// `requestPage`; the ingest helper keeps its own path.

import { AllisallError } from "./errors.js";
import type { operations } from "./generated/openapi.js";
import {
  OPERATIONS,
  type Operation,
  type OperationId,
} from "./generated/operations.js";
import { decodeJson, encodeJson, type MoneyInput } from "./money.js";
import { formOf, type ImportUpload } from "./multipart.js";
import {
  type IdempotentRequestOptions,
  mergeHeaders,
  type RequestOptions,
  resolveHeaders,
  resolveMaxRetries,
  resolveTimeout,
} from "./options.js";
import { type ListBody, Page, PagePromise } from "./pagination.js";
import {
  type Authorization,
  type CallPolicy,
  joinURL,
  type Outgoing,
  type ReadBody,
  send,
  type TransportConfig,
} from "./transport.js";
import type { QueryOf } from "./types.js";
import { hasLoneSurrogate } from "./unicode.js";
import { uuidv4 } from "./uuid.js";

type Responses<K extends OperationId> = operations[K]["responses"];
type SuccessStatus = 200 | 201 | 202 | 204;

/**
 * The decoded body of an operation's success response, from the generated
 * types: `undefined` for a response without a body.
 */
export type SuccessBody<K extends OperationId> = Responses<K>[Extract<
  keyof Responses<K>,
  SuccessStatus
>] extends {
  content: { "application/json": infer B };
}
  ? B
  : undefined;

/** What one call sends, beyond what the operation table fixes. */
export interface CallArgs {
  /** The path parameters, by the name the path template gives each. */
  readonly path?: Readonly<Record<string, string>> | undefined;
  /** The query, written member by member in the object's own order. */
  readonly query?: object | undefined;
  /** The body: JSON for a JSON or merge-patch operation, an upload for a multipart one. */
  readonly body?: unknown;
  readonly options?: IdempotentRequestOptions | undefined;
  /**
   * The share token of a shared report, already checked. Only the shared
   * report's operation takes one, and it takes nothing else.
   */
  readonly shareToken?: string | undefined;
}

const CONTENT_TYPES = {
  json: "application/json",
  "merge-patch": "application/merge-patch+json",
} as const;

const PATH_PARAMETER = /\{([^{}]+)\}/g;

/** Fills the path template, each parameter percent-encoded as one segment. */
function fillPath(
  template: string,
  values: Readonly<Record<string, string>>,
): string {
  return template.replace(PATH_PARAMETER, (_, name: string) => {
    const value: unknown = values[name];
    if (typeof value !== "string") {
      throw new TypeError(
        `allisall: the path parameter ${name} must be a string`,
      );
    }
    // These cannot travel as one segment: a URL resolves "." and ".." as
    // steps through the path, whether or not they are percent-encoded, and
    // an empty segment changes which path is meant.
    if (value === "" || value === "." || value === "..") {
      throw new TypeError(
        `allisall: the path parameter ${name} is ${JSON.stringify(value)}, which cannot be sent as a path segment`,
      );
    }
    // encodeURIComponent would throw a URIError naming nothing.
    if (hasLoneSurrogate(value)) {
      throw new TypeError(
        `allisall: the path parameter ${name} is not valid Unicode (a lone surrogate)`,
      );
    }
    return encodeURIComponent(value);
  });
}

/**
 * A query value's text. A string holding a lone surrogate is refused: the
 * URL would carry U+FFFD in its place.
 */
function queryText(name: string, value: unknown): string {
  if (hasLoneSurrogate(name)) {
    throw new TypeError(
      "allisall: a query parameter name is not valid Unicode (a lone surrogate)",
    );
  }
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new TypeError(
        `allisall: the query parameter ${name} is an invalid Date`,
      );
    }
    return value.toISOString();
  }
  if (typeof value === "string") {
    if (hasLoneSurrogate(value)) {
      throw new TypeError(
        `allisall: the query parameter ${name} is not valid Unicode (a lone surrogate)`,
      );
    }
    return value;
  }
  if (typeof value === "number" || typeof value === "bigint") {
    return String(value);
  }
  throw new TypeError(
    `allisall: the query parameter ${name} is ${value === null ? "null" : `a ${typeof value}`}; it must be a string, a number or a Date`,
  );
}

/** Builds the URL: the base, the filled path, and the query in the caller's order. */
function buildURL(
  config: TransportConfig,
  operation: Operation,
  path: Readonly<Record<string, string>>,
  query: object | undefined,
): string {
  const url = new URL(joinURL(config.baseURL, fillPath(operation.path, path)));
  if (query !== undefined) {
    for (const [name, value] of Object.entries(query)) {
      // An absent member is left out; the SDK writes no parameter of its own.
      if (value === undefined) continue;
      if (operation.repeatable.includes(name)) {
        // One parameter per item, in order. Only an array is accepted, so a
        // lone string is refused too; an empty array has no faithful form,
        // because leaving the parameter out means every value.
        if (!Array.isArray(value)) {
          throw new TypeError(
            `allisall: the query parameter ${name} takes an array of values`,
          );
        }
        if (value.length === 0) {
          throw new TypeError(
            `allisall: the query parameter ${name} is an empty array; leave it out to match every value`,
          );
        }
        for (const item of value) {
          url.searchParams.append(name, queryText(name, item));
        }
        continue;
      }
      url.searchParams.append(name, queryText(name, value));
    }
  }
  return url.href;
}

const utf8 = new TextEncoder();

/** Encodes the body once, before the first attempt. */
function encodeBody(
  operation: Operation,
  body: unknown,
): Pick<Outgoing, "body" | "contentType"> {
  switch (operation.body) {
    case "none":
      // The API refuses any body here, so one passed is a mistake, not
      // something to drop in silence.
      if (body !== undefined) {
        throw new TypeError(
          "allisall: this operation takes no request body, but one was passed",
        );
      }
      return { body: undefined, contentType: undefined };
    case "json":
    case "merge-patch":
      return {
        body: utf8.encode(encodeJson(body, operation.requestMoney)),
        contentType: CONTENT_TYPES[operation.body],
      };
    case "multipart":
      // The form's own boundary is written by fetch, with its Content-Type.
      return {
        // The operation table's multipart operations take an ImportUpload;
        // the methods calling them are typed so.
        body: formOf(body as ImportUpload),
        contentType: undefined,
      };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Reads a success body: decoded with exact money, and a JSON object. A
 * body `accept` refuses is unreadable, as a breached envelope is.
 */
function readerFor(
  operation: Operation,
  accept: (value: Record<string, unknown>) => boolean = () => true,
): ReadBody<unknown> {
  if (operation.status === 204) return () => ({ value: undefined });
  return (text) => {
    let value: unknown;
    try {
      value = decodeJson(text, operation.responseMoney);
    } catch (err) {
      if (err instanceof SyntaxError) return undefined;
      throw err;
    }
    if (!isRecord(value)) return undefined;
    if (operation.list !== null && !isListBody(value)) return undefined;
    if (!accept(value)) return undefined;
    return { value };
  };
}

/**
 * Checks a list's envelope: an array `data`, a boolean `has_more`, and a
 * `next_cursor` that is a string or `null`, and a non-empty string when
 * `has_more` is true.
 */
function isListBody(value: Record<string, unknown>): boolean {
  const { data, has_more, next_cursor } = value;
  if (!Array.isArray(data) || typeof has_more !== "boolean") return false;
  if (next_cursor !== null && typeof next_cursor !== "string") return false;
  return !has_more || (typeof next_cursor === "string" && next_cursor !== "");
}

/**
 * The one `PUT` a retry cannot repeat safely. Its `version` guard refuses a
 * repeat of a write that already landed, as a stale version, so a retry
 * after a lost response would report a failure for a write that succeeded.
 */
const VERSION_GUARDED_PUT: OperationId = "setValueModelLineItems";

/**
 * Whether a retry cannot apply the request twice: a method RFC 9110 defines
 * as idempotent, an operation sent with an `Idempotency-Key`, or ingest,
 * whose `event_id`s deduplicate. The version-guarded `PUT` is the exception.
 */
export function isEligible(id: OperationId, operation: Operation): boolean {
  switch (operation.method) {
    case "GET":
    case "DELETE":
      return true;
    case "PUT":
      return id !== VERSION_GUARDED_PUT;
    case "PATCH":
      return false;
    case "POST":
      return operation.idempotent || id === "ingestEvents";
  }
}

/**
 * What one call may do: its operation's retry eligibility, and the call's
 * options resolved over the client's.
 *
 * @throws {AllisallError} for a `timeout` or `maxRetries` the client would refuse.
 * @throws {TypeError} for headers that are not a plain object of headers, or
 * that name a header the SDK sets.
 */
export function policyOf(
  config: TransportConfig,
  id: OperationId,
  operation: Operation,
  options: RequestOptions,
): CallPolicy {
  return {
    timeout: resolveTimeout(options.timeout, config.timeout),
    maxRetries: resolveMaxRetries(options.maxRetries, config.maxRetries),
    headers: resolveHeaders(options.headers, "headers"),
    signal: options.signal,
    eligible: isEligible(id, operation),
    retryKeyInUse: operation.idempotent,
  };
}

function outgoing(
  config: TransportConfig,
  operation: Operation,
  args: CallArgs,
  options: IdempotentRequestOptions,
): Outgoing {
  return {
    method: operation.method,
    url: buildURL(config, operation, args.path ?? {}, args.query),
    authorization: authorizationFor(operation, args.shareToken),
    ...encodeBody(operation, args.body),
    // One key per call, the same on every attempt.
    idempotencyKey: operation.idempotent
      ? (checkedKey(options.idempotencyKey) ?? uuidv4())
      : undefined,
  };
}

/**
 * The credential an operation's access policy calls for. A shared report
 * takes its share token, and only its own function passes one: the client's
 * credential never reaches it, and a share token reaches nothing else.
 *
 * @throws {AllisallError} for a shared report without a share token, or a
 * share token passed to any other operation.
 */
function authorizationFor(
  operation: Operation,
  shareToken: string | undefined,
): Authorization {
  if (operation.access === "ShareToken") {
    if (shareToken === undefined) {
      throw new AllisallError(
        "allisall: a shared report is read with its share token, not with the client's credential",
      );
    }
    return { report: shareToken };
  }
  if (shareToken !== undefined) {
    throw new AllisallError(
      "allisall: a share token is sent only to read a shared report",
    );
  }
  return operation.access === "Public" ? "none" : "bearer";
}

/**
 * A caller's `Idempotency-Key`, checked only as far as the platform can
 * send it. Its syntax is the API's to judge. A key `fetch` cannot send
 * would fail every attempt before sending, and each failure would read as
 * a connection error worth retrying.
 *
 * @throws {TypeError} when the key is not a string, or not a valid header value.
 */
function checkedKey(key: unknown): string | undefined {
  if (key === undefined) return undefined;
  if (typeof key !== "string") {
    throw new TypeError(
      `allisall: idempotencyKey must be a string, not ${key === null ? "null" : `a ${typeof key}`}`,
    );
  }
  try {
    new Headers({ "Idempotency-Key": key });
  } catch {
    throw new TypeError(
      "allisall: idempotencyKey holds a character a header value cannot carry, such as a newline or a character above U+00FF",
    );
  }
  return key;
}

/**
 * Calls one operation and resolves with its decoded success body.
 *
 * Everything the call sends is fixed before the first attempt: its URL, its
 * body's bytes and its `Idempotency-Key`. Retries follow the operation's
 * eligibility. A `204` resolves with `undefined`.
 */
export function request<K extends OperationId>(
  config: TransportConfig,
  id: K,
  args: CallArgs = {},
): Promise<SuccessBody<K>> {
  return requestAccepting(config, id, args, undefined);
}

/** `request`, with a check of the success body beyond the operation's own. */
async function requestAccepting<K extends OperationId>(
  config: TransportConfig,
  id: K,
  args: CallArgs,
  accept: ((value: Record<string, unknown>) => boolean) | undefined,
): Promise<SuccessBody<K>> {
  const operation: Operation = OPERATIONS[id];
  const options = args.options ?? {};
  const policy = policyOf(config, id, operation, options);
  const out = outgoing(config, operation, args, options);
  const value = await send(config, out, readerFor(operation, accept), policy);
  // The reader checked what the SDK relies on: a JSON object, a list's
  // envelope, and money decoded at the operation's money paths. The rest
  // is the server's to keep to the generated type.
  return value as SuccessBody<K>;
}

/** The item type of a list operation's page. */
type ItemOf<B> = B extends { readonly data: readonly (infer I)[] } ? I : never;

/**
 * Calls a list operation lazily: nothing is sent until the result is
 * awaited or iterated. Each following page sends the same query with
 * `cursor` set to the previous page's `next_cursor` and without `page`.
 *
 * The walk remembers every cursor it has sent since the list call, with
 * the position of the page each requested; a cursor the caller's own query
 * held requested the first. A page with `has_more` whose `next_cursor` was
 * sent for a page at another position would walk in a cycle, so it is
 * unreadable: an `ApiError` with the page's status and no problem. Walking
 * again from an earlier page sends each cursor for its own position, and is
 * not refused.
 */
export function requestPage<K extends OperationId>(
  config: TransportConfig,
  id: K,
  args: CallArgs = {},
): PagePromise<ItemOf<SuccessBody<K>>, Extract<SuccessBody<K>, ListBody>> {
  type Body = Extract<SuccessBody<K>, ListBody>;
  type Item = ItemOf<SuccessBody<K>>;
  if (OPERATIONS[id].list === null) {
    throw new TypeError(`allisall: ${id} is not a list operation`);
  }
  // The call's options apply to every page; an override passed to
  // getNextPage applies to that one request, over them.
  const callOptions: RequestOptions = args.options ?? {};
  // Each cursor sent, with the position of the page it requested: 0 for
  // the first page, 1 for the next, and so on.
  const sent = new Map<string, number>();
  // A next cursor that requested a page at another position would walk in
  // a cycle. One recorded at the same position is the same page requested
  // again, as when a walk restarts from an earlier page.
  const breaksNoCycle =
    (nextPosition: number) =>
    (value: Record<string, unknown>): boolean => {
      if (value.has_more !== true || typeof value.next_cursor !== "string") {
        return true;
      }
      const position = sent.get(value.next_cursor);
      return position === undefined || position === nextPosition;
    };
  const load = async (
    query: object | undefined,
    override: RequestOptions | undefined,
    position: number,
  ): Promise<Page<Item, Body>> => {
    const options =
      override === undefined ? callOptions : overlay(callOptions, override);
    const cursor: unknown =
      query === undefined ? undefined : Reflect.get(query, "cursor");
    if (typeof cursor === "string" && !sent.has(cursor)) {
      sent.set(cursor, position);
    }
    const body = await requestAccepting(
      config,
      id,
      pageArgs(args, query, options),
      breaksNoCycle(position + 1),
    );
    // A list operation's reader checked the envelope.
    const list = body as Body;
    const pinnedName = PINNED_ECHO[id];
    const pinnedValue: unknown =
      pinnedName === undefined ? undefined : Reflect.get(list, pinnedName);
    const next =
      list.has_more && typeof list.next_cursor === "string"
        ? nextQuery(
            query,
            list.next_cursor,
            // An empty or non-string echo is not pinned: the API refuses an
            // empty parameter.
            pinnedName !== undefined &&
              typeof pinnedValue === "string" &&
              pinnedValue !== ""
              ? { name: pinnedName, value: pinnedValue }
              : undefined,
          )
        : undefined;
    return new Page<Item, Body>(
      list,
      next === undefined
        ? undefined
        : (nextOverride) => load(next, nextOverride, position + 1),
    );
  };
  return new PagePromise(() => load(args.query, undefined, 0));
}

/**
 * The arguments of one page's request: the call's own, with the query and
 * options paging sets for that page. Every other member is carried forward.
 */
export function pageArgs(
  args: CallArgs,
  query: object | undefined,
  options: RequestOptions,
): CallArgs {
  return { ...args, query, options };
}

/**
 * Lays one request's options over the call's. A member left out, or set to
 * `undefined`, keeps the call's; `headers` are laid over the call's
 * headers name by name, as a call's are over the client's.
 *
 * @throws {TypeError} when either set of headers is not a plain object of
 * headers, or names a header the SDK sets.
 */
function overlay(
  call: RequestOptions,
  override: RequestOptions,
): RequestOptions {
  const merged: RequestOptions = { ...call };
  if (override.signal !== undefined) merged.signal = override.signal;
  if (override.timeout !== undefined) merged.timeout = override.timeout;
  if (override.maxRetries !== undefined) {
    merged.maxRetries = override.maxRetries;
  }
  if (override.headers !== undefined) {
    const headers = { ...resolveHeaders(call.headers, "headers") };
    mergeHeaders(headers, resolveHeaders(override.headers, "headers"));
    merged.headers = headers;
  }
  return merged;
}

/**
 * The query member a walk pins to its first page's answer, by operation:
 * when the caller's query leaves the member out, every later page sends the
 * value the first page's body echoed. On the renewals list it is `today`,
 * so a walk that crosses UTC midnight reads every page under one date.
 */
export const PINNED_ECHO: { readonly [K in OperationId]?: string } = {
  listRenewals: "today",
};

/**
 * The query of the next page: the same members, `page` dropped, `cursor`
 * set, and the pinned member, when the caller left it out, set to the value
 * the first page echoed.
 */
function nextQuery(
  query: object | undefined,
  cursor: string,
  pinned?: { readonly name: string; readonly value: unknown },
): object {
  const next: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(query ?? {})) {
    if (name !== "page") next[name] = value;
  }
  if (pinned !== undefined && next[pinned.name] === undefined) {
    next[pinned.name] = pinned.value;
  }
  next.cursor = cursor;
  return next;
}

/** An operation's path parameters, from the generated types. */
type PathOf<K extends OperationId> = NonNullable<
  operations[K]["parameters"]["path"]
>;

/**
 * The query member of an operation's arguments: required when the
 * generated types require the query, which they do when any one of its
 * parameters is required, and optional otherwise.
 */
type QueryArgs<K extends OperationId> =
  undefined extends operations[K]["parameters"]["query"]
    ? { readonly query?: QueryOf<K> | undefined }
    : { readonly query: QueryOf<K> };

/**
 * The body an operation takes, from the generated types: an `ImportUpload`
 * for a form, and otherwise the JSON body with its money widened.
 */
type BodyOf<K extends OperationId> = operations[K] extends {
  requestBody: { content: infer C };
}
  ? "multipart/form-data" extends keyof C
    ? ImportUpload
    : MoneyInput<C[keyof C]>
  : never;

/**
 * What a resource method passes for one operation, typed from the generated
 * types. A change to the API that retypes an operation's path, query or
 * body, or that makes its query required, fails the compile of the method
 * that calls it.
 */
export type OperationArgs<K extends OperationId> = {
  readonly path?: PathOf<K>;
  readonly body?: BodyOf<K>;
  readonly options?: IdempotentRequestOptions | undefined;
} & QueryArgs<K>;

/** Calls one operation with arguments typed for it; see `request`. */
export function call<K extends OperationId>(
  config: TransportConfig,
  id: K,
  args: OperationArgs<K>,
): Promise<SuccessBody<K>> {
  return request(config, id, args);
}

/** Calls one list operation with arguments typed for it; see `requestPage`. */
export function callPage<K extends OperationId>(
  config: TransportConfig,
  id: K,
  args: OperationArgs<K>,
): PagePromise<ItemOf<SuccessBody<K>>, Extract<SuccessBody<K>, ListBody>> {
  return requestPage(config, id, args);
}
