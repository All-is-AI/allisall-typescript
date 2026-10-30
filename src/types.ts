// The wire types the SDK uses, written by hand from the API's OpenAPI
// document. A test reads that document and holds every list below to it,
// until types generated from the document replace this file.

import type { Decimal } from "./decimal.js";

/** The known request-level error codes, in the API's catalogue order. */
export const ERROR_CODES = [
  "invalid_json",
  "validation_failed",
  "unauthenticated",
  "insufficient_scope",
  "session_required",
  "account_not_provisioned",
  "not_found",
  "no_active_value_model",
  "method_not_allowed",
  "idempotency_key_in_use",
  "client_key_in_use",
  "agent_key_in_use",
  "client_has_events",
  "client_has_calculations",
  "agent_has_events",
  "client_key_has_events",
  "value_model_exists",
  "value_model_version_stale",
  "calculation_transition_invalid",
  "calculation_not_draft",
  "calculation_not_published",
  "report_shared",
  "report_not_shared",
  "api_key_revoked",
  "payload_too_large",
  "uri_too_long",
  "unsupported_media_type",
  "idempotency_key_reused",
  "rate_limited",
  "internal_error",
] as const;

/** The known field-level error codes, in the API's catalogue order. */
export const FIELD_ERROR_CODES = [
  "required",
  "unknown_field",
  "immutable",
  "invalid_type",
  "invalid_format",
  "invalid_value",
  "too_long",
  "too_many",
  "out_of_range",
  "too_precise",
  "duplicate",
  "too_large",
  "mutually_exclusive",
  "unknown_reference",
  "client_key_required",
  "currency_mismatch",
] as const;

/** The event categories. */
export const EVENT_CATEGORIES = [
  "session",
  "task",
  "model",
  "outcome",
  "exception",
] as const;

/** The members of `EventInput`, in the API's order. */
export const EVENT_INPUT_MEMBERS = [
  "event_id",
  "timestamp",
  "agent_key",
  "client_key",
  "category",
  "event_type",
  "outcome_type",
  "quantity",
  "cost",
  "tokens_in",
  "tokens_out",
  "model",
  "currency",
  "metadata",
] as const;

/**
 * A request-level error code. New codes are additive, so any other string
 * is possible too: branch on the codes you handle, and fall back on the
 * HTTP status for the rest.
 */
export type ErrorCode = (typeof ERROR_CODES)[number] | (string & {});

/**
 * A field-level error code, as in a rejected ingest row. New codes are
 * additive, so any other string is possible too.
 */
export type FieldErrorCode = (typeof FIELD_ERROR_CODES)[number] | (string & {});

/** An event category. */
export type EventCategory = (typeof EVENT_CATEGORIES)[number];

/**
 * One event to ingest. Members keep the API's snake_case names. The SDK
 * sends every member the object holds, so a misspelt member reaches the
 * API and is reported as a rejected row rather than dropped.
 */
export interface EventInput {
  /**
   * A sender-chosen id; a repeat within the workspace is a duplicate. When
   * it is absent, `null` or `""`, the SDK generates a UUID. Set your own
   * when the same event may be sent again in a later call, such as after a
   * queue redelivers a message.
   */
  event_id?: string | null;
  /** When the event happened: a `Date`, or an RFC 3339 instant with an offset. */
  timestamp: Date | string;
  /** The agent that acted. */
  agent_key: string;
  /** The client the event belongs to. */
  client_key?: string | null;
  /** The event's category. */
  category: EventCategory;
  /** What the agent did. */
  event_type: string;
  /** Required when `category` is `outcome`. */
  outcome_type?: string | null;
  /** Absent, `null` or `0` means 1. */
  quantity?: number | null;
  /** In `currency`, or the workspace currency: a `Decimal`, or a finite number. */
  cost?: Decimal | number | null;
  /** Tokens in. */
  tokens_in?: number | null;
  /** Tokens out. */
  tokens_out?: number | null;
  /** The model the agent invoked. */
  model?: string | null;
  /** The currency of `cost`. Absent means the workspace currency. */
  currency?: string | null;
  /** Free-form members, at most 8 KB serialised. */
  metadata?: Record<string, unknown> | null;
}

/** One problem with a rejected ingest row. */
export interface IngestRowError {
  /** The zero-based position of the row in the list passed to `ingest`. */
  index: number;
  /** The field-level code. */
  code: FieldErrorCode;
  /** An RFC 6901 JSON Pointer to the problem, starting `/events/<index>`. */
  pointer: string;
  /** Human text. Its wording may change at any time. */
  detail: string;
}

/** The outcome of one ingest batch, as the API sends it. */
export interface IngestResult {
  accepted: number;
  duplicates: number;
  rejected: number;
  errors: IngestRowError[];
  errors_truncated: boolean;
}

/** The combined outcome of one `ingest` call, over the whole list. */
export interface IngestSummary {
  /** Events stored. */
  accepted: number;
  /** Events already stored, by `event_id` or content hash. */
  duplicates: number;
  /** Events refused, counted once each, including any too large to send. */
  rejected: number;
  /** One entry per problem, in the order of the list passed to `ingest`. */
  errors: IngestRowError[];
  /** Whether any rejected row had more problems than `errors` holds. */
  errors_truncated: boolean;
  /** The number of batches sent. */
  batches: number;
}

/** One problem in a request, from a problem document's `errors`. */
export interface FieldError {
  /** The field-level code. */
  code: FieldErrorCode;
  /** An RFC 6901 JSON Pointer into the request body. */
  pointer?: string;
  /** A query parameter, by name. */
  parameter?: string;
  /** A request header, by name. */
  header?: string;
  /** A multipart part, by its form field name. */
  part?: string;
  /** A column of a CSV part. */
  column?: string;
  /** Human text. Its wording may change at any time. */
  detail: string;
}

/**
 * An RFC 9457 problem document, as the API sends it with an error status.
 * The API sends every member but `errors`; each is optional here because a
 * member of the wrong type, such as one from a proxy, is left out rather
 * than failing the whole document.
 */
export interface Problem {
  /** A URI identifying the problem; it maps one to one onto `code`. */
  type?: string;
  /** The fixed summary for `code`. */
  title?: string;
  /** The response status. */
  status?: number;
  /** Human text about this occurrence. Its wording may change at any time. */
  detail?: string;
  /** The error code. Branch on it. */
  code?: ErrorCode;
  /** The request's id, to quote when reporting the problem. */
  request_id?: string;
  /** Every problem found. Present only with `validation_failed`. */
  errors?: FieldError[];
}
