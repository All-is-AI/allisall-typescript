// The ingest helper: assigning ids, serialising, splitting into batches,
// sending them one at a time, and combining the outcomes.

import { isDecimalText } from "./decimal.js";
import { IngestError } from "./errors.js";
import type {
  EventInput,
  IngestResult,
  IngestRowError,
  IngestSummary,
} from "./types.js";
import { uuidv4 } from "./uuid.js";

/** The most events one batch holds. */
export const MAX_BATCH_EVENTS = 500;
/** The API's body limit for a batch, in bytes, inclusive. */
export const MAX_BODY_BYTES = 5_000_000;
/** The bytes of `{"events":[` and `]}` around a batch's events. */
const ENVELOPE_BYTES = 13;
/** The largest event that fits in a batch alone. */
export const MAX_EVENT_BYTES = MAX_BODY_BYTES - ENVELOPE_BYTES;

const encoder = new TextEncoder();
const PREFIX = encoder.encode('{"events":[');
const SUFFIX = encoder.encode("]}");
const COMMA = 0x2c;

/** Sends one batch body of `count` events and resolves with the API's outcome for it. */
export type SendBatch = (
  body: Uint8Array,
  count: number,
  signal: AbortSignal | undefined,
) => Promise<IngestResult>;

/** One event, copied, given its id, and encoded. */
interface Prepared {
  /** Its index in the caller's list. */
  readonly index: number;
  readonly event: EventInput;
  readonly bytes: Uint8Array;
}

interface Batch {
  readonly events: Prepared[];
  size: number;
}

// A UTF-16 surrogate without its partner, which UTF-8 cannot encode.
const LONE_SURROGATE =
  /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;

function checkText(text: string, index: number): void {
  if (LONE_SURROGATE.test(text)) {
    throw new TypeError(
      `allisall: event ${index} holds text that is not valid Unicode (a lone surrogate)`,
    );
  }
}

/** `JSON.stringify`, refusing text that is not valid Unicode. */
function stringify(value: unknown, index: number): string | undefined {
  const text: string | undefined = JSON.stringify(
    value,
    (key: string, inner: unknown): unknown => {
      checkText(key, index);
      if (typeof inner === "string") checkText(inner, index);
      return inner;
    },
  );
  return text;
}

const NUMERIC_MEMBERS = new Set([
  "quantity",
  "cost",
  "tokens_in",
  "tokens_out",
]);

function encodeMember(
  name: string,
  value: unknown,
  index: number,
): string | undefined {
  if (typeof value === "number" && NUMERIC_MEMBERS.has(name)) {
    if (!Number.isFinite(value)) {
      throw new TypeError(
        `allisall: event ${index} has ${name} ${value}; it must be a finite number`,
      );
    }
    return JSON.stringify(value);
  }
  if (name === "cost" && typeof value === "string") {
    // A Decimal is written unquoted, so its syntax is checked again here:
    // an unbranded string from untyped code must not inject JSON.
    if (!isDecimalText(value)) {
      throw new TypeError(
        `allisall: event ${index} has cost ${JSON.stringify(value)}, which is not a decimal; build it with decimal()`,
      );
    }
    return value;
  }
  if (name === "timestamp" && value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new TypeError(
        `allisall: event ${index} has an invalid Date as its timestamp`,
      );
    }
    return JSON.stringify(value.toISOString());
  }
  return stringify(value, index);
}

/**
 * Encodes one event as compact JSON. Every member the object holds is
 * written, in its own order; a member set to `undefined` is omitted, as
 * `JSON.stringify` omits it.
 */
export function encodeEvent(event: EventInput, index: number): string {
  const members: string[] = [];
  for (const [name, value] of Object.entries(event)) {
    if (value === undefined) continue;
    const text = encodeMember(name, value, index);
    if (text === undefined) continue;
    members.push(`${stringify(name, index)}:${text}`);
  }
  return `{${members.join(",")}}`;
}

function needsId(id: unknown): boolean {
  return id === undefined || id === null || id === "";
}

function prepare(events: readonly EventInput[]): Prepared[] {
  return events.map((original, index) => {
    if (
      typeof original !== "object" ||
      original === null ||
      Array.isArray(original)
    ) {
      throw new TypeError(`allisall: event ${index} is not an object`);
    }
    const event: EventInput = { ...original };
    if (needsId(event.event_id)) event.event_id = uuidv4();
    return { index, event, bytes: encoder.encode(encodeEvent(event, index)) };
  });
}

function tooLarge(p: Prepared): IngestRowError {
  return {
    index: p.index,
    code: "too_large",
    pointer: `/events/${p.index}`,
    detail:
      `The event serialises to ${p.bytes.length} bytes and was not sent. ` +
      `The SDK sends an event of at most ${MAX_EVENT_BYTES} bytes, so that a batch holding it alone ` +
      `stays within the API's body limit of ${MAX_BODY_BYTES} bytes.`,
  };
}

/**
 * Packs events into batches in input order. A batch closes at 500 events,
 * or before an event that would take its body over 5,000,000 bytes. An
 * event too large to send alone joins no batch and becomes a row error.
 */
