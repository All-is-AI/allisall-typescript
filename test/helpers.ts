// Test helpers: a fake fetch that records every request, and event fixtures
// sized without the SDK's own encoder.

import type { EventInput, FetchLike } from "../src/index.js";

export interface Recorded {
  url: string;
  headers: Record<string, string>;
  /** The exact bytes sent. */
  body: Uint8Array;
  /** The `redirect` option the request was sent with. */
  redirect: RequestInit["redirect"];
  /** The body decoded as UTF-8. */
  text: string;
  /** The `events` array the body held. */
  events: Record<string, unknown>[];
}

/** Answers one request; may also throw or reject, as a failed connection does. */
export type Responder = (
  req: Recorded,
  signal: AbortSignal | undefined,
) => Response | Promise<Response>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toBytes(body: RequestInit["body"]): Uint8Array {
  // A copy, so the record holds the bytes as they were when sent.
  if (body instanceof Uint8Array) return body.slice();
  if (typeof body === "string") return new TextEncoder().encode(body);
  throw new Error(`unexpected body type ${typeof body}`);
}

/** The API's success for a batch: every event accepted. */
export function accepted(req: Recorded): Response {
  return json(200, {
    accepted: req.events.length,
    duplicates: 0,
    rejected: 0,
    errors: [],
    errors_truncated: false,
  });
}

export function json(
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

export function problem(
  status: number,
  code: string,
  extra: Record<string, unknown> = {},
  headers: Record<string, string> = {},
): Response {
  return new Response(
    JSON.stringify({
      type: `https://api.allisai.ai/errors/${code}`,
      title: "A title",
      status,
      detail: "A detail",
      code,
      request_id: "req-from-problem",
      ...extra,
    }),
    {
      status,
      headers: { "Content-Type": "application/problem+json", ...headers },
    },
  );
}

/**
 * A fake fetch. Each request is answered by the next responder in `queue`;
 * once the queue is empty, by `fallback` (every event accepted).
 */
export function fakeFetch(
  queue: Responder[] = [],
  fallback: Responder = accepted,
): { fetch: FetchLike; calls: Recorded[] } {
  const calls: Recorded[] = [];
  const fetch: FetchLike = async (url, init) => {
    const body = toBytes(init.body);
    const text = new TextDecoder().decode(body);
    const parsed: unknown = JSON.parse(text);
    const events =
      isRecord(parsed) && Array.isArray(parsed.events)
        ? parsed.events.filter(isRecord)
        : [];
    const headers: Record<string, string> = {};
    new Headers(init.headers).forEach((value, name) => {
      headers[name] = value;
    });
    const req: Recorded = {
      url,
      headers,
      body,
      redirect: init.redirect,
      text,
      events,
    };
    calls.push(req);
    const responder = queue.shift() ?? fallback;
    return responder(req, init.signal ?? undefined);
  };
  return { fetch, calls };
}

/** A connection reset, as `fetch` reports one. */
export function reset(): never {
  throw new TypeError("fetch failed", {
    cause: Object.assign(new Error("read ECONNRESET"), { code: "ECONNRESET" }),
  });
}

/** A small valid event. */
export function event(n: number, extra: Partial<EventInput> = {}): EventInput {
  return {
    timestamp: "2026-10-01T00:00:00Z",
    agent_key: "agent-1",
    category: "task",
    event_type: `step-${n}`,
    ...extra,
  };
}

const utf8 = new TextEncoder();

export function byteLength(text: string): number {
  return utf8.encode(text).length;
}

/**
 * An event, with its own `event_id` so its size is fixed, whose compact
 * JSON is exactly `size` bytes of UTF-8. `metadata.pad` is filled with
 * `filler` repeated, then ASCII `x` to the exact size. The size is computed
 * with `JSON.stringify`, independently of the SDK's encoder.
 */
export function eventOfSize(size: number, id: string, filler = ""): EventInput {
  const make = (pad: string): EventInput => ({
    event_id: id,
    timestamp: "2026-10-01T00:00:00Z",
    agent_key: "agent-1",
    category: "task",
    event_type: "padded",
    metadata: { pad },
  });
  const base = byteLength(JSON.stringify(make(filler)));
  if (base > size) throw new Error(`size ${size} is below the minimum ${base}`);
  const e = make(filler + "x".repeat(size - base));
  const actual = byteLength(JSON.stringify(e));
  if (actual !== size) throw new Error(`built ${actual} bytes, wanted ${size}`);
  return e;
}

export const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/** Asserts that `value` is an instance of `type`, and narrows it. */
export function instance<T>(
  value: unknown,
  type: abstract new (...args: never[]) => T,
): T {
  if (!(value instanceof type)) {
    throw new Error(
      `expected an instance of ${type.name}, got ${String(value)}`,
    );
  }
  return value;
}