function split(prepared: readonly Prepared[]): {
  batches: Batch[];
  rejected: IngestRowError[];
} {
  const batches: Batch[] = [];
  const rejected: IngestRowError[] = [];
  let current: Batch | undefined;
  for (const p of prepared) {
    const size = p.bytes.length;
    if (size > MAX_EVENT_BYTES) {
      rejected.push(tooLarge(p));
      continue;
    }
    if (
      current !== undefined &&
      (current.events.length >= MAX_BATCH_EVENTS ||
        current.size + 1 + size > MAX_BODY_BYTES)
    ) {
      current = undefined;
    }
    if (current === undefined) {
      current = { events: [p], size: ENVELOPE_BYTES + size };
      batches.push(current);
    } else {
      current.events.push(p);
      current.size += 1 + size;
    }
  }
  return { batches, rejected };
}

/** Writes a batch as `{"events":[e1,e2,…,en]}`, reusing each event's bytes. */
function body(batch: Batch): Uint8Array {
  const out = new Uint8Array(batch.size);
  out.set(PREFIX, 0);
  let at = PREFIX.length;
  batch.events.forEach((p, i) => {
    if (i > 0) out[at++] = COMMA;
    out.set(p.bytes, at);
    at += p.bytes.length;
  });
  out.set(SUFFIX, at);
  return out;
}

const POINTER_ROW = /^\/events\/(\d+)(?=\/|$)/;

/** Rewrites a batch's row error to the caller's list. */
function rewrite(error: IngestRowError, batch: Batch): IngestRowError {
  const toCaller = (i: number): number => batch.events[i]?.index ?? i;
  const pointer = error.pointer.replace(
    POINTER_ROW,
    (_, row: string) => `/events/${toCaller(Number(row))}`,
  );
  return { ...error, index: toCaller(error.index), pointer };
}

/**
 * Reads a `2xx` ingest body for a batch of `count` events as an
 * `IngestResult`, or `undefined` when it is not one. A row error whose
 * `index` is not a position in the batch makes the body unreadable, as a
 * body of the wrong shape is.
 */
export function readIngestResult(
  value: unknown,
  count: number,
): IngestResult | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const accepted: unknown = Reflect.get(value, "accepted");
  const duplicates: unknown = Reflect.get(value, "duplicates");
  const rejected: unknown = Reflect.get(value, "rejected");
  const errors: unknown = Reflect.get(value, "errors");
  const truncated: unknown = Reflect.get(value, "errors_truncated");
  if (
    typeof accepted !== "number" ||
    typeof duplicates !== "number" ||
    typeof rejected !== "number" ||
    typeof truncated !== "boolean" ||
    !Array.isArray(errors)
  ) {
    return undefined;
  }
  const rows: IngestRowError[] = [];
  for (const e of errors) {
    if (typeof e !== "object" || e === null) return undefined;
    const index: unknown = Reflect.get(e, "index");
    const code: unknown = Reflect.get(e, "code");
    const pointer: unknown = Reflect.get(e, "pointer");
    const detail: unknown = Reflect.get(e, "detail");
    if (
      typeof index !== "number" ||
      typeof code !== "string" ||
      typeof pointer !== "string" ||
      typeof detail !== "string"
    ) {
      return undefined;
    }
    if (!Number.isInteger(index) || index < 0 || index >= count) {
      return undefined;
    }
    rows.push({ index, code, pointer, detail });
  }
  return {
    accepted,
    duplicates,
    rejected,
    errors: rows,
    errors_truncated: truncated,
  };
}

/**
 * Sends any number of events in as many batches as the limits require,
 * one after another, and combines their outcomes. Stops at the first batch
 * that fails, throwing an `IngestError`.
 */
export async function ingest(
  events: readonly EventInput[],
  send: SendBatch,
  signal: AbortSignal | undefined,
): Promise<IngestSummary> {
  const { batches, rejected } = split(prepare(events));
  const summary: IngestSummary = {
    accepted: 0,
    duplicates: 0,
    rejected: rejected.length,
    errors: [...rejected],
    errors_truncated: false,
    batches: 0,
  };
  const finish = (): IngestSummary => {
    // Stable, so a row's entries keep the order the API gave them.
    summary.errors.sort((a, b) => a.index - b.index);
    return summary;
  };

  for (const [i, batch] of batches.entries()) {
    let result: IngestResult;
    try {
      result = await send(body(batch), batch.events.length, signal);
    } catch (err) {
      // Every failure of a batch is wrapped, the token provider's included,
      // so the caller keeps the summary and the generated ids in remaining.
      const remaining = batches.slice(i).flatMap((b) => b.events);
      throw new IngestError(
        err,
        finish(),
        remaining.map((p) => p.event),
        remaining[0]?.index ?? 0,
      );
    }
    summary.accepted += result.accepted;
    summary.duplicates += result.duplicates;
    summary.rejected += result.rejected;
    summary.errors_truncated ||= result.errors_truncated;
    for (const error of result.errors)
      summary.errors.push(rewrite(error, batch));
    summary.batches++;
  }
  return finish();
}
