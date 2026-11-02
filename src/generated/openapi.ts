// Generated from the API's OpenAPI document by scripts/generate.mjs.
// Never edit this file by hand: change the document or the script, and
// regenerate.

import type { Decimal } from "../decimal.js";
export interface paths {
  "/healthz": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Check liveness */
    get: operations["getHealth"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    /**
     * Check liveness, headers only
     * @description The same check as `GET /healthz`, answered with the same status and headers and no body, for an uptime monitor that reads only the status. A `200` carries the `Content-Length` of the `GET`; an error carries no `Content-Length`. Takes no credential.
     */
    head: operations["headHealth"];
    patch?: never;
    trace?: never;
  };
  "/errors/{code}": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Open a problem type's documentation
     * @description A problem document's `type` is this URI. It redirects to the code's page on the documentation site, so a browser that opens a `type` lands on that page. Keep the `type` as the problem type's identifier, not the page it redirects to: the page may move. A path segment that is not exactly a request-level error code, as a problem document's `code` spells it, is `404` `not_found`. This includes another case or a percent-encoded character. Takes no credential.
     */
    get: operations["getProblemType"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    /**
     * Check a problem type's redirect, headers only
     * @description The same redirect as `GET /errors/{code}`, answered with the same status and headers and no body, for a link checker that follows a problem document's `type`. Unlike the `GET`, no response carries `Content-Length`. A path segment that is not exactly a request-level error code is `404`, as on `GET`. Takes no credential.
     */
    head: operations["headProblemType"];
    patch?: never;
    trace?: never;
  };
  "/report": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Read a shared report
     * @description Read with the share token in `Authorization: Report <token>`, never in the URL, so it stays out of proxy logs and `Referer`. Every failure, a missing, unknown or revoked token included, is one indistinguishable `404`. Each read stamps the report's view times.
     */
    get: operations["getSharedReport"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/events": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Ingest a batch of events
     * @description Stores 1 to 500 canonical events. A problem with one event rejects that event only; the response lists the problems of each rejected row, one `errors` entry per problem, within the limits `IngestResult` states. The batch is complete when the response is sent. Deduplication is per event, by `event_id` or the content hash, so a retried batch reports its stored rows as `duplicates`. This operation ignores `Idempotency-Key`. API keys only: a session is refused with `401`.
     */
    post: operations["ingestEvents"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/imports/preview": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Preview a CSV import
     * @description Parses, maps and validates a file exactly as `POST /v1/imports` would, and writes nothing.
     */
    post: operations["previewImport"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/imports": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Import a CSV file
     * @description Stores the valid rows of a file and records an import batch. A problem with one row rejects that row only. The response lists the problems of the rejected rows, one `errors` entry per problem, up to the first 1,000; `errors_truncated` says when more were omitted, and the counts always cover the whole file. Events deduplicate as on `POST /v1/events`. `Idempotency-Key` protects the import batch record that each commit creates.
     */
    post: operations["commitImport"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/clients": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** List clients */
    get: operations["listClients"];
    put?: never;
    /** Create a client */
    post: operations["createClient"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/clients/{id}": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Read a client */
    get: operations["getClient"];
    put?: never;
    post?: never;
    /**
     * Delete a client
     * @description Refused while events carry the client's key, or while the client has a validated or published calculation; set its status to `churned` instead.
     */
    delete: operations["deleteClient"];
    options?: never;
    head?: never;
    /** Update a client */
    patch: operations["updateClient"];
    trace?: never;
  };
  "/v1/clients/{id}/agents": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    /**
     * Replace a client's assigned agents
     * @description Assignment decides how later events are attributed. An event without `client_key` from an agent assigned to exactly one client is attributed to that client. A `model` or `outcome` event from an agent assigned to two or more clients must carry `client_key`, or it is refused with `client_key_required`.
     */
    put: operations["setClientAgents"];
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/clients/{id}/value-model": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Read a client's active value model */
    get: operations["getClientValueModel"];
    put?: never;
    /** Create a client's value model */
    post: operations["createValueModel"];
    /** Delete a client's active value model */
    delete: operations["deleteValueModel"];
    options?: never;
    head?: never;
    /** Update a client's active value model */
    patch: operations["updateValueModel"];
    trace?: never;
  };
  "/v1/clients/{id}/value-model/line-items": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    /**
     * Replace a value model's line items
     * @description Replaces the whole set, guarded by `version`: a stale version is refused rather than overwriting a co-editor's change.
     */
    put: operations["setValueModelLineItems"];
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/clients/{id}/outcome-types": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** List a client's outcome types */
    get: operations["listClientOutcomeTypes"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/clients/{id}/value": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Compute a client's value */
    get: operations["getClientValue"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/clients/{id}/cost": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Compute a client's cost
     * @description Computes the client's cost over a period. Both bounds are required: standing charges are prorated day by day, so an open `from` would prorate each charge from its own start date, however long ago.
     */
    get: operations["getClientCost"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/clients/{id}/roi": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Compute a client's ROI */
    get: operations["getClientRoi"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/clients/{id}/events": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * List the events behind a client's totals
     * @description The event drill-down. Pass `page` or `cursor`, not both; neither means page 1. `page` beyond the end returns no rows and the true `total`.
     */
    get: operations["listClientEvents"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/clients/{id}/calculations": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** List a client's calculations */
    get: operations["listClientCalculations"];
    put?: never;
    /**
     * Freeze a client's ROI for a period
     * @description Computes the client's ROI for an ended period and freezes it as a draft calculation. The `write` scope may create a draft; validating and publishing it are session-only.
     */
    post: operations["createCalculation"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/clients/{id}/anomalies": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Flag anomalies in a client's period */
    get: operations["getClientAnomalies"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/agents": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** List agents */
    get: operations["listAgents"];
    put?: never;
    /** Create an agent */
    post: operations["createAgent"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/agents/{id}": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Read an agent
     * @description `from` and `to` bound the statistics only. Absent bounds mean all time.
     */
    get: operations["getAgent"];
    put?: never;
    post?: never;
    /**
     * Delete an agent
     * @description Refused while events reference the agent; set its status to `retired` instead.
     */
    delete: operations["deleteAgent"];
    options?: never;
    head?: never;
    /** Update an agent */
    patch: operations["updateAgent"];
    trace?: never;
  };
  "/v1/value-models": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** List value models */
    get: operations["listValueModels"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/value-models/{id}": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Read a value model
     * @description Any model in the workspace, archived ones included.
     */
    get: operations["getValueModel"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/outcome-types": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** List the workspace's outcome types */
    get: operations["listOutcomeTypes"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/value-templates": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** List value templates */
    get: operations["listValueTemplates"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/cost-line-items": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** List cost line items */
    get: operations["listCostLineItems"];
    put?: never;
    /** Create a cost line item */
    post: operations["createCostLineItem"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/cost-line-items/{id}": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Read a cost line item */
    get: operations["getCostLineItem"];
    put?: never;
    post?: never;
    /** Delete a cost line item */
    delete: operations["deleteCostLineItem"];
    options?: never;
    head?: never;
    /** Update a cost line item */
    patch: operations["updateCostLineItem"];
    trace?: never;
  };
  "/v1/price-table": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Read the price table */
    get: operations["getPriceTable"];
    /** Replace the price table */
    put: operations["setPriceTable"];
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/calculations/{id}": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Read a calculation */
    get: operations["getCalculation"];
    put?: never;
    post?: never;
    /** Delete a draft calculation */
    delete: operations["deleteCalculation"];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/calculations/{id}/validate": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Validate a calculation
     * @description Records the validation checklist, an attestation that the figures were reviewed, and moves a draft to `validated`. Session-only: validation is a human attestation, so no API key can perform it.
     */
    post: operations["validateCalculation"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/calculations/{id}/publish": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Publish a calculation
     * @description Moves a validated calculation to `published`. Publication is terminal. Session-only: publishing is a human trust step, so no API key can perform it. Takes no request body: any non-empty body, `{}` included and whatever its media type, is refused with `400` `validation_failed`, one error coded `unknown_field` at pointer `""`.
     */
    post: operations["publishCalculation"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/calculations/{id}/reopen": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Reopen a calculation
     * @description Moves a validated calculation back to `draft`, clearing its attestation. Session-only: it undoes a human trust step, so no API key can perform it. Takes no request body: any non-empty body, `{}` included and whatever its media type, is refused with `400` `validation_failed`, one error coded `unknown_field` at pointer `""`.
     */
    post: operations["reopenCalculation"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/calculations/{id}/reports": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** List a calculation's reports */
    get: operations["listCalculationReports"];
    put?: never;
    /**
     * Compose a report on a calculation
     * @description Creates a report on a published calculation, with its disclosures taken from the calculation's coverage. Takes no request body: any non-empty body, `{}` included and whatever its media type, is refused with `400` `validation_failed`, one error coded `unknown_field` at pointer `""`.
     */
    post: operations["createReport"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/reports/{id}": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Read a report */
    get: operations["getReport"];
    put?: never;
    post?: never;
    /**
     * Delete an unshared report
     * @description A shared report cannot be deleted; revoke its link instead.
     */
    delete: operations["deleteReport"];
    options?: never;
    head?: never;
    /** Edit a report */
    patch: operations["updateReport"];
    trace?: never;
  };
  "/v1/reports/{id}/share": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Share a report
     * @description Mints the share token and seals the report against edits. Session-only: sharing is a human trust step, so no API key can perform it. Takes no request body: any non-empty body, `{}` included and whatever its media type, is refused with `400` `validation_failed`, one error coded `unknown_field` at pointer `""`.
     */
    post: operations["shareReport"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/reports/{id}/revoke": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Revoke a report's link
     * @description Stops the share token working. Session-only: it undoes a human trust step, so no API key can perform it. Takes no request body: any non-empty body, `{}` included and whatever its media type, is refused with `400` `validation_failed`, one error coded `unknown_field` at pointer `""`.
     */
    post: operations["revokeReport"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/dashboard": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Read the workspace's month */
    get: operations["getDashboard"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/dashboard/renewals": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * List renewal readiness
     * @description Reads each client's latest published figures, whatever month the dashboard shows.
     */
    get: operations["listRenewals"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/api-keys": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** List API keys */
    get: operations["listApiKeys"];
    put?: never;
    /**
     * Create an API key
     * @description Returns the complete token once; it is never shown again and is stored only as a hash. This operation does not take `Idempotency-Key`: a retried create makes a second key, which the owner can revoke. Session-only: an API key cannot create a key.
     */
    post: operations["createApiKey"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/api-keys/{id}": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Read an API key */
    get: operations["getApiKey"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/v1/api-keys/{id}/revoke": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Revoke an API key
     * @description The next request bearing the key is refused with `401`. Takes no request body: any non-empty body, `{}` included and whatever its media type, is refused with `400` `validation_failed`, one error coded `unknown_field` at pointer `""`.
     */
    post: operations["revokeApiKey"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
}
export type webhooks = Record<string, never>;
export interface components {
  schemas: {
    /**
     * Format: uuid
     * @description A resource id: a UUID in lowercase canonical form (RFC 9562). Clients treat it as opaque.
     * @example 6f1c2d3e-4b5a-4c6d-8e7f-90a1b2c3d4e5
     */
    Uuid: string;
    /**
     * Format: uuid
     * @description An id a request sends: the RFC 9562 §4 string form, `8-4-4-4-12` hexadecimal digits in either case, as RFC 9562 allows. Any other spelling is malformed. The server returns every id in lowercase (`Uuid`).
     * @example 6f1c2d3e-4b5a-4c6d-8e7f-90a1b2c3d4e5
     */
    UuidInput: string;
    /**
     * Format: date-time
     * @description An instant, RFC 3339 `date-time`. Responses give it in UTC with `Z`, with fractional seconds only when non-zero, up to six digits and no trailing zeros. A stored calculation snapshot is served as it was stored, so instants inside a `snapshot` may carry the offset they were written with.
     * @example 2026-08-01T09:30:00Z
     */
    Instant: string;
    /**
     * Format: date-time
     * @description An instant, RFC 3339 `date-time` with an offset: `Z` or `±hh:mm`. A value without an offset is refused with `invalid_format`. Storage keeps at most microsecond precision.
     * @example 2026-08-01T09:30:00+09:00
     */
    InstantInput: string | Date;
    /**
     * Format: date
     * @description A calendar date, RFC 3339 `full-date` (`YYYY-MM-DD`), a UTC day.
     * @example 2026-12-31
     */
    Date: string;
    /**
     * Format: date
     * @description A calendar date, RFC 3339 `full-date` (`YYYY-MM-DD`), between `1900-01-01` and `9999-12-31`. Not trimmed: a date with white space at either end, or white space only, is refused with `invalid_format`.
     * @example 2026-12-31
     */
    DateInput: string;
    /**
     * @description A calendar month, `YYYY-MM`: the UTC range from the first instant of the month to the first instant of the next.
     * @example 2026-08
     */
    Month: string;
    /**
     * @description An ISO 4217 alphabetic currency code, upper case.
     * @example JPY
     */
    Currency: string;
    /**
     * @description The number of decimal places the money figures beside it were rounded to: the ISO 4217 exponent of `currency`.
     * @example 0
     */
    MinorUnits: number;
    /** @description A money amount: a JSON number in major units, in the `currency` of the object carrying it or of an enclosing object. ¥1,200 is `1200` and $12.50 is `12.5`. Computed figures are rounded to the currency's minor unit. Clients must not recompute a total from its lines. SDKs expose money as an exact decimal type. A figure of up to 15 significant digits is written as its exact decimal; an equality between amounts stated in this API holds for such figures. */
    Money: Decimal;
    /** @description A ratio as a fraction, not a percentage: `0.25` means 25%. */
    Ratio: number;
    /** @description A half-open range of instants, `[from, to)`. An unbounded side is `null`. */
    Period: {
      from: components["schemas"]["Instant"] | null;
      to: components["schemas"]["Instant"] | null;
    };
    /** @description A half-open range of instants, `[from, to)`. Both sides are required. */
    PeriodInput: {
      from: components["schemas"]["InstantInput"];
      to: components["schemas"]["InstantInput"];
    };
    /**
     * @description A client's lifecycle status.
     * @enum {string}
     */
    ClientStatus: "active" | "churned" | "prospect";
    /**
     * @description An agent's lifecycle status.
     * @enum {string}
     */
    AgentStatus: "active" | "paused" | "retired";
    /**
     * @description A value model's status. At most one model per client is `active`.
     * @enum {string}
     */
    ValueModelStatus: "active" | "archived";
    /**
     * @description An event category.
     * @enum {string}
     */
    EventCategory: "session" | "task" | "model" | "outcome" | "exception";
    /**
     * @description A calculation's position in its lifecycle: `draft` → `validated` → `published`; `validated` → `draft` on reopen. Publication is terminal.
     * @enum {string}
     */
    CalculationState: "draft" | "validated" | "published";
    /**
     * @description An API key scope. Scopes are independent: `write` grants neither `read` nor `ingest`.
     * @enum {string}
     */
    Scope: "ingest" | "read" | "write";
    /**
     * @description What a cost line item is charged to.
     * @enum {string}
     */
    CostTargetKind: "client" | "agent";
    /**
     * @description How an event arrived: `api` for `POST /v1/events`, `csv` for a CSV import.
     * @enum {string}
     */
    EventSource: "api" | "csv";
    /**
     * @description Why the ratios are `null`. `no_value_model`: the client has no active value model. `zero_cost`: operating cost is zero or negative, so neither ratio has a denominator. `no_counted_clients` (dashboard only): no client is counted in the month's totals.
     * @enum {string}
     */
    UndefinedReason: "no_value_model" | "zero_cost" | "no_counted_clients";
    /**
     * @description A coverage finding on a report. Each kind appears at most once per report. `facts` per kind: `empty` `{}`; `unpriced` `{outcome_types: [{outcome_type, quantity}], outcome_types_omitted}`, at most 100 outcome types by quantity, largest first, with `outcome_types_omitted` counting the rest, which a report composed before the count existed lacks; `key_unset` `{}`; `unmatched` `{keys}`; `unattributable` `{events}`; `precedes` `{}`; `unpriceable` `{models}`; `uncosted` `{events}`; `token_valued` `{events}`; `unattributed` `{line_items}`; `partial` `{line_items}`; `truncated` `{prorated_through}`.
     * @enum {string}
     */
    DisclosureKind:
      | "empty"
      | "unpriced"
      | "key_unset"
      | "unmatched"
      | "unattributable"
      | "precedes"
      | "unpriceable"
      | "uncosted"
      | "token_valued"
      | "unattributed"
      | "partial"
      | "truncated";
    /**
     * @description Why a client is not counted in the dashboard totals. `not_published_this_period`: it has published, but not for this month. `never_published`: no published calculation for any period. `published_off_grid`: a published calculation overlaps the month without equalling it. `no_value_model` and `zero_cost`: the published figure has no ratio.
     * @enum {string}
     */
    PortfolioExclusionReason:
      | "not_published_this_period"
      | "never_published"
      | "published_off_grid"
      | "no_value_model"
      | "zero_cost";
    /**
     * @description Which way a client's return moved against its own abutting prior published period, compared at one decimal place of percentage points.
     * @enum {string}
     */
    HealthDirection: "improving" | "steady" | "declining";
    /**
     * @description Why a renewal row has no health signal. `never_published`: no published calculation. `no_prior_period`: nothing published abuts the latest period. `ratio_undefined`: a ratio on either side is undefined.
     * @enum {string}
     */
    HealthUnavailable:
      | "never_published"
      | "no_prior_period"
      | "ratio_undefined";
    /** @description The request-level error catalogue. Each code is sent with exactly one status, given as `x-status`, and has a fixed `title`. Clients branch on `code`, and fall back on the HTTP status for a code they do not recognise: new codes are additive. Once `/v1` is declared stable, a code is never renamed or repurposed. */
    ErrorCode:
      | "invalid_json"
      | "validation_failed"
      | "unauthenticated"
      | "insufficient_scope"
      | "session_required"
      | "account_not_provisioned"
      | "not_found"
      | "no_active_value_model"
      | "method_not_allowed"
      | "idempotency_key_in_use"
      | "client_key_in_use"
      | "agent_key_in_use"
      | "client_has_events"
      | "client_has_calculations"
      | "agent_has_events"
      | "client_key_has_events"
      | "value_model_exists"
      | "value_model_version_stale"
      | "calculation_transition_invalid"
      | "calculation_not_draft"
      | "calculation_not_published"
      | "report_shared"
      | "report_not_shared"
      | "api_key_revoked"
      | "payload_too_large"
      | "uri_too_long"
      | "unsupported_media_type"
      | "idempotency_key_reused"
      | "rate_limited"
      | "internal_error";
    /** @description The field-level code of one `errors` entry, or of an ingest or CSV row error. The vocabulary is open: new codes are additive. */
    FieldErrorCode:
      | "required"
      | "unknown_field"
      | "immutable"
      | "invalid_type"
      | "invalid_format"
      | "invalid_value"
      | "too_long"
      | "too_many"
      | "out_of_range"
      | "too_precise"
      | "duplicate"
      | "too_large"
      | "mutually_exclusive"
      | "unknown_reference"
      | "client_key_required"
      | "currency_mismatch";
    /** @description One problem in a request. It carries exactly one primary locator: `pointer` for the JSON body, `parameter` for a query parameter, `header` for a request header, or `part` for a part of a `multipart/form-data` body. Only `part` takes a sub-locator: `pointer` into a JSON part, or `column` naming a column of a CSV part, at most one of the two. A `pointer` beside `part` is relative to that part, never to the request. A problem with the part as a whole, such as a missing or misordered part, carries `part` alone. */
    FieldError:
      | {
          code: components["schemas"]["FieldErrorCode"] | (string & {});
          /**
           * @description An RFC 6901 JSON Pointer into the request body, in its plain string form. The whole body is `""`.
           * @example /name
           */
          pointer: string;
          /** @description Human text. Its wording may change at any time. */
          detail: string;
        }
      | {
          code: components["schemas"]["FieldErrorCode"] | (string & {});
          /**
           * @description The query parameter, by name.
           * @example limit
           */
          parameter: string;
          /** @description Human text. Its wording may change at any time. */
          detail: string;
        }
      | {
          code: components["schemas"]["FieldErrorCode"] | (string & {});
          /**
           * @description The request header, by name.
           * @example Idempotency-Key
           */
          header: string;
          /** @description Human text. Its wording may change at any time. */
          detail: string;
        }
      | {
          code: components["schemas"]["FieldErrorCode"] | (string & {});
          /**
           * @description The multipart part, by its form field name.
           * @example mapping
           */
          part: string;
          /**
           * @description An RFC 6901 JSON Pointer into the part named by `part`, in its plain string form, when that part is JSON. The whole part is `""`. Absent when `column` is present or the problem is with the part as a whole.
           * @example /columns/client_key
           */
          pointer?: string;
          /**
           * @description A column of the CSV part named by `part`, by its header name. Absent when `pointer` is present or the problem is with the part as a whole.
           * @example amount
           */
          column?: string;
          /** @description Human text. Its wording may change at any time. */
          detail: string;
        };
    /** @description An RFC 9457 problem document, sent as `application/problem+json` with every error status. `errors` is present exactly when `code` is `validation_failed`. */
    Problem: {
      /**
       * Format: uri
       * @description `info.x-problem-type-base` followed by `code`. Generic RFC 9457 clients identify the problem by it; it maps one to one onto `code`.
       */
      type: string;
      /** @description The fixed summary for `code`. */
      title: string;
      /** @description The response status. */
      status: number;
      /** @description Human text about this occurrence. Its wording may change at any time. For a `500` it reveals nothing internal. */
      detail: string;
      code: components["schemas"]["ErrorCode"] | (string & {});
      /** @description The value of the `X-Request-Id` response header, to quote when reporting the problem. */
      request_id: string;
      /** @description Every problem found, not only the first. Present only with `validation_failed`. */
      errors?: components["schemas"]["FieldError"][];
    };
    /** @description A client: the roster record value is delivered to. */
    Client: {
      id: components["schemas"]["Uuid"];
      /** @description Free text, at most 200 characters. */
      name: string;
      status: components["schemas"]["ClientStatus"] | (string & {});
      client_key: string | null;
      renewal_date: components["schemas"]["Date"] | null;
      /** @description Free text, `""` when empty. */
      notes: string;
      created_at: components["schemas"]["Instant"];
    };
    /** @description An agent assigned to a client. */
    AssignedAgent: {
      id: components["schemas"]["Uuid"];
      agent_key: string;
      name: string;
      status: components["schemas"]["AgentStatus"] | (string & {});
    };
    /** @description A client with its assigned agents, as the single read returns it. */
    ClientDetail: components["schemas"]["Client"] & {
      /** @description The assigned agents, ordered by name, case-insensitively. */
      agents: components["schemas"]["AssignedAgent"][];
      earliest_activity_at: components["schemas"]["Instant"] | null;
    };
    ClientCreate: {
      /** @description Free text, trimmed of white space (the Unicode `White_Space` property) at both ends. The trimmed name is stored. It holds 1 to 200 characters, counted in Unicode code points after trimming: blank after trimming is `required`, and longer than 200 characters after trimming is `too_long`. U+0000 is `invalid_format`, as in every request string. No JSON Schema keyword measures a length after trimming, so the schema states no `maxLength`; a `maxLength` of 200 would refuse a padded name the server accepts. */
      name: string;
      status: components["schemas"]["ClientStatus"];
      client_key?: string | null;
      renewal_date?: components["schemas"]["DateInput"] | null;
      notes?: string | null;
    };
    /** @description A JSON Merge Patch (RFC 7396): an absent member is unchanged, `null` clears a member. The merged client is validated whole. */
    ClientPatch: {
      /** @description Free text, trimmed of white space (the Unicode `White_Space` property) at both ends. The trimmed name is stored. It holds 1 to 200 characters, counted in Unicode code points after trimming: blank after trimming is `required`, and longer than 200 characters after trimming is `too_long`. U+0000 is `invalid_format`, as in every request string. No JSON Schema keyword measures a length after trimming, so the schema states no `maxLength`; a `maxLength` of 200 would refuse a padded name the server accepts. */
      name?: string;
      status?: components["schemas"]["ClientStatus"];
      client_key?: string | null;
      renewal_date?: components["schemas"]["DateInput"] | null;
      notes?: string | null;
    };
    ClientAgentsSet: {
      /** @description The complete set of assigned agents, at most 200. `[]` clears it. An id naming no agent in the workspace is refused with `unknown_reference`. A longer array is refused at its 201st element with one `too_many` at `/agent_ids`. */
      agent_ids: components["schemas"]["UuidInput"][];
    };
    ClientAgents: {
      /** @description The stored set, ordered by name, case-insensitively. */
      agents: components["schemas"]["AssignedAgent"][];
    };
    /** @description An agent: a registry entry for something that delivers value. Ingest creates agents it has not seen. */
    Agent: {
      id: components["schemas"]["Uuid"];
      /** @description The external identity events carry. Immutable through this API. */
      agent_key: string;
      /** @description Free text. */
      name: string;
      /** @description Free text, `""` when empty. */
      framework: string;
      /** @description Free text, `""` when empty. */
      version: string;
      status: components["schemas"]["AgentStatus"] | (string & {});
      created_at: components["schemas"]["Instant"];
    };
    /** @description An agent as the list returns it. */
    AgentListItem: components["schemas"]["Agent"] & {
      /** @description How many clients the agent is assigned to. */
      client_count: number;
    };
    /** @description The agent's activity over the `from`/`to` range of the request, or all time. */
    AgentStats: {
      /** @description Events from this agent in the requested range. */
      events: number;
      /** @description The sum of event `cost` in the requested range, rounded to `minor_units`. */
      cost_total: components["schemas"]["Money"];
      currency: components["schemas"]["Currency"];
      /** @description The scale `cost_total` is rounded to. */
      minor_units: components["schemas"]["MinorUnits"];
    };
    /** @description An agent with its assigned clients and statistics, as the single read returns it. */
    AgentDetail: components["schemas"]["Agent"] & {
      /** @description The clients the agent is assigned to, ordered by name, case-insensitively, then by id. At most 1,000: `clients_omitted` counts the rest. */
      clients: {
        id: components["schemas"]["Uuid"];
        name: string;
        status: components["schemas"]["ClientStatus"] | (string & {});
      }[];
      /** @description How many clients `clients` leaves out, `0` when it lists every one. */
      clients_omitted: number;
      stats: components["schemas"]["AgentStats"];
    };
    AgentCreate: {
      /** @description 1 to 200 characters, counted as sent. Not trimmed: a key with white space (the Unicode `White_Space` property) at either end, or white space only, is refused with `invalid_format`. Unique in the workspace. Cannot change later. */
      agent_key: string;
      /** @description Free text, trimmed of white space (the Unicode `White_Space` property) at both ends. The trimmed name is stored. It holds 1 to 200 characters, counted in Unicode code points after trimming: blank after trimming is `required`, and longer than 200 characters after trimming is `too_long`. U+0000 is `invalid_format`, as in every request string. No JSON Schema keyword measures a length after trimming, so the schema states no `maxLength`; a `maxLength` of 200 would refuse a padded name the server accepts. */
      name: string;
      framework?: string | null;
      version?: string | null;
      status: components["schemas"]["AgentStatus"];
    };
    /** @description A JSON Merge Patch (RFC 7396). `agent_key` is refused with the field code `immutable`, not `unknown_field`: it exists, and this operation cannot change it. */
    AgentPatch: {
      /** @description Free text, trimmed of white space (the Unicode `White_Space` property) at both ends. The trimmed name is stored. It holds 1 to 200 characters, counted in Unicode code points after trimming: blank after trimming is `required`, and longer than 200 characters after trimming is `too_long`. U+0000 is `invalid_format`, as in every request string. No JSON Schema keyword measures a length after trimming, so the schema states no `maxLength`; a `maxLength` of 200 would refuse a padded name the server accepts. */
      name?: string;
      framework?: string | null;
      version?: string | null;
      status?: components["schemas"]["AgentStatus"];
    };
    /** @description One outcome type priced by a value model. */
    ValueLineItem: {
      id: components["schemas"]["Uuid"];
      /** @description The outcome type this line prices. Matched against events case-insensitively, after trimming. */
      outcome_type: string;
      /** @description Free text. */
      label: string;
      /** @description The value of one unit of the outcome, at most 4 decimal places. */
      unit_value: components["schemas"]["Money"];
      /** @description How the unit value was agreed. Free text, `""` when empty. */
      provenance_note: string;
      /** @description Display order, from 0. */
      position: number;
    };
    /** @description A value model: how one client's outcomes are priced. */
    ValueModel: {
      id: components["schemas"]["Uuid"];
      client_id: components["schemas"]["Uuid"];
      /** @description Free text. */
      name: string;
      status: components["schemas"]["ValueModelStatus"] | (string & {});
      /** @description The optimistic-concurrency version. Replacing the line items requires the current value. */
      version: number;
      currency: components["schemas"]["Currency"];
      created_at: components["schemas"]["Instant"];
      updated_at: components["schemas"]["Instant"];
      /** @description At most 50, ordered by `position`. */
      line_items: components["schemas"]["ValueLineItem"][];
    };
    /** @description A value model as the list returns it. */
    ValueModelSummary: {
      id: components["schemas"]["Uuid"];
      client_id: components["schemas"]["Uuid"];
      client_name: string;
      name: string;
      status: components["schemas"]["ValueModelStatus"] | (string & {});
      version: number;
      /** @description How many line items the model has. */
      line_items: number;
      created_at: components["schemas"]["Instant"];
      updated_at: components["schemas"]["Instant"];
    };
    /** @description Creates the client's active model. `template_id` and `copy_from_model_id` are create-only and are not echoed. Setting both is refused with `mutually_exclusive` at `/copy_from_model_id`. With neither, the model starts with no line items. */
    ValueModelCreate: {
      /** @description Free text, trimmed of white space (the Unicode `White_Space` property) at both ends. The trimmed name is stored. It holds 1 to 200 characters, counted in Unicode code points after trimming: blank after trimming is `required`, and longer than 200 characters after trimming is `too_long`. U+0000 is `invalid_format`, as in every request string. No JSON Schema keyword measures a length after trimming, so the schema states no `maxLength`; a `maxLength` of 200 would refuse a padded name the server accepts. */
      name: string;
      template_id?: string | null;
      copy_from_model_id?: components["schemas"]["UuidInput"] | null;
    };
    /** @description A JSON Merge Patch (RFC 7396) of the client's active model. Setting `status` to `archived` frees the client for a new active model. */
    ValueModelPatch: {
      /** @description Free text, trimmed of white space (the Unicode `White_Space` property) at both ends. The trimmed name is stored. It holds 1 to 200 characters, counted in Unicode code points after trimming: blank after trimming is `required`, and longer than 200 characters after trimming is `too_long`. U+0000 is `invalid_format`, as in every request string. No JSON Schema keyword measures a length after trimming, so the schema states no `maxLength`; a `maxLength` of 200 would refuse a padded name the server accepts. */
      name?: string;
      status?: components["schemas"]["ValueModelStatus"];
    };
    ValueLineItemInput: {
      /** @description 1 to 200 characters, counted as sent. Not trimmed: a value with white space (the Unicode `White_Space` property) at either end, or white space only, is refused with `invalid_format`. Unique within the set, case-insensitively. */
      outcome_type: string;
      /** @description Free text, trimmed of white space (the Unicode `White_Space` property) at both ends. The trimmed label is stored. It holds 1 to 200 characters, counted in Unicode code points after trimming: blank after trimming is `required`, and longer than 200 characters after trimming is `too_long`. U+0000 is `invalid_format`, as in every request string. No JSON Schema keyword measures a length after trimming, so the schema states no `maxLength`; a `maxLength` of 200 would refuse a padded label the server accepts. */
      label: string;
      /** @description At least 0 and below 100,000,000, with at most 4 decimal places; more is refused with `too_precise`, never rounded. Absent means 0, because templates ship every unit value as 0 on purpose. */
      unit_value?: components["schemas"]["Money"];
      provenance_note?: string | null;
    };
    ValueLineItemsSet: {
      /** @description The `version` of the model the caller read. A different stored version is refused with `value_model_version_stale`. A value of 0 or less is `out_of_range`; an absent or `null` one is `required`. */
      version: number;
      /** @description The complete set, at most 50. `[]` empties it. Stored `position` follows this order. */
      line_items: components["schemas"]["ValueLineItemInput"][];
    };
    ValueTemplateLineItem: {
      outcome_type: string;
      label: string;
      /** @description Always 0: a template supplies structure, never a number. */
      unit_value: components["schemas"]["Money"];
      provenance_note: string;
    };
    /** @description A built-in starting point for a value model. */
    ValueTemplate: {
      /**
       * @description A stable slug.
       * @example support-automation
       */
      id: string;
      name: string;
      description: string;
      /** @description In display order. */
      line_items: components["schemas"]["ValueTemplateLineItem"][];
    };
    /** @description An outcome type seen in events, with its volume. */
    OutcomeTypeUsage: {
      /** @description As events carry it. */
      outcome_type: string;
      events: number;
      /** @description The summed event quantity. */
      quantity: number;
      priced: boolean | null;
    };
    /** @description What a cost line item is charged to: a client or an agent. */
    CostTarget: {
      kind: components["schemas"]["CostTargetKind"] | (string & {});
      id: components["schemas"]["Uuid"];
      /** @description The target's display name. */
      name: string;
    };
    /** @description The writable part of `target`. `name` is read-only. */
    CostTargetInput: {
      kind: components["schemas"]["CostTargetKind"];
      /** @description An id naming no client or agent in the workspace is refused with `unknown_reference`. */
      id: components["schemas"]["UuidInput"];
    };
    /** @description A standing monthly charge the event stream never sees. Its dates include both ends. */
    CostLineItem: {
      id: components["schemas"]["Uuid"];
      /** @description Free text. */
      label: string;
      target: components["schemas"]["CostTarget"];
      monthly_amount: components["schemas"]["Money"];
      currency: components["schemas"]["Currency"];
      start_date: components["schemas"]["Date"];
      end_date: components["schemas"]["Date"] | null;
      created_at: components["schemas"]["Instant"];
      updated_at: components["schemas"]["Instant"];
    };
    CostLineItemCreate: {
      /** @description Free text, trimmed of white space (the Unicode `White_Space` property) at both ends. The trimmed label is stored. It holds 1 to 200 characters, counted in Unicode code points after trimming: blank after trimming is `required`, and longer than 200 characters after trimming is `too_long`. U+0000 is `invalid_format`, as in every request string. No JSON Schema keyword measures a length after trimming, so the schema states no `maxLength`; a `maxLength` of 200 would refuse a padded label the server accepts. */
      label: string;
      target: components["schemas"]["CostTargetInput"];
      /** @description In the workspace currency. At least 0 and below 100,000,000, with at most 4 decimal places; more is refused with `too_precise`. Required: absent or `null` is refused with `required`, and `0` must be sent explicitly. */
      monthly_amount: components["schemas"]["Money"];
      start_date: components["schemas"]["DateInput"];
      end_date?: components["schemas"]["DateInput"] | null;
    };
    /** @description A JSON Merge Patch (RFC 7396). The merged line item is validated whole. */
    CostLineItemPatch: {
      /** @description Free text, trimmed of white space (the Unicode `White_Space` property) at both ends. The trimmed label is stored. It holds 1 to 200 characters, counted in Unicode code points after trimming: blank after trimming is `required`, and longer than 200 characters after trimming is `too_long`. U+0000 is `invalid_format`, as in every request string. No JSON Schema keyword measures a length after trimming, so the schema states no `maxLength`; a `maxLength` of 200 would refuse a padded label the server accepts. */
      label?: string;
      target?: components["schemas"]["CostTargetInput"];
      /** @description In the workspace currency. At least 0 and below 100,000,000, with at most 4 decimal places; more is refused with `too_precise`. */
      monthly_amount?: components["schemas"]["Money"];
      start_date?: components["schemas"]["DateInput"];
      end_date?: components["schemas"]["DateInput"] | null;
    };
    /** @description One model's token prices. */
    ModelRate: {
      /** @description The model name events carry in `model`. Matched case-insensitively, after trimming. */
      model: string;
      /** @description The price of 1,000 input tokens, with at most 9 decimal places. */
      input_per_1k: components["schemas"]["Money"];
      /** @description The price of 1,000 output tokens, with at most 9 decimal places. */
      output_per_1k: components["schemas"]["Money"];
    };
    /** @description The workspace's token prices for valuing model events that carry tokens and no cost. */
    PriceTable: {
      currency: components["schemas"]["Currency"];
      /** @description At most 200. Ascending by `model`, compared case-insensitively. */
      models: components["schemas"]["ModelRate"][];
    };
    ModelRateInput: {
      /** @description 1 to 200 characters. A name blank after trimming is refused with `required`, and one holding U+0000 with `invalid_format`. Unique within the table after trimming and lower-casing: a name equal to an earlier entry's is refused with `duplicate` at the later entry. Stored as sent. */
      model: string;
      /** @description The price of 1,000 input tokens. At least 0 and below 100,000,000, with at most 9 decimal places; more is refused with `too_precise`, never rounded. A rate is not money: $0.000001 per million tokens is 0.000000001 per 1,000. Money computed from a rate keeps 6 decimal places, as an event's `cost` does. */
      input_per_1k: components["schemas"]["Money"];
      /** @description The price of 1,000 output tokens. At least 0 and below 100,000,000, with at most 9 decimal places; more is refused with `too_precise`, never rounded. A rate is not money: $0.000001 per million tokens is 0.000000001 per 1,000. Money computed from a rate keeps 6 decimal places, as an event's `cost` does. */
      output_per_1k: components["schemas"]["Money"];
    };
    PriceTableSet: {
      /** @description Optional, so a caller can `PUT` back the table it read. It cannot change the currency: when sent it must equal the workspace currency, or the request is refused with `400` `validation_failed` and the field code `currency_mismatch` at `/currency`. */
      currency?: components["schemas"]["Currency"];
      /** @description The complete table, at most 200. `[]` empties it. A longer array is refused at its 201st entry with one `too_many` at `/models`, before any entry is validated. */
      models: components["schemas"]["ModelRateInput"][];
    };
    /** @description The two return ratios. Both are `null` together, exactly when `undefined_reason` is set. */
    Ratios: {
      roi: components["schemas"]["Ratio"] | null;
      value_to_cost: components["schemas"]["Ratio"] | null;
      undefined_reason:
        | (components["schemas"]["UndefinedReason"] | (string & {}))
        | null;
    };
    /** @description The value model a figure was computed with. */
    ValueModelRef: {
      id: components["schemas"]["Uuid"];
      name: string;
      version: number;
    };
    /** @description One priced outcome type in a value computation. */
    ValueLine: {
      outcome_type: string;
      label: string;
      unit_value: components["schemas"]["Money"];
      events: number;
      quantity: number;
      total: components["schemas"]["Money"];
      provenance_note: string;
    };
    /** @description Every way value could be missing from the total. */
    ValueCoverage: {
      /** @description Outcome types attributed to the client that no line item prices, by quantity, largest first, then by outcome type compared by Unicode code point. At most 100: `unpriced_outcome_types_omitted` counts the rest. */
      unpriced_outcome_types: components["schemas"]["OutcomeTypeUsage"][];
      /** @description How many unpriced outcome types `unpriced_outcome_types` leaves out, `0` when it lists every one. The totals and counts in the response cover every one. */
      unpriced_outcome_types_omitted: number;
      /** @description Event client keys that match no client in the workspace, by event count, largest first, then by client key compared by Unicode code point. At most 100: `unmatched_client_keys_omitted` counts the rest. */
      unmatched_client_keys: {
        client_key: string;
        events: number;
      }[];
      /** @description How many unmatched client keys `unmatched_client_keys` leaves out, `0` when it lists every one. */
      unmatched_client_keys_omitted: number;
      /** @description Outcome events in the workspace that attribute to no client. */
      unattributable_outcome_events: number;
      /** @description Whether the client has no `client_key`, so only solo-agent attribution reaches it. */
      client_key_unset: boolean;
      /** @description Whether the active model has no line items. */
      line_items_empty: boolean;
      /** @description Whether the period holds events from before the model was created. */
      period_precedes_model: boolean;
    };
    /** @description A value computation. */
    ValueResult: {
      value_model: components["schemas"]["ValueModelRef"] | null;
      /** @description One line for each line item of the model, in line-item order, so at most 50. An outcome type no line item prices is never a line; it is listed in `coverage.unpriced_outcome_types`. */
      lines: components["schemas"]["ValueLine"][];
      total: components["schemas"]["Money"] | null;
      coverage: components["schemas"]["ValueCoverage"];
    };
    /** @description A cost line item prorated over the period. */
    ManualCostLine: {
      id: components["schemas"]["Uuid"];
      label: string;
      target: components["schemas"]["CostTarget"];
      monthly_amount: components["schemas"]["Money"];
      /** @description Days of the period the charge covers. */
      covered_days: number;
      /** @description The prorated amount for the period. */
      total: components["schemas"]["Money"];
    };
    /** @description Model events valued from their tokens at the price table. */
    TokenCostLine: {
      model: string;
      events: number;
      tokens_in: number;
      tokens_out: number;
      /** @description The price of 1,000 input tokens used. */
      in_rate: components["schemas"]["Money"];
      /** @description The price of 1,000 output tokens used. */
      out_rate: components["schemas"]["Money"];
      total: components["schemas"]["Money"];
    };
    /** @description One agent's share of the cost. */
    AgentCostLine: {
      agent_id: components["schemas"]["Uuid"];
      agent_name: string;
      pass_through: components["schemas"]["Money"];
      token_valued: components["schemas"]["Money"];
      manual: components["schemas"]["Money"];
      total: components["schemas"]["Money"];
    };
    /** @description An agent-targeted line item that reaches no client. */
    UnattributedLineItem: {
      id: components["schemas"]["Uuid"];
      label: string;
      agent_id: components["schemas"]["Uuid"];
      agent_name: string;
    };
    /** @description Every way cost could be missing from the total. */
    CostCoverage: {
      /** @description Model events with no `cost`. */
      uncosted_model_events: number;
      /** @description Models on uncosted events that the price table does not price, by event count, largest first, then by model compared by Unicode code point. At most 100: `unpriceable_models_omitted` counts the rest. */
      unpriceable_models: {
        model: string;
        events: number;
      }[];
      /** @description How many unpriceable models `unpriceable_models` leaves out, `0` when it lists every one. `uncosted_model_events` counts the events of every one. */
      unpriceable_models_omitted: number;
      /** @description Uncosted model events valued from their tokens. */
      token_valued_events: number;
      /** @description By label compared by Unicode code point, then by `id`. At most 100: `unattributed_line_items_omitted` counts the rest. */
      unattributed_line_items: components["schemas"]["UnattributedLineItem"][];
      /** @description How many unattributed line items `unattributed_line_items` leaves out, `0` when it lists every one. */
      unattributed_line_items_omitted: number;
      /** @description Line items covering only part of the period, by `total`, largest first, then by `id`. At most 100: `partially_covered_line_items_omitted` counts the rest. */
      partially_covered_line_items: components["schemas"]["ManualCostLine"][];
      /** @description How many partly covering line items `partially_covered_line_items` leaves out, `0` when it lists every one. */
      partially_covered_line_items_omitted: number;
      prorated_through: components["schemas"]["Date"];
      /** @description Whether proration stopped before the end of the period because the period has not ended. */
      period_truncated: boolean;
    };
    /** @description A cost computation. */
    CostResult: {
      /** @description The sum of event `cost`. */
      pass_through: components["schemas"]["Money"];
      /** @description Uncosted model events valued at the price table. */
      token_valued: components["schemas"]["Money"];
      /** @description Cost line items, prorated. The sum covers every line item, listed or not. */
      manual: components["schemas"]["Money"];
      total: components["schemas"]["Money"];
      /** @description The cost line items reaching the client in the period, by `total`, largest first, then by `id`. At most 100: `manual_lines_omitted` counts the rest. */
      manual_lines: components["schemas"]["ManualCostLine"][];
      /** @description How many line items `manual_lines` leaves out, `0` when it lists every one. */
      manual_lines_omitted: number;
      /** @description One line for each model the price table prices, so at most 200, as the price table holds at most 200 models. By `total`, largest first, then by model compared by Unicode code point. */
      token_lines: components["schemas"]["TokenCostLine"][];
      /** @description Cost per agent, by `total`, largest first, then by `agent_id`. At most 100: `agent_lines_omitted` counts the rest. */
      agent_lines: components["schemas"]["AgentCostLine"][];
      /** @description How many agents `agent_lines` leaves out, `0` when it lists every one. */
      agent_lines_omitted: number;
      coverage: components["schemas"]["CostCoverage"];
    };
    /** @description A client's value over a period. */
    ClientValue: {
      client_id: components["schemas"]["Uuid"];
      currency: components["schemas"]["Currency"];
      minor_units: components["schemas"]["MinorUnits"];
      period: components["schemas"]["Period"];
    } & components["schemas"]["ValueResult"];
    /** @description A client's operating cost over a period. */
    ClientCost: {
      client_id: components["schemas"]["Uuid"];
      currency: components["schemas"]["Currency"];
      minor_units: components["schemas"]["MinorUnits"];
      period: components["schemas"]["Period"];
    } & components["schemas"]["CostResult"];
    /** @description A client's ROI over a period: value and cost, composed and divided. */
    RoiResult: {
      client_id: components["schemas"]["Uuid"];
      currency: components["schemas"]["Currency"];
      minor_units: components["schemas"]["MinorUnits"];
      period: components["schemas"]["Period"];
      ratios: components["schemas"]["Ratios"];
      value: components["schemas"]["ValueResult"];
      cost: components["schemas"]["CostResult"];
    };
    /** @description Pre-validation flags for a period, computed live and stored nowhere. */
    Anomalies: {
      client_id: components["schemas"]["Uuid"];
      period: components["schemas"]["Period"];
      /** @description The currency of `cost_spikes`. */
      currency: components["schemas"]["Currency"];
      /** @description The scale `cost` and `baseline` in `cost_spikes` are rounded to. */
      minor_units: components["schemas"]["MinorUnits"];
      /** @description Days in the period with no outcome events, ascending. */
      zero_outcome_days: components["schemas"]["Date"][];
      /** @description Ascending by date. */
      cost_spikes: {
        date: components["schemas"]["Date"];
        /** @description The day's cost, rounded to `minor_units`. */
        cost: components["schemas"]["Money"];
        /** @description The baseline the day is compared with, rounded to `minor_units`. The spike is judged on the unrounded figures, so a rounded `cost` near three times the rounded `baseline` can still be a spike. */
        baseline: components["schemas"]["Money"];
      }[];
      /** @description Outcome types no line item prices, by quantity, largest first, then by outcome type compared by Unicode code point. At most 100: `unmapped_outcome_types_omitted` counts the rest. */
      unmapped_outcome_types: {
        outcome_type: string;
        events: number;
        quantity: number;
      }[];
      /** @description How many unmapped outcome types `unmapped_outcome_types` leaves out, `0` when it lists every one. */
      unmapped_outcome_types_omitted: number;
    };
    /** @description One event behind a client's totals. */
    AttributedEvent: {
      /** @description The event id: a 64-bit integer as a decimal string, because JavaScript numbers lose precision above 2^53. */
      id: string;
      timestamp: components["schemas"]["Instant"];
      agent_id: components["schemas"]["Uuid"];
      agent_name: string;
      category: components["schemas"]["EventCategory"] | (string & {});
      event_type: string;
      outcome_type: string | null;
      quantity: number;
      cost: components["schemas"]["Money"] | null;
      tokens_in: number | null;
      tokens_out: number | null;
      model: string | null;
      client_key: string | null;
      source: components["schemas"]["EventSource"] | (string & {});
    };
    /** @description The events behind a client's totals. The shared list envelope plus this list's own members. It is the one list that also takes `page` and returns `total`; `page` and the cursor are one offset with two spellings. */
    ClientEventList: {
      client_id: components["schemas"]["Uuid"];
      period: components["schemas"]["Period"];
      /** @description The currency of every `cost` in `data`, given once here. An event's stored `currency` is not exposed: it is always `null` or the workspace currency, because a mismatching event is refused. */
      currency: components["schemas"]["Currency"];
      page: number | null;
      /** @description Every event matching the filters, not only this page. */
      total: number;
      /** @description At most `limit`, in the requested order; ties break on the event id, descending. */
      data: components["schemas"]["AttributedEvent"][];
      has_more: boolean;
      next_cursor: string | null;
    };
    /** @description The validation checklist: the attestation recorded when the calculation was validated. All four checks are `false` until the calculation is validated. */
    Checklist: {
      coverage_confirmed: boolean;
      counts_spot_checked: boolean;
      costs_reviewed: boolean;
      unit_values_current: boolean;
      /** @description Free text, `""` when empty. */
      note: string;
    };
    /** @description The validation checklist, attesting that the figures were reviewed. All four checks must be `true`; an incomplete attestation is refused, not stored. */
    ChecklistInput: {
      /** @constant */
      coverage_confirmed: true;
      /** @constant */
      counts_spot_checked: true;
      /** @constant */
      costs_reviewed: true;
      /** @constant */
      unit_values_current: true;
      note?: string | null;
    };
    /** @description The ROI result frozen when the calculation was created, never rewritten. It is served with the field names it was stored with. A change to its shape increments `snapshot_version`, and this spec describes every version still stored. Version 1 is the `RoiResult` shape. Every list is stored whole. When served, each list the live ROI read limits is put in the same order and limited the same way, and its count of omitted entries is added beside it, so a snapshot and a live read of the same data match. The frozen totals cover every entry. */
    CalculationSnapshot: {
      /** @constant */
      snapshot_version: 1;
    } & components["schemas"]["RoiResult"];
    /** @description A calculation: a client's ROI for one ended period, frozen for validation and publication. */
    Calculation: {
      id: components["schemas"]["Uuid"];
      client_id: components["schemas"]["Uuid"];
      state: components["schemas"]["CalculationState"] | (string & {});
      period: components["schemas"]["Period"];
      currency: components["schemas"]["Currency"];
      minor_units: components["schemas"]["MinorUnits"];
      value_total: components["schemas"]["Money"] | null;
      cost_total: components["schemas"]["Money"];
      ratios: components["schemas"]["Ratios"];
      checklist: components["schemas"]["Checklist"];
      created_at: components["schemas"]["Instant"];
      validated_at: components["schemas"]["Instant"] | null;
      published_at: components["schemas"]["Instant"] | null;
      snapshot: components["schemas"]["CalculationSnapshot"];
    };
    /** @description A calculation as the list returns it: without `snapshot`, with `is_current`. */
    CalculationSummary: {
      id: components["schemas"]["Uuid"];
      client_id: components["schemas"]["Uuid"];
      state: components["schemas"]["CalculationState"] | (string & {});
      period: components["schemas"]["Period"];
      currency: components["schemas"]["Currency"];
      minor_units: components["schemas"]["MinorUnits"];
      value_total: components["schemas"]["Money"] | null;
      cost_total: components["schemas"]["Money"];
      ratios: components["schemas"]["Ratios"];
      checklist: components["schemas"]["Checklist"];
      created_at: components["schemas"]["Instant"];
      validated_at: components["schemas"]["Instant"] | null;
      published_at: components["schemas"]["Instant"] | null;
      is_current: boolean | null;
    };
    CalculationCreate: {
      /** @description The ended period to freeze. Digits below a microsecond are dropped from each bound before any check, because storage keeps no finer. A bound before `1900-01-01T00:00:00Z` is refused with `out_of_range` at its own pointer. `from` must be before `to`: a period with `from` at or after `to` holds no instant, and is refused with `out_of_range` at `/period/from`. `to` may be at most 731 days after `from`; a longer period is refused with `out_of_range` at `/period`. `to` must be at or before the start of the current UTC day, and after the client's first recorded activity; either failure is refused with `out_of_range` at `/period/to`. A client with no recorded events or charges at all is refused with `out_of_range` at `/period`, because no period can succeed. */
      period: components["schemas"]["PeriodInput"];
    };
    /** @description One coverage finding as it appears on a report. */
    Disclosure: {
      kind: components["schemas"]["DisclosureKind"] | (string & {});
      /** @description The facts a caller needs to write the sentence for this finding. Its members depend on `kind`, as `DisclosureKind` lists. */
      facts: Record<string, unknown>;
      /** @description Whether the finding goes out on the shared report. */
      included: boolean;
      text: string | null;
    };
    DisclosureEdit: {
      /** @description Names one of the report's stored findings, spelled as a read returns it. A kind that is not one of them is refused with `invalid_value` at `/disclosures/<index>/kind`. */
      kind: components["schemas"]["DisclosureKind"];
      included: boolean;
      text?: string | null;
    };
    /** @description A report: the editorial layer over a published calculation. */
    Report: {
      id: components["schemas"]["Uuid"];
      calculation_id: components["schemas"]["Uuid"];
      /** @description Free text, as the recipient sees it. */
      client_name: string;
      /** @description Free text, as the recipient sees it. */
      workspace_name: string;
      /** @description Free text, `""` when empty. */
      note: string;
      /** @description In the order the calculation's coverage produced them. At most 12: each kind appears at most once. */
      disclosures: components["schemas"]["Disclosure"][];
      share_token: string | null;
      shared_at: components["schemas"]["Instant"] | null;
      revoked_at: components["schemas"]["Instant"] | null;
      first_viewed_at: components["schemas"]["Instant"] | null;
      last_viewed_at: components["schemas"]["Instant"] | null;
      created_at: components["schemas"]["Instant"];
    };
    /** @description A report as the list returns it: without `disclosures`. Read the report for its findings. */
    ReportSummary: {
      id: components["schemas"]["Uuid"];
      calculation_id: components["schemas"]["Uuid"];
      /** @description Free text, as the recipient sees it. */
      client_name: string;
      /** @description Free text, as the recipient sees it. */
      workspace_name: string;
      /** @description Free text, `""` when empty. */
      note: string;
      share_token: string | null;
      shared_at: components["schemas"]["Instant"] | null;
      revoked_at: components["schemas"]["Instant"] | null;
      first_viewed_at: components["schemas"]["Instant"] | null;
      last_viewed_at: components["schemas"]["Instant"] | null;
      created_at: components["schemas"]["Instant"];
    };
    /** @description A report with its recipient preview, as the single read returns it. */
    ReportWithPreview: components["schemas"]["Report"] & {
      preview: components["schemas"]["PublicReport"] | null;
    };
    /** @description A JSON Merge Patch (RFC 7396). An array replaces the stored array whole. A shared report is refused with `report_shared`. */
    ReportPatch: {
      /** @description Free text, 1 to 200 characters counted in Unicode code points, padding included. Not trimmed: the value is stored as sent. Blank after trimming white space is `required`, and longer than 200 characters is `too_long`. */
      client_name?: string;
      /** @description Free text, 1 to 200 characters counted in Unicode code points, padding included. Not trimmed: the value is stored as sent. Blank after trimming white space is `required`, and longer than 200 characters is `too_long`. */
      workspace_name?: string;
      note?: string | null;
      /** @description Replaces the editorial state of every finding. It must name each stored finding exactly once: a missing one is `required`, an unknown one `invalid_value`, a repeated one `duplicate`. At most 50: a longer array is refused at its 51st element with one `too_many` at `/disclosures`. */
      disclosures?: components["schemas"]["DisclosureEdit"][];
    };
    /** @description A shared report as its recipient reads it. */
    PublicReport: {
      client_name: string;
      workspace_name: string;
      /** @description Free text, `""` when empty. */
      note: string;
      /** @description The included findings only, in report order. At most 12: each kind appears at most once. */
      disclosures: components["schemas"]["Disclosure"][];
      period: components["schemas"]["Period"];
      currency: components["schemas"]["Currency"];
      minor_units: components["schemas"]["MinorUnits"];
      /** @description The calculation's snapshot, narrowed to what a recipient sees. */
      snapshot: {
        /** @constant */
        snapshot_version: 1;
        currency: components["schemas"]["Currency"];
        minor_units: components["schemas"]["MinorUnits"];
        period: components["schemas"]["Period"];
        ratios: components["schemas"]["Ratios"];
        value: {
          value_model: {
            name: string;
            version: number;
          } | null;
          lines: components["schemas"]["ValueLine"][];
          total: components["schemas"]["Money"] | null;
        };
        cost: {
          pass_through: components["schemas"]["Money"];
          token_valued: components["schemas"]["Money"];
          manual: components["schemas"]["Money"];
          total: components["schemas"]["Money"];
        };
      };
      compared_to: {
        period: components["schemas"]["Period"];
        value_total: components["schemas"]["Money"] | null;
        cost_total: components["schemas"]["Money"];
        roi: components["schemas"]["Ratio"] | null;
      } | null;
    };
    /** @description One client's published figure for the month. `reason` is `null` exactly when the client is counted in the totals. */
    PortfolioClient: {
      client_id: components["schemas"]["Uuid"];
      name: string;
      status: components["schemas"]["ClientStatus"] | (string & {});
      renewal_date: components["schemas"]["Date"] | null;
      value_total: components["schemas"]["Money"] | null;
      cost_total: components["schemas"]["Money"] | null;
      roi: components["schemas"]["Ratio"] | null;
      reason:
        | (components["schemas"]["PortfolioExclusionReason"] | (string & {}))
        | null;
    };
    /** @description The workspace's published figures for one month. `GET /v1/dashboard`, which returns it, and `GET /v1/dashboard/renewals` are expected to change shape before `/v1` is declared stable. */
    Dashboard: {
      currency: components["schemas"]["Currency"];
      minor_units: components["schemas"]["MinorUnits"];
      period: components["schemas"]["Period"];
      /** @description Whether the month has ended. */
      period_ended: boolean;
      latest_published_month: components["schemas"]["Month"] | null;
      /** @description The sum of the counted clients' value totals, added as decimals. It equals the `total` of every `value_by_outcome` entry plus `value_by_outcome_omitted_total`, for figures of up to 15 significant digits. */
      value_total: components["schemas"]["Money"];
      cost_total: components["schemas"]["Money"];
      ratios: components["schemas"]["Ratios"];
      /** @description Clients counted in the totals. */
      counted: number;
      /** @description In the requested sort order; clients with no value for the sort key last, then by name, then by id. At most 1,000: `clients_omitted` counts the rest. */
      clients: components["schemas"]["PortfolioClient"][];
      /** @description How many clients `clients` leaves out, `0` when it lists every one. `counted` and the totals cover every client. */
      clients_omitted: number;
      /** @description The five counted clients with the highest `value_total`, largest first, then by `client_id`, chosen from every client whether or not `clients` lists it, and whatever `sort` and `dir` say. Fewer than five when fewer are counted. Each entry has the shape of a `clients` entry, with a `value_total` and a `reason` of `null`. */
      top_clients: components["schemas"]["PortfolioClient"][];
      cost_components: {
        pass_through: components["schemas"]["Money"];
        token_valued: components["schemas"]["Money"];
        manual: components["schemas"]["Money"];
      };
      /** @description Value by priced outcome type across the counted clients, by `total`, largest first, then by outcome type compared by Unicode code point. An outcome type is grouped ignoring case and surrounding spaces, with its value and events summed across spellings. At most 100: `value_by_outcome_omitted` counts the rest. */
      value_by_outcome: {
        outcome_type: string;
        label: string;
        total: components["schemas"]["Money"];
        events: number;
      }[];
      /** @description How many outcome types `value_by_outcome` leaves out, `0` when it lists every one. `value_total` covers every one. */
      value_by_outcome_omitted: number;
      /** @description The value of the outcome types `value_by_outcome` leaves out, `0` when it lists every one. The `total` of every listed entry plus this equals `value_total` exactly, as decimals, for figures of up to 15 significant digits, so a chart can show the rest as one share without adding money itself. */
      value_by_outcome_omitted_total: components["schemas"]["Money"];
      /** @description The five agents with the highest cost, by `total`, largest first, then by `agent_id`. */
      agent_costs: components["schemas"]["AgentCostLine"][];
      /** @description Agents with recorded cost in the month. */
      agent_costs_recorded: number;
      /** @description Unpriced outcome types across the counted clients' figures, by event count, largest first, then by outcome type compared by Unicode code point. An outcome type is grouped ignoring case and surrounding spaces, with its events summed across spellings. At most 100: `unpriced_outcome_types_omitted` counts the rest. */
      unpriced_outcome_types: {
        outcome_type: string;
        events: number;
      }[];
      /** @description How many unpriced outcome types `unpriced_outcome_types` leaves out, `0` when it lists every one. */
      unpriced_outcome_types_omitted: number;
      /** @description Charges on agents serving several clients or none, which reach no client, by `total`, largest first, then by label compared by Unicode code point, then by `id`. At most 100: `unallocated_charges_omitted` counts the rest. */
      unallocated_charges: {
        id: components["schemas"]["Uuid"];
        label: string;
        agent_id: components["schemas"]["Uuid"];
        agent_name: string;
        total: components["schemas"]["Money"];
      }[];
      /** @description How many charges `unallocated_charges` leaves out, `0` when it lists every one. */
      unallocated_charges_omitted: number;
      onboarding: {
        has_client: boolean;
        has_assigned_agent: boolean;
        has_priced_outcomes: boolean;
        has_events: boolean;
        has_published: boolean;
      };
    };
    /** @description A client's renewal readiness, from its latest published figures. `health` and `unavailable` are never both set. */
    Renewal: {
      client_id: components["schemas"]["Uuid"];
      name: string;
      renewal_date: components["schemas"]["Date"];
      roi: components["schemas"]["Ratio"] | null;
      period: components["schemas"]["Period"] | null;
      health: {
        direction: components["schemas"]["HealthDirection"] | (string & {});
        /** @description The change in percentage points, one decimal place. */
        delta_points: number;
        current_roi: components["schemas"]["Ratio"];
        prior_roi: components["schemas"]["Ratio"];
      } | null;
      unavailable:
        | (components["schemas"]["HealthUnavailable"] | (string & {}))
        | null;
      prior_period: components["schemas"]["Month"] | null;
    };
    /** @description An API key. The secret is never returned after creation. */
    ApiKey: {
      id: components["schemas"]["Uuid"];
      /** @description Free text. */
      name: string;
      /** @description `aia_` plus the key-id: the first 12 characters of the token, so an owner can match a leaked token to its key. */
      prefix: string;
      /** @description In the order `ingest`, `read`, `write`. */
      scopes: (components["schemas"]["Scope"] | (string & {}))[];
      created_at: components["schemas"]["Instant"];
      last_used_at: components["schemas"]["Instant"] | null;
      revoked_at: components["schemas"]["Instant"] | null;
    };
    /** @description A newly created key, with the complete bearer value. `token` appears in this one response and nowhere else. */
    ApiKeyWithToken: components["schemas"]["ApiKey"] & {
      /** @description The complete bearer value: `aia_`, the 8-character key-id, and the 43-character secret. */
      token: string;
    };
    ApiKeyCreate: {
      /** @description Free text, 1 to 100 characters after trimming white space (the Unicode `White_Space` property) from both ends. The trimmed name is stored. Blank after trimming is `required`, and longer than 100 characters after trimming is `too_long`. The trimmed name must not contain a control character (Unicode category Cc), a line separator (U+2028), a paragraph separator (U+2029), a bidirectional embedding, override or isolate control (U+202A to U+202E, U+2066 to U+2069), or a byte order mark (U+FEFF): `invalid_format`. The first three keep a name on one line; the bidirectional controls and the byte order mark keep the name a reader sees the same as the name stored. The zero-width joiner and non-joiner (U+200D, U+200C) are allowed. `pattern` states the character rule exactly, padding included: white space at either end may hold a tab or a line break, because trimming removes it. No JSON Schema keyword measures a length after trimming, so the schema states no `maxLength`; a `maxLength` of 100 would refuse a padded name the server accepts. */
      name: string;
      /** @description 1 to 3 scopes. A repeated value is refused with `duplicate`, an unknown one with `invalid_value`. */
      scopes: components["schemas"]["Scope"][];
    };
    /** @description A canonical event. A problem with one event rejects that event only, as row errors; an unknown member is such a problem. `category` outside `EventCategory` is refused with `invalid_value`. `currency` is not part of the deduplication hash. */
    EventInput: {
      event_id?: string | null;
      /** @description When the event happened. At most 24 hours in the future. */
      timestamp: components["schemas"]["InstantInput"];
      /** @description The agent that acted. An agent not seen before is created. 1 to 200 characters, counted as sent; more is refused with `too_long`. */
      agent_key: string;
      client_key?: string | null;
      category: components["schemas"]["EventCategory"];
      /** @description What the agent did. 1 to 200 characters, counted as sent; more is refused with `too_long`. */
      event_type: string;
      outcome_type?: string | null;
      quantity?: number | null;
      cost?: components["schemas"]["Money"] | null;
      tokens_in?: number | null;
      tokens_out?: number | null;
      model?: string | null;
      currency?: components["schemas"]["Currency"] | null;
      metadata?: Record<string, unknown> | null;
    };
    EventBatch: {
      /** @description 1 to 500 events. More than 500 is `413` `payload_too_large`. */
      events: components["schemas"]["EventInput"][];
    };
    /** @description One problem with a rejected ingest row. A row with several problems has one entry for each, all carrying its `index`; its `pointer` locates the problem, so it starts `/events/<index>`. */
    IngestRowError: {
      /** @description The zero-based position of the row in `events`. */
      index: number;
      code: components["schemas"]["FieldErrorCode"] | (string & {});
      /**
       * @description An RFC 6901 JSON Pointer, absolute within the request body.
       * @example /events/3/timestamp
       */
      pointer: string;
      detail: string;
    };
    /** @description The outcome of an ingest batch. Partial acceptance is a success. */
    IngestResult: {
      /** @description Rows stored. */
      accepted: number;
      /** @description Rows already stored, by `event_id` or content hash. */
      duplicates: number;
      /** @description Rows refused, counted once each however many problems they have, and however many of their entries `errors` holds. Each has at least one entry in `errors` unless `errors_truncated` is `true`. `accepted`, `duplicates` and `rejected` sum to the batch's length. */
      rejected: number;
      /** @description One entry per problem, ascending by `index` whichever check rejected the row. A row's entries are contiguous, in the order the row's checks run: first whether the row is a JSON object, then its shape (unknown, mistyped and repeated members, excess decimal places and malformed timestamps, in the order they appear in the row), then the field rules in field order, then the attribution guard. A row that fails one check is not checked by the later ones. At most 20 entries per row; a row with more keeps its first 20. The whole list is also at most 1,000,000 bytes, counted as the array is written in the response, brackets and commas included. Within that limit, each rejected row's first entry is kept in preference to any row's later entries. The first entries are taken in `index` order, and one that does not fit in the space left is skipped. The later entries of the rows that kept their first are then taken in order, and the first that does not fit ends them. The list stays in `index` order. So the entries kept for a row are always its first ones, and a rejected row has none only when its first entry did not fit. Either limit sets `errors_truncated`. `[]` when no row was rejected. */
      errors: components["schemas"]["IngestRowError"][];
      /** @description Whether `errors` omits any problem: a rejected row had more than 20, or the 1,000,000-byte limit left entries out. The counts always cover the whole batch. */
      errors_truncated: boolean;
    };
    /** @description How a CSV file maps onto canonical events. Each row's mapped values are held to the rules of `EventInput`. A `cost` with more than 6 decimal places is refused with `too_precise`, as on ingest. A `quantity` or `cost` cell must be a decimal number, `^[+-]?[0-9]+(\.[0-9]+)?([eE][+-]?[0-9]+)?$` after trimming, and a `tokens_in` or `tokens_out` cell an integer, `^[+-]?[0-9]+$`; anything else, hexadecimal, underscores, `Inf` and `NaN` included, is refused with `invalid_format`. An empty cell is not provided. An empty `currency` cell declares no currency. An `event_id`, `agent_key`, `client_key`, `event_type`, `outcome_type` or `model` value holds at most 200 characters, as on ingest. A cell is counted after trimming, and a constant as given. A longer value refuses its row with `too_long` at its column, or with a `null` column for a constant. A cell bound to `event_id`, `agent_key`, `client_key`, `category`, `event_type`, `outcome_type` or `model` that is not valid UTF-8 refuses its row with `invalid_format` at its column, as one holding U+0000 does. */
    ImportMapping: {
      /** @description Canonical field name to the file's column name. `timestamp`, `agent_key`, `event_type` and `category` must each be bound here or in `constants`. A column name is at most 256 bytes of UTF-8; a longer one is refused with `too_long` at its member. `maxLength` counts characters, so the server's byte limit is the tighter. */
      columns?: {
        [key: string]: string;
      };
      /** @description Canonical field name to a value used for every row. `timestamp` and `event_id` cannot be constants. A field cannot be bound in both maps. A constant for `agent_key`, `client_key`, `event_type`, `outcome_type` or `model` holds at most 200 characters, counted as sent; a longer one refuses every row with `too_long`. */
      constants?: {
        [key: string]: string;
      };
      /**
       * @description An IANA zone for timestamps without an offset. Default `UTC`. `Local` is refused.
       * @default UTC
       * @example Asia/Tokyo
       */
      timezone?: string;
      /**
       * @description The field delimiter. Default `,`.
       * @default ,
       * @enum {string}
       */
      delimiter?: "," | ";" | "\t";
    };
    /** @description Two parts, in this order: `mapping`, then `file`. The server reads them in that order and never buffers the file whole. A request-level problem in this body is located by `part` (see `FieldError`): a mapping member by `part` `mapping` and a `pointer` into the mapping, such as `/columns/client_key`; a mapped column absent from the file header by `part` `file` and that `column`; a missing or misordered part by `part` alone. A part after `file` is refused with `unknown_field` on that part, and a `mapping` part over 65,536 bytes with `too_large`. A header that names a column more than once is refused with `duplicate` on `part` `file` and that `column`, one entry per repeated name in the order each first repeats, before any `required` entry for a mapped column the header lacks. Names compare exactly, untrimmed, so `Bot` and `Bot ` are two columns. Blank header cells may repeat unless the mapping binds the blank name. */
    ImportUpload: {
      mapping: components["schemas"]["ImportMapping"];
      /** @description The CSV file, with a header row. At most 250,000 data rows. Each header name is at most 256 bytes of UTF-8; a longer one is refused with `too_long` on `part` `file`, located by its position in the `detail` and carrying no `column`, before any repeated-name or missing-column check. A header name that is not valid UTF-8 is accepted, but the mapping cannot bind it, and the response writes each such byte as U+FFFD wherever it names the column. The part's file name is stored with the import, so one that is not valid UTF-8 is refused with `invalid_format` on `part` `file`, as one holding U+0000 is. */
      file: string;
    };
    /** @description One problem with a rejected CSV row. A row with several problems has one entry for each, all carrying its `row`. */
    ImportRowError: {
      /** @description The one-based line number in the file, counting the header. */
      row: number;
      column: string | null;
      code: components["schemas"]["FieldErrorCode"] | (string & {});
      detail: string;
    };
    /** @description A mapped event as commit would store it. Every field is present; an unset one is `null`. */
    PreviewEvent: {
      event_id: string | null;
      timestamp: components["schemas"]["Instant"];
      agent_key: string;
      client_key: string | null;
      category: components["schemas"]["EventCategory"] | (string & {});
      event_type: string;
      outcome_type: string | null;
      quantity: number;
      cost: components["schemas"]["Money"] | null;
      tokens_in: number | null;
      tokens_out: number | null;
      model: string | null;
      currency: components["schemas"]["Currency"] | null;
      metadata: Record<string, unknown> | null;
    };
    /** @description One of the first 20 data rows. A valid row has its `event` and `errors` `[]`; a rejected row has `event` `null` and 1 to 13 `errors`. */
    PreviewRow: {
      /** @description The one-based line number, counting the header. */
      row: number;
      event: components["schemas"]["PreviewEvent"] | null;
      /** @description The row's problems, in the order the row's entries take in the response's `errors`. `[]` for a valid row. At most 13: one for each field a mapping can bind. */
      errors: components["schemas"]["ImportRowError"][];
    };
    /** @description What committing the file would do. Nothing is written. */
    ImportPreview: {
      total_rows: number;
      valid: number;
      /** @description Rows the file would reject, counted once each however many problems they have. */
      rejected: number;
      /** @description The first 20 data rows, in file order, broken rows included. */
      preview: components["schemas"]["PreviewRow"][];
      /** @description One entry per problem, ascending by `row`. A row's entries follow the order its checks run: first whether the record can be read as CSV, then each field's cell and rules in field order, then the attribution guard. A row that fails one check is not checked by the later ones. At most 1,000 in all: the first 1,000 in that order, which may end partway through a row. A CSV row has at most 13 entries, one for each field a mapping can bind. */
      errors: components["schemas"]["ImportRowError"][];
      /** @description Whether `errors` omits any problem because of the 1,000 cap. The counts always cover the whole file. */
      errors_truncated: boolean;
      /** @description The first 100 columns the mapping does not bind, in the header's order, left to right. A blank header cell is a column too, listed as `""`. `ignored_columns_omitted` counts the rest. */
      ignored_columns: string[];
      /** @description How many columns the mapping does not bind beyond the 100 in `ignored_columns`. `0` when the list is complete. */
      ignored_columns_omitted: number;
      timezone_warning: string | null;
    };
    /** @description The outcome of a CSV import. Partial acceptance is a success. */
    ImportResult: {
      import_batch_id: components["schemas"]["Uuid"];
      accepted: number;
      duplicates: number;
      /** @description Rows rejected, counted once each however many problems they have. */
      rejected: number;
      /** @description As on the preview: one entry per problem, by `row`, at most 1,000 in all. `[]` when no row was rejected. */
      errors: components["schemas"]["ImportRowError"][];
      /** @description Whether `errors` omits any problem, as on the preview. */
      errors_truncated: boolean;
    };
    /** @description Liveness. */
    Health: {
      status: "ok" | (string & {});
      /** @description The build version. */
      version: string;
    };
    /** @description Clients, ordered by name case-insensitively, then id. */
    ClientList: {
      /** @description One page of items, at most `limit`, in the documented order. */
      data: components["schemas"]["Client"][];
      /** @description Whether another page exists. */
      has_more: boolean;
      next_cursor: string | null;
    };
    /** @description Agents, ordered by name case-insensitively, then id. Includes agents ingest created. */
    AgentList: {
      /** @description One page of items, at most `limit`, in the documented order. */
      data: components["schemas"]["AgentListItem"][];
      /** @description Whether another page exists. */
      has_more: boolean;
      next_cursor: string | null;
    };
    /** @description Value models: active first, then newest first, then id. */
    ValueModelList: {
      /** @description One page of items, at most `limit`, in the documented order. */
      data: components["schemas"]["ValueModelSummary"][];
      /** @description Whether another page exists. */
      has_more: boolean;
      next_cursor: string | null;
    };
    /** @description Outcome types by summed quantity, largest first, then by name. */
    OutcomeTypeList: {
      /** @description One page of items, at most `limit`, in the documented order. */
      data: components["schemas"]["OutcomeTypeUsage"][];
      /** @description Whether another page exists. */
      has_more: boolean;
      next_cursor: string | null;
    };
    /** @description Templates in display order. */
    ValueTemplateList: {
      /** @description One page of items, at most `limit`, in the documented order. */
      data: components["schemas"]["ValueTemplate"][];
      /** @description Whether another page exists. */
      has_more: boolean;
      next_cursor: string | null;
    };
    /** @description Line items, newest first, then id. */
    CostLineItemList: {
      /** @description One page of items, at most `limit`, in the documented order. */
      data: components["schemas"]["CostLineItem"][];
      /** @description Whether another page exists. */
      has_more: boolean;
      next_cursor: string | null;
    };
    /** @description A client's calculations: latest period first, then newest first, then id. */
    CalculationList: {
      /** @description One page of items, at most `limit`, in the documented order. */
      data: components["schemas"]["CalculationSummary"][];
      /** @description Whether another page exists. */
      has_more: boolean;
      next_cursor: string | null;
    };
    /** @description A calculation's reports, newest first, then id. */
    ReportList: {
      /** @description One page of items, at most `limit`, in the documented order. */
      data: components["schemas"]["ReportSummary"][];
      /** @description Whether another page exists. */
      has_more: boolean;
      next_cursor: string | null;
    };
    /** @description Clients with a renewal date, by renewal date, then name, then id. */
    RenewalList: {
      /** @description One page of items, at most `limit`, in the documented order. */
      data: components["schemas"]["Renewal"][];
      /** @description Whether another page exists. */
      has_more: boolean;
      next_cursor: string | null;
    };
    /** @description Every key in the workspace, revoked keys included, newest first, then id. */
    ApiKeyList: {
      /** @description One page of items, at most `limit`, in the documented order. */
      data: components["schemas"]["ApiKey"][];
      /** @description Whether another page exists. */
      has_more: boolean;
      next_cursor: string | null;
    };
  };
  responses: {
    /** @description `invalid_json`: the body is not one JSON object. `validation_failed`: a field, parameter, header or multipart part breaks a rule; `errors` lists every problem. */
    BadRequest: {
      headers: {
        "X-Request-Id": components["headers"]["X-Request-Id"];
        RateLimit: components["headers"]["RateLimit"];
        "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
        [name: string]: unknown;
      };
      content: {
        /**
         * @example {
         *       "type": "https://api.allisai.ai/errors/validation_failed",
         *       "title": "The request is invalid",
         *       "status": 400,
         *       "detail": "2 problems were found in the request.",
         *       "code": "validation_failed",
         *       "request_id": "3a9f6c1e2b7d4e5f8a0b1c2d3e4f5a6b",
         *       "errors": [
         *         {
         *           "code": "required",
         *           "pointer": "/name",
         *           "detail": "name is required"
         *         },
         *         {
         *           "code": "unknown_field",
         *           "parameter": "form",
         *           "detail": "form is not a parameter of this operation"
         *         }
         *       ]
         *     }
         */
        "application/problem+json": components["schemas"]["Problem"] & {
          /** @enum {unknown} */
          code?: "invalid_json" | "validation_failed";
        };
      };
    };
    /** @description No credential, or the credential failed. */
    Unauthenticated: {
      headers: {
        "X-Request-Id": components["headers"]["X-Request-Id"];
        "WWW-Authenticate": components["headers"]["WWW-Authenticate"];
        [name: string]: unknown;
      };
      content: {
        /**
         * @example {
         *       "type": "https://api.allisai.ai/errors/unauthenticated",
         *       "title": "Authentication is required",
         *       "status": 401,
         *       "detail": "The API key is not valid.",
         *       "code": "unauthenticated",
         *       "request_id": "3a9f6c1e2b7d4e5f8a0b1c2d3e4f5a6b"
         *     }
         */
        "application/problem+json": components["schemas"]["Problem"] & {
          /** @enum {unknown} */
          code?: "unauthenticated";
        };
      };
    };
    /** @description The API key lacks the `ingest` scope. */
    ForbiddenKeyOnly: {
      headers: {
        "X-Request-Id": components["headers"]["X-Request-Id"];
        /** @description `Bearer error="insufficient_scope", scope="ingest"` (RFC 6750 §3.1). */
        "WWW-Authenticate": string;
        [name: string]: unknown;
      };
      content: {
        /**
         * @example {
         *       "type": "https://api.allisai.ai/errors/insufficient_scope",
         *       "title": "The API key lacks the required scope",
         *       "status": 403,
         *       "detail": "This operation needs a key with the ingest scope.",
         *       "code": "insufficient_scope",
         *       "request_id": "3a9f6c1e2b7d4e5f8a0b1c2d3e4f5a6b"
         *     }
         */
        "application/problem+json": components["schemas"]["Problem"] & {
          /** @enum {unknown} */
          code?: "insufficient_scope";
        };
      };
    };
    /** @description `insufficient_scope`: the API key lacks the operation's scope, which `WWW-Authenticate` names. `account_not_provisioned`: the session's user has no workspace. */
    ForbiddenKeyOrSession: {
      headers: {
        "X-Request-Id": components["headers"]["X-Request-Id"];
        /** @description Sent with `insufficient_scope` only: `Bearer error="insufficient_scope", scope="<scope>"`. */
        "WWW-Authenticate"?: string;
        [name: string]: unknown;
      };
      content: {
        /**
         * @example {
         *       "type": "https://api.allisai.ai/errors/insufficient_scope",
         *       "title": "The API key lacks the required scope",
         *       "status": 403,
         *       "detail": "This operation needs a key with the read scope.",
         *       "code": "insufficient_scope",
         *       "request_id": "3a9f6c1e2b7d4e5f8a0b1c2d3e4f5a6b"
         *     }
         */
        "application/problem+json": components["schemas"]["Problem"] & {
          /** @enum {unknown} */
          code?: "insufficient_scope" | "account_not_provisioned";
        };
      };
    };
    /** @description `session_required`: any API key, whatever its scopes. `account_not_provisioned`: the session's user has no workspace. */
    ForbiddenSessionOnly: {
      headers: {
        "X-Request-Id": components["headers"]["X-Request-Id"];
        [name: string]: unknown;
      };
      content: {
        /**
         * @example {
         *       "type": "https://api.allisai.ai/errors/session_required",
         *       "title": "This action requires a signed-in session",
         *       "status": 403,
         *       "detail": "This action requires a signed-in session; API keys cannot perform it.",
         *       "code": "session_required",
         *       "request_id": "3a9f6c1e2b7d4e5f8a0b1c2d3e4f5a6b"
         *     }
         */
        "application/problem+json": components["schemas"]["Problem"] & {
          /** @enum {unknown} */
          code?: "session_required" | "account_not_provisioned";
        };
      };
    };
    /** @description The id names nothing in the workspace, or is malformed. */
    NotFound: {
      headers: {
        "X-Request-Id": components["headers"]["X-Request-Id"];
        RateLimit: components["headers"]["RateLimit"];
        "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
        [name: string]: unknown;
      };
      content: {
        /**
         * @example {
         *       "type": "https://api.allisai.ai/errors/not_found",
         *       "title": "The resource was not found",
         *       "status": 404,
         *       "detail": "client not found",
         *       "code": "not_found",
         *       "request_id": "3a9f6c1e2b7d4e5f8a0b1c2d3e4f5a6b"
         *     }
         */
        "application/problem+json": components["schemas"]["Problem"] & {
          /** @enum {unknown} */
          code?: "not_found";
        };
      };
    };
    /** @description The body is over the operation's limit: its `x-body-limit`, or the `1M` default when it declares none. */
    PayloadTooLarge: {
      headers: {
        "X-Request-Id": components["headers"]["X-Request-Id"];
        RateLimit: components["headers"]["RateLimit"];
        "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
        [name: string]: unknown;
      };
      content: {
        /**
         * @example {
         *       "type": "https://api.allisai.ai/errors/payload_too_large",
         *       "title": "The request is too large",
         *       "status": 413,
         *       "detail": "The request body exceeds 1 MB.",
         *       "code": "payload_too_large",
         *       "request_id": "3a9f6c1e2b7d4e5f8a0b1c2d3e4f5a6b"
         *     }
         */
        "application/problem+json": components["schemas"]["Problem"] & {
          /** @enum {unknown} */
          code?: "payload_too_large";
        };
      };
    };
    /** @description The query string holds more than 10,000 parameters. Every `&`-separated pair counts, empty ones included. No parameter is at fault on its own, so the response carries no `errors`. */
    UriTooLong: {
      headers: {
        "X-Request-Id": components["headers"]["X-Request-Id"];
        RateLimit: components["headers"]["RateLimit"];
        "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
        [name: string]: unknown;
      };
      content: {
        /**
         * @example {
         *       "type": "https://api.allisai.ai/errors/uri_too_long",
         *       "title": "The request URI is too long",
         *       "status": 414,
         *       "detail": "The query string holds more than 10000 parameters.",
         *       "code": "uri_too_long",
         *       "request_id": "3a9f6c1e2b7d4e5f8a0b1c2d3e4f5a6b"
         *     }
         */
        "application/problem+json": components["schemas"]["Problem"] & {
          /** @enum {unknown} */
          code?: "uri_too_long";
        };
      };
    };
    /** @description The `Content-Type` is not one this operation takes, or names a `charset` other than `utf-8` on a JSON media type. */
    UnsupportedMediaType: {
      headers: {
        "X-Request-Id": components["headers"]["X-Request-Id"];
        RateLimit: components["headers"]["RateLimit"];
        "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
        [name: string]: unknown;
      };
      content: {
        /**
         * @example {
         *       "type": "https://api.allisai.ai/errors/unsupported_media_type",
         *       "title": "The content type is not supported",
         *       "status": 415,
         *       "detail": "Send the body as application/json, in UTF-8.",
         *       "code": "unsupported_media_type",
         *       "request_id": "3a9f6c1e2b7d4e5f8a0b1c2d3e4f5a6b"
         *     }
         */
        "application/problem+json": components["schemas"]["Problem"] & {
          /** @enum {unknown} */
          code?: "unsupported_media_type";
        };
      };
    };
    /** @description The `Content-Type` is not one this `PATCH` takes, or names a `charset` other than `utf-8`. `Accept-Patch` lists the patch formats the resource takes (RFC 5789 §2.2). */
    UnsupportedMediaTypePatch: {
      headers: {
        "Accept-Patch": components["headers"]["Accept-Patch"];
        "X-Request-Id": components["headers"]["X-Request-Id"];
        RateLimit: components["headers"]["RateLimit"];
        "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
        [name: string]: unknown;
      };
      content: {
        /**
         * @example {
         *       "type": "https://api.allisai.ai/errors/unsupported_media_type",
         *       "title": "The content type is not supported",
         *       "status": 415,
         *       "detail": "Send the body as application/merge-patch+json or application/json, in UTF-8.",
         *       "code": "unsupported_media_type",
         *       "request_id": "3a9f6c1e2b7d4e5f8a0b1c2d3e4f5a6b"
         *     }
         */
        "application/problem+json": components["schemas"]["Problem"] & {
          /** @enum {unknown} */
          code?: "unsupported_media_type";
        };
      };
    };
    /** @description The `Idempotency-Key` was used in the last 24 hours with a different request. */
    IdempotencyKeyReused: {
      headers: {
        "X-Request-Id": components["headers"]["X-Request-Id"];
        RateLimit: components["headers"]["RateLimit"];
        "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
        [name: string]: unknown;
      };
      content: {
        /**
         * @example {
         *       "type": "https://api.allisai.ai/errors/idempotency_key_reused",
         *       "title": "The idempotency key was used with a different request",
         *       "status": 422,
         *       "detail": "This Idempotency-Key was used with a different request.",
         *       "code": "idempotency_key_reused",
         *       "request_id": "3a9f6c1e2b7d4e5f8a0b1c2d3e4f5a6b"
         *     }
         */
        "application/problem+json": components["schemas"]["Problem"] & {
          /** @enum {unknown} */
          code?: "idempotency_key_reused";
        };
      };
    };
    /** @description The API key is over its rate limit. */
    RateLimited: {
      headers: {
        "X-Request-Id": components["headers"]["X-Request-Id"];
        "Retry-After": components["headers"]["Retry-After"];
        /** @description Sent on every response to an API key once the rate limiter has run: absent on `401` and `403`, and on every response to a session. The quota left in the one policy the request consumed, as IETF draft-ietf-httpapi-ratelimit-headers-11 specifies. On a `429` it is `r=0`, and `t` equals `Retry-After`, e.g. `"api";r=0;t=1`. It tracks the draft, and may change to follow a newer draft without being treated as a breaking change. Do not base retries on it; retry on `Retry-After`. */
        RateLimit: string;
        /** @description Sent whenever `RateLimit` is. Every policy the key is subject to, as IETF draft-11 specifies. It tracks the draft, and may change to follow a newer draft without being treated as a breaking change. */
        "RateLimit-Policy": string;
        [name: string]: unknown;
      };
      content: {
        /**
         * @example {
         *       "type": "https://api.allisai.ai/errors/rate_limited",
         *       "title": "Too many requests",
         *       "status": 429,
         *       "detail": "Retry after 1 second.",
         *       "code": "rate_limited",
         *       "request_id": "3a9f6c1e2b7d4e5f8a0b1c2d3e4f5a6b"
         *     }
         */
        "application/problem+json": components["schemas"]["Problem"] & {
          /** @enum {unknown} */
          code?: "rate_limited";
        };
      };
    };
    /** @description An unexpected error. Nothing was stored. */
    InternalError: {
      headers: {
        "X-Request-Id": components["headers"]["X-Request-Id"];
        RateLimit: components["headers"]["RateLimit"];
        "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
        [name: string]: unknown;
      };
      content: {
        /**
         * @example {
         *       "type": "https://api.allisai.ai/errors/internal_error",
         *       "title": "An internal error occurred",
         *       "status": 500,
         *       "detail": "An internal error occurred. Quote the request id if you report it.",
         *       "code": "internal_error",
         *       "request_id": "3a9f6c1e2b7d4e5f8a0b1c2d3e4f5a6b"
         *     }
         */
        "application/problem+json": components["schemas"]["Problem"] & {
          /** @enum {unknown} */
          code?: "internal_error";
        };
      };
    };
    /** @description The request is invalid. On `GET` the code is `invalid_json` or `validation_failed`. No body: a response to `HEAD` carries the status and headers only, and no `Content-Length`. `Content-Type` is `application/problem+json`, as on `GET`; send the request as `GET` to read the problem document. */
    BadRequestHead: {
      headers: {
        "X-Request-Id": components["headers"]["X-Request-Id"];
        RateLimit: components["headers"]["RateLimit"];
        "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
        [name: string]: unknown;
      };
      content?: never;
    };
    /** @description The body is over the operation's limit. On `GET` the code is `payload_too_large`. No body: a response to `HEAD` carries the status and headers only, and no `Content-Length`. `Content-Type` is `application/problem+json`, as on `GET`; send the request as `GET` to read the problem document. */
    PayloadTooLargeHead: {
      headers: {
        "X-Request-Id": components["headers"]["X-Request-Id"];
        RateLimit: components["headers"]["RateLimit"];
        "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
        [name: string]: unknown;
      };
      content?: never;
    };
    /** @description The query string holds more than 10,000 parameters. On `GET` the code is `uri_too_long`. No body: a response to `HEAD` carries the status and headers only, and no `Content-Length`. `Content-Type` is `application/problem+json`, as on `GET`; send the request as `GET` to read the problem document. */
    UriTooLongHead: {
      headers: {
        "X-Request-Id": components["headers"]["X-Request-Id"];
        RateLimit: components["headers"]["RateLimit"];
        "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
        [name: string]: unknown;
      };
      content?: never;
    };
    /** @description An unexpected error. On `GET` the code is `internal_error`. No body: a response to `HEAD` carries the status and headers only, and no `Content-Length`. `Content-Type` is `application/problem+json`, as on `GET`; send the request as `GET` to read the problem document. */
    InternalErrorHead: {
      headers: {
        "X-Request-Id": components["headers"]["X-Request-Id"];
        RateLimit: components["headers"]["RateLimit"];
        "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
        [name: string]: unknown;
      };
      content?: never;
    };
  };
  parameters: {
    /** @description A resource id, in the RFC 9562 string form in either case. A malformed or unknown id is `404` `not_found`, so the response never reveals whether a resource exists; a spelling such as `{<uuid>}` or `urn:uuid:<uuid>` is malformed. */
    Id: components["schemas"]["UuidInput"];
    /** @description Page size, 1 to 200. A value outside the range is refused with `out_of_range`, never clamped. */
    Limit: number;
    /** @description `next_cursor` from the previous page. Valid only with the filters and sort it was issued under; otherwise refused with `invalid_value`. An empty value is refused with `invalid_format`, like any empty query parameter. `limit` may change between pages. */
    Cursor: string;
    /**
     * @description Start of a half-open range, inclusive. Absent means unbounded. Must not be after `to`, or it is refused with `out_of_range` on `from`. Each sent bound must be at or after `1900-01-01T00:00:00Z` and before `10000-01-01T00:00:00Z`; otherwise it is refused with `out_of_range` on its own parameter. Digits below a microsecond are dropped before any check. When both bounds are sent, `to` may be at most 731 days after `from`; a longer period is refused with `out_of_range` on `from`.
     * @example 2026-08-01T00:00:00Z
     */
    FromOptional: components["schemas"]["InstantInput"];
    /**
     * @description End of a half-open range, exclusive. Absent means unbounded. Each sent bound must be at or after `1900-01-01T00:00:00Z` and before `10000-01-01T00:00:00Z`; otherwise it is refused with `out_of_range` on its own parameter. Digits below a microsecond are dropped before any check. When both bounds are sent, `to` may be at most 731 days after `from`; a longer period is refused with `out_of_range` on `from`.
     * @example 2026-09-01T00:00:00Z
     */
    ToOptional: components["schemas"]["InstantInput"];
    /**
     * @description Start of the period, inclusive. Must not be after `to`, or it is refused with `out_of_range` on `from`. Each sent bound must be at or after `1900-01-01T00:00:00Z` and before `10000-01-01T00:00:00Z`; otherwise it is refused with `out_of_range` on its own parameter. Digits below a microsecond are dropped before any check. When both bounds are sent, `to` may be at most 731 days after `from`; a longer period is refused with `out_of_range` on `from`.
     * @example 2026-08-01T00:00:00Z
     */
    FromRequired: components["schemas"]["InstantInput"];
    /**
     * @description End of the period, exclusive. Required: an open period would prorate to the current day, so the figure would change with the day it was read. Each sent bound must be at or after `1900-01-01T00:00:00Z` and before `10000-01-01T00:00:00Z`; otherwise it is refused with `out_of_range` on its own parameter. Digits below a microsecond are dropped before any check. When both bounds are sent, `to` may be at most 731 days after `from`; a longer period is refused with `out_of_range` on `from`.
     * @example 2026-09-01T00:00:00Z
     */
    ToRequired: components["schemas"]["InstantInput"];
    /** @description Optional, sent once. 1 to 255 characters of visible ASCII not starting with `"`, or a structured-field String of 1 to 255 visible ASCII characters; the quoted form `"abc"` is the same key as `abc`. A repeat within 24 hours, in the same workspace, with the same method, path, query, media type and body, replays the stored response with `Idempotent-Replayed: true`; with a different request it is `422` `idempotency_key_reused`; while the first is still running it is `409` `idempotency_key_in_use`. Only `2xx` outcomes are stored. A malformed value, `""` included, or the header sent twice is refused with `invalid_format`, located by `header`. */
    IdempotencyKey: string;
  };
  requestBodies: never;
  headers: {
    /** @description The request's id, to quote in support requests. Echoes the request's `X-Request-Id` when it was at most 200 bytes of visible ASCII; otherwise generated. */
    "X-Request-Id": string;
    /** @description Sent on every response to an API key once the rate limiter has run: absent on `401` and `403`, and on every response to a session. The quota left in the one policy the request consumed, as IETF draft-ietf-httpapi-ratelimit-headers-11 specifies, e.g. `"api";r=599;t=1`. It tracks the draft, and may change to follow a newer draft without being treated as a breaking change. Do not base retries on it; retry on `Retry-After`. */
    RateLimit: string;
    /** @description Sent whenever `RateLimit` is. Every policy the key is subject to, as IETF draft-11 specifies. It tracks the draft, and may change to follow a newer draft without being treated as a breaking change. */
    "RateLimit-Policy": string;
    /** @description Seconds to wait before retrying (RFC 9110 §10.2.3). Takes precedence over the RateLimit fields. */
    "Retry-After": number;
    /** @description RFC 9110 §11.6.1 and RFC 6750 §3. `Bearer` alone when no credential, or a credential under another scheme, was sent. `Bearer error="invalid_token"` when the credential failed. A `403` `insufficient_scope` carries its own challenge, declared on the `Forbidden` responses. */
    "WWW-Authenticate": string;
    /** @description The path of the created resource (RFC 9110 §15.3.2). */
    Location: string;
    /** @description `true` when this response is a replay of the stored response to an earlier request with the same `Idempotency-Key`; absent on the first response. The resource was not created again. */
    "Idempotent-Replayed": "true";
    /** @description `no-store`: the response carries a secret or a shared report. */
    "Cache-Control": "no-store";
    /** @description The patch formats the resource takes, sent with every `415` to a `PATCH` (RFC 5789 §2.2, §3.1). */
    "Accept-Patch": "application/merge-patch+json, application/json";
    /** @description The methods the path takes, sent with every `405` (RFC 9110 §15.5.6). */
    Allow: string;
    /** @description RFC 9745. Sent by a deprecated operation: the instant the deprecation took or takes effect, as a structured-field date, e.g. `@1688169599`. */
    Deprecation: string;
    /** @description RFC 8594. The HTTP-date after which the operation may stop responding. Never earlier than `Deprecation`; at least 90 days after it. */
    Sunset: string;
    /** @description RFC 8288. On a deprecated operation, carries `rel="deprecation"` pointing at the migration notes (RFC 9745). */
    Link: string;
    /** @description Includes `Authorization`: the response depends on the token. It may also name `Origin`, which the CORS policy adds. */
    Vary: string;
  };
  pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
  getHealth: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK. */
      200: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "status": "ok",
           *       "version": "v0.1.0"
           *     }
           */
          "application/json": components["schemas"]["Health"];
        };
      };
      400: components["responses"]["BadRequest"];
      413: components["responses"]["PayloadTooLarge"];
      414: components["responses"]["UriTooLong"];
      500: components["responses"]["InternalError"];
    };
  };
  headHealth: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK. No body. `Content-Type` and `Content-Length` are those the `GET` response carries. */
      200: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          [name: string]: unknown;
        };
        content?: never;
      };
      400: components["responses"]["BadRequestHead"];
      413: components["responses"]["PayloadTooLargeHead"];
      414: components["responses"]["UriTooLongHead"];
      500: components["responses"]["InternalErrorHead"];
    };
  };
  getProblemType: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /**
         * @description A request-level error code, spelled as a problem document's `code`.
         * @example validation_failed
         */
        code: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Found. `Location` is the code's page on the documentation site. */
      302: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          /** @description The code's page on the documentation site: `https://docs.allisai.ai/errors/` followed by the code. */
          Location: string;
          /** @description The redirect may be cached for a day. It is not permanent, so a client keeps requesting the `type` rather than storing the page's URL. */
          "Cache-Control": "public, max-age=86400";
          [name: string]: unknown;
        };
        content?: never;
      };
      400: components["responses"]["BadRequest"];
      /** @description The path names no error code. */
      404: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "type": "https://api.allisai.ai/errors/not_found",
           *       "title": "The resource was not found",
           *       "status": 404,
           *       "detail": "The path names no error code.",
           *       "code": "not_found",
           *       "request_id": "3a9f6c1e2b7d4e5f8a0b1c2d3e4f5a6b"
           *     }
           */
          "application/problem+json": components["schemas"]["Problem"] & {
            /** @enum {unknown} */
            code?: "not_found";
          };
        };
      };
      413: components["responses"]["PayloadTooLarge"];
      414: components["responses"]["UriTooLong"];
      500: components["responses"]["InternalError"];
    };
  };
  headProblemType: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /**
         * @description A request-level error code, spelled as a problem document's `code`.
         * @example validation_failed
         */
        code: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Found. No body and no `Content-Length`. `Location` is the code's page on the documentation site. */
      302: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          /** @description The code's page on the documentation site: `https://docs.allisai.ai/errors/` followed by the code. */
          Location: string;
          /** @description The redirect may be cached for a day. It is not permanent, so a client keeps requesting the `type` rather than storing the page's URL. */
          "Cache-Control": "public, max-age=86400";
          [name: string]: unknown;
        };
        content?: never;
      };
      400: components["responses"]["BadRequestHead"];
      /** @description The path names no error code. No body and no `Content-Length`. `Content-Type` is `application/problem+json`, as on `GET`, which returns the problem document, whose `code` is `not_found`. */
      404: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          [name: string]: unknown;
        };
        content?: never;
      };
      413: components["responses"]["PayloadTooLargeHead"];
      414: components["responses"]["UriTooLongHead"];
      500: components["responses"]["InternalErrorHead"];
    };
  };
  getSharedReport: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK. */
      200: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          "Cache-Control": components["headers"]["Cache-Control"];
          Vary: components["headers"]["Vary"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "client_name": "Acme Logistics",
           *       "workspace_name": "Northwind AI",
           *       "note": "August was the first full month on the new routing rules.",
           *       "disclosures": [
           *         {
           *           "kind": "unpriced",
           *           "facts": {
           *             "outcome_types": [
           *               {
           *                 "outcome_type": "survey_sent",
           *                 "quantity": 12
           *               }
           *             ],
           *             "outcome_types_omitted": 0
           *           },
           *           "included": true,
           *           "text": null
           *         },
           *         {
           *           "kind": "token_valued",
           *           "facts": {
           *             "events": 220
           *           },
           *           "included": true,
           *           "text": "Model costs for 220 events were valued from token counts at list prices."
           *         }
           *       ],
           *       "period": {
           *         "from": "2026-08-01T00:00:00Z",
           *         "to": "2026-09-01T00:00:00Z"
           *       },
           *       "currency": "JPY",
           *       "minor_units": 0,
           *       "snapshot": {
           *         "snapshot_version": 1,
           *         "currency": "JPY",
           *         "minor_units": 0,
           *         "period": {
           *           "from": "2026-08-01T00:00:00Z",
           *           "to": "2026-09-01T00:00:00Z"
           *         },
           *         "ratios": {
           *           "roi": 3.7943595769682728,
           *           "value_to_cost": 4.794359576968272,
           *           "undefined_reason": null
           *         },
           *         "value": {
           *           "value_model": {
           *             "name": "Acme support value",
           *             "version": 3
           *           },
           *           "lines": [
           *             {
           *               "outcome_type": "ticket_resolved",
           *               "label": "Support ticket resolved autonomously",
           *               "unit_value": 1200,
           *               "events": 340,
           *               "quantity": 340,
           *               "total": 408000,
           *               "provenance_note": "Agreed with Acme ops lead, 2026-07-20: fully loaded cost of a tier-1 ticket."
           *             }
           *           ],
           *           "total": 408000
           *         },
           *         "cost": {
           *           "pass_through": 52000,
           *           "token_valued": 3100,
           *           "manual": 30000,
           *           "total": 85100
           *         }
           *       },
           *       "compared_to": {
           *         "period": {
           *           "from": "2026-07-01T00:00:00Z",
           *           "to": "2026-08-01T00:00:00Z"
           *         },
           *         "value_total": 351600,
           *         "cost_total": 80400,
           *         "roi": 3.373134328358209
           *       }
           *     }
           */
          "application/json": components["schemas"]["PublicReport"];
        };
      };
      400: components["responses"]["BadRequest"];
      /** @description The token is missing, unknown or revoked. */
      404: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          "Cache-Control": components["headers"]["Cache-Control"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "type": "https://api.allisai.ai/errors/not_found",
           *       "title": "The resource was not found",
           *       "status": 404,
           *       "detail": "report not available",
           *       "code": "not_found",
           *       "request_id": "3a9f6c1e2b7d4e5f8a0b1c2d3e4f5a6b"
           *     }
           */
          "application/problem+json": components["schemas"]["Problem"] & {
            /** @enum {unknown} */
            code?: "not_found";
          };
        };
      };
      413: components["responses"]["PayloadTooLarge"];
      414: components["responses"]["UriTooLong"];
      500: components["responses"]["InternalError"];
    };
  };
  ingestEvents: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        /**
         * @example {
         *       "events": [
         *         {
         *           "event_id": "01J9ZQ3K7X8V2M4N6P0R5T1W3Y",
         *           "timestamp": "2026-08-14T03:12:45.5Z",
         *           "agent_key": "support-bot",
         *           "client_key": "acme",
         *           "category": "outcome",
         *           "event_type": "ticket_closed",
         *           "outcome_type": "ticket_resolved",
         *           "quantity": 1
         *         },
         *         {
         *           "timestamp": "2026-08-14T03:12:40Z",
         *           "agent_key": "support-bot",
         *           "client_key": "acme",
         *           "category": "model",
         *           "event_type": "completion",
         *           "model": "gpt-4o",
         *           "tokens_in": 1840,
         *           "tokens_out": 312,
         *           "cost": 0.3683,
         *           "currency": "JPY",
         *           "metadata": {
         *             "ticket": "T-48812"
         *           }
         *         }
         *       ]
         *     }
         */
        "application/json": components["schemas"]["EventBatch"];
      };
    };
    responses: {
      /** @description The batch was processed. Rows that failed are in `errors`. */
      200: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          RateLimit: components["headers"]["RateLimit"];
          "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "accepted": 1,
           *       "duplicates": 0,
           *       "rejected": 1,
           *       "errors": [
           *         {
           *           "index": 1,
           *           "code": "out_of_range",
           *           "pointer": "/events/1/tokens_in",
           *           "detail": "tokens_in must not be negative"
           *         },
           *         {
           *           "index": 1,
           *           "code": "currency_mismatch",
           *           "pointer": "/events/1/currency",
           *           "detail": "currency USD differs from the workspace currency JPY"
           *         }
           *       ],
           *       "errors_truncated": false
           *     }
           */
          "application/json": components["schemas"]["IngestResult"];
        };
      };
      400: components["responses"]["BadRequest"];
      401: components["responses"]["Unauthenticated"];
      403: components["responses"]["ForbiddenKeyOnly"];
      413: components["responses"]["PayloadTooLarge"];
      414: components["responses"]["UriTooLong"];
      415: components["responses"]["UnsupportedMediaType"];
      429: components["responses"]["RateLimited"];
      500: components["responses"]["InternalError"];
    };
  };
  previewImport: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        /**
         * @example {
         *       "mapping": {
         *         "columns": {
         *           "timestamp": "Time",
         *           "agent_key": "Agent",
         *           "client_key": "Client",
         *           "category": "Category",
         *           "event_type": "Type",
         *           "cost": "Cost",
         *           "currency": "Currency"
         *         },
         *         "constants": {},
         *         "timezone": "Asia/Tokyo",
         *         "delimiter": ","
         *       },
         *       "file": "Time,Agent,Client,Category,Type,Cost,Currency\n2026-08-14 12:12:40,support-bot,acme,model,completion,0.3683,JPY\n"
         *     }
         */
        "multipart/form-data": components["schemas"]["ImportUpload"];
      };
    };
    responses: {
      /** @description OK. */
      200: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          RateLimit: components["headers"]["RateLimit"];
          "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "total_rows": 2,
           *       "valid": 1,
           *       "rejected": 1,
           *       "preview": [
           *         {
           *           "row": 2,
           *           "event": {
           *             "event_id": null,
           *             "timestamp": "2026-08-14T03:12:40Z",
           *             "agent_key": "support-bot",
           *             "client_key": "acme",
           *             "category": "model",
           *             "event_type": "completion",
           *             "outcome_type": null,
           *             "quantity": 1,
           *             "cost": 0.3683,
           *             "tokens_in": null,
           *             "tokens_out": null,
           *             "model": null,
           *             "currency": "JPY",
           *             "metadata": null
           *           },
           *           "errors": []
           *         },
           *         {
           *           "row": 3,
           *           "event": null,
           *           "errors": [
           *             {
           *               "row": 3,
           *               "column": "Cost",
           *               "code": "too_precise",
           *               "detail": "cost must have at most 6 decimal places"
           *             },
           *             {
           *               "row": 3,
           *               "column": "Currency",
           *               "code": "currency_mismatch",
           *               "detail": "currency USD differs from the workspace currency JPY"
           *             }
           *           ]
           *         }
           *       ],
           *       "errors": [
           *         {
           *           "row": 3,
           *           "column": "Cost",
           *           "code": "too_precise",
           *           "detail": "cost must have at most 6 decimal places"
           *         },
           *         {
           *           "row": 3,
           *           "column": "Currency",
           *           "code": "currency_mismatch",
           *           "detail": "currency USD differs from the workspace currency JPY"
           *         }
           *       ],
           *       "errors_truncated": false,
           *       "ignored_columns": [
           *         "Notes"
           *       ],
           *       "ignored_columns_omitted": 0,
           *       "timezone_warning": null
           *     }
           */
          "application/json": components["schemas"]["ImportPreview"];
        };
      };
      400: components["responses"]["BadRequest"];
      401: components["responses"]["Unauthenticated"];
      403: components["responses"]["ForbiddenKeyOrSession"];
      413: components["responses"]["PayloadTooLarge"];
      414: components["responses"]["UriTooLong"];
      415: components["responses"]["UnsupportedMediaType"];
      429: components["responses"]["RateLimited"];
      500: components["responses"]["InternalError"];
    };
  };
  commitImport: {
    parameters: {
      query?: never;
      header?: {
        /** @description Optional, sent once. 1 to 255 characters of visible ASCII not starting with `"`, or a structured-field String of 1 to 255 visible ASCII characters; the quoted form `"abc"` is the same key as `abc`. A repeat within 24 hours, in the same workspace, with the same method, path, query, media type and body, replays the stored response with `Idempotent-Replayed: true`; with a different request it is `422` `idempotency_key_reused`; while the first is still running it is `409` `idempotency_key_in_use`. Only `2xx` outcomes are stored. A malformed value, `""` included, or the header sent twice is refused with `invalid_format`, located by `header`. */
        "Idempotency-Key"?: components["parameters"]["IdempotencyKey"];
      };
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        /**
         * @example {
         *       "mapping": {
         *         "columns": {
         *           "timestamp": "Time",
         *           "agent_key": "Agent",
         *           "client_key": "Client",
         *           "category": "Category",
         *           "event_type": "Type",
         *           "cost": "Cost",
         *           "currency": "Currency"
         *         },
         *         "constants": {},
         *         "timezone": "Asia/Tokyo",
         *         "delimiter": ","
         *       },
         *       "file": "Time,Agent,Client,Category,Type,Cost,Currency\n2026-08-14 12:12:40,support-bot,acme,model,completion,0.3683,JPY\n"
         *     }
         */
        "multipart/form-data": components["schemas"]["ImportUpload"];
      };
    };
    responses: {
      /** @description The file was imported. Rows that failed are in `errors`. */
      200: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          RateLimit: components["headers"]["RateLimit"];
          "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
          "Idempotent-Replayed": components["headers"]["Idempotent-Replayed"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "import_batch_id": "9c0d1e2f-3a4b-4c5d-9e6f-708192a3b4c5",
           *       "accepted": 1,
           *       "duplicates": 0,
           *       "rejected": 1,
           *       "errors": [
           *         {
           *           "row": 3,
           *           "column": "Cost",
           *           "code": "too_precise",
           *           "detail": "cost must have at most 6 decimal places"
           *         },
           *         {
           *           "row": 3,
           *           "column": "Currency",
           *           "code": "currency_mismatch",
           *           "detail": "currency USD differs from the workspace currency JPY"
           *         }
           *       ],
           *       "errors_truncated": false
           *     }
           */
          "application/json": components["schemas"]["ImportResult"];
        };
      };
      400: components["responses"]["BadRequest"];
      401: components["responses"]["Unauthenticated"];
      403: components["responses"]["ForbiddenKeyOrSession"];
      /** @description `idempotency_key_in_use`: the request conflicts with the current state. */
      409: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          RateLimit: components["headers"]["RateLimit"];
          "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "type": "https://api.allisai.ai/errors/idempotency_key_in_use",
           *       "title": "A request with this idempotency key is in progress",
           *       "status": 409,
           *       "detail": "Another request with the same `Idempotency-Key` is still running. Retry after it completes.",
           *       "code": "idempotency_key_in_use",
           *       "request_id": "3a9f6c1e2b7d4e5f8a0b1c2d3e4f5a6b"
           *     }
           */
          "application/problem+json": components["schemas"]["Problem"] & {
            /** @enum {unknown} */
            code?: "idempotency_key_in_use";
          };
        };
      };
      413: components["responses"]["PayloadTooLarge"];
      414: components["responses"]["UriTooLong"];
      415: components["responses"]["UnsupportedMediaType"];
      422: components["responses"]["IdempotencyKeyReused"];
      429: components["responses"]["RateLimited"];
      500: components["responses"]["InternalError"];
    };
  };
  listClients: {
    parameters: {
      query?: {
        /** @description Page size, 1 to 200. A value outside the range is refused with `out_of_range`, never clamped. */
        limit?: components["parameters"]["Limit"];
        /** @description `next_cursor` from the previous page. Valid only with the filters and sort it was issued under; otherwise refused with `invalid_value`. An empty value is refused with `invalid_format`, like any empty query parameter. `limit` may change between pages. */
        cursor?: components["parameters"]["Cursor"];
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK. */
      200: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          RateLimit: components["headers"]["RateLimit"];
          "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "data": [
           *         {
           *           "id": "6f1c2d3e-4b5a-4c6d-8e7f-90a1b2c3d4e5",
           *           "name": "Acme Logistics",
           *           "status": "active",
           *           "client_key": "acme",
           *           "renewal_date": "2026-12-31",
           *           "notes": "",
           *           "created_at": "2026-07-14T09:30:00Z"
           *         }
           *       ],
           *       "has_more": false,
           *       "next_cursor": null
           *     }
           */
          "application/json": components["schemas"]["ClientList"];
        };
      };
      400: components["responses"]["BadRequest"];
      401: components["responses"]["Unauthenticated"];
      403: components["responses"]["ForbiddenKeyOrSession"];
      413: components["responses"]["PayloadTooLarge"];
      414: components["responses"]["UriTooLong"];
      429: components["responses"]["RateLimited"];
      500: components["responses"]["InternalError"];
    };
  };
  createClient: {
    parameters: {
      query?: never;
      header?: {
        /** @description Optional, sent once. 1 to 255 characters of visible ASCII not starting with `"`, or a structured-field String of 1 to 255 visible ASCII characters; the quoted form `"abc"` is the same key as `abc`. A repeat within 24 hours, in the same workspace, with the same method, path, query, media type and body, replays the stored response with `Idempotent-Replayed: true`; with a different request it is `422` `idempotency_key_reused`; while the first is still running it is `409` `idempotency_key_in_use`. Only `2xx` outcomes are stored. A malformed value, `""` included, or the header sent twice is refused with `invalid_format`, located by `header`. */
        "Idempotency-Key"?: components["parameters"]["IdempotencyKey"];
      };
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        /**
         * @example {
         *       "name": "Acme Logistics",
         *       "status": "active",
         *       "client_key": "acme",
         *       "renewal_date": "2026-12-31"
         *     }
         */
        "application/json": components["schemas"]["ClientCreate"];
      };
    };
    responses: {
      /** @description Created. */
      201: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          RateLimit: components["headers"]["RateLimit"];
          "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
          "Idempotent-Replayed": components["headers"]["Idempotent-Replayed"];
          Location: components["headers"]["Location"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "id": "6f1c2d3e-4b5a-4c6d-8e7f-90a1b2c3d4e5",
           *       "name": "Acme Logistics",
           *       "status": "active",
           *       "client_key": "acme",
           *       "renewal_date": "2026-12-31",
           *       "notes": "",
           *       "created_at": "2026-07-14T09:30:00Z"
           *     }
           */
          "application/json": components["schemas"]["Client"];
        };
      };
      400: components["responses"]["BadRequest"];
      401: components["responses"]["Unauthenticated"];
      403: components["responses"]["ForbiddenKeyOrSession"];
      /** @description `idempotency_key_in_use`, `client_key_in_use`: the request conflicts with the current state. */
      409: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          RateLimit: components["headers"]["RateLimit"];
          "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "type": "https://api.allisai.ai/errors/client_key_in_use",
           *       "title": "The client key is in use",
           *       "status": 409,
           *       "detail": "Another client in the workspace already has this `client_key`.",
           *       "code": "client_key_in_use",
           *       "request_id": "3a9f6c1e2b7d4e5f8a0b1c2d3e4f5a6b"
           *     }
           */
          "application/problem+json": components["schemas"]["Problem"] & {
            /** @enum {unknown} */
            code?: "idempotency_key_in_use" | "client_key_in_use";
          };
        };
      };
      413: components["responses"]["PayloadTooLarge"];
      414: components["responses"]["UriTooLong"];
      415: components["responses"]["UnsupportedMediaType"];
      422: components["responses"]["IdempotencyKeyReused"];
      429: components["responses"]["RateLimited"];
      500: components["responses"]["InternalError"];
    };
  };
  getClient: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description A resource id, in the RFC 9562 string form in either case. A malformed or unknown id is `404` `not_found`, so the response never reveals whether a resource exists; a spelling such as `{<uuid>}` or `urn:uuid:<uuid>` is malformed. */
        id: components["parameters"]["Id"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK. */
      200: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          RateLimit: components["headers"]["RateLimit"];
          "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "id": "6f1c2d3e-4b5a-4c6d-8e7f-90a1b2c3d4e5",
           *       "name": "Acme Logistics",
           *       "status": "active",
           *       "client_key": "acme",
           *       "renewal_date": "2026-12-31",
           *       "notes": "",
           *       "created_at": "2026-07-14T09:30:00Z",
           *       "agents": [
           *         {
           *           "id": "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
           *           "agent_key": "support-bot",
           *           "name": "Support bot",
           *           "status": "active"
           *         }
           *       ],
           *       "earliest_activity_at": "2026-07-15T02:11:04.25Z"
           *     }
           */
          "application/json": components["schemas"]["ClientDetail"];
        };
      };
      400: components["responses"]["BadRequest"];
      401: components["responses"]["Unauthenticated"];
      403: components["responses"]["ForbiddenKeyOrSession"];
      404: components["responses"]["NotFound"];
      413: components["responses"]["PayloadTooLarge"];
      414: components["responses"]["UriTooLong"];
      429: components["responses"]["RateLimited"];
      500: components["responses"]["InternalError"];
    };
  };
  deleteClient: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description A resource id, in the RFC 9562 string form in either case. A malformed or unknown id is `404` `not_found`, so the response never reveals whether a resource exists; a spelling such as `{<uuid>}` or `urn:uuid:<uuid>` is malformed. */
        id: components["parameters"]["Id"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Deleted. */
      204: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          RateLimit: components["headers"]["RateLimit"];
          "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
          [name: string]: unknown;
        };
        content?: never;
      };
      400: components["responses"]["BadRequest"];
      401: components["responses"]["Unauthenticated"];
      403: components["responses"]["ForbiddenKeyOrSession"];
      404: components["responses"]["NotFound"];
      /** @description `client_has_events`, `client_has_calculations`: the request conflicts with the current state. */
      409: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          RateLimit: components["headers"]["RateLimit"];
          "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
          [name: string]: unknown;
        };
        content: {
          "application/problem+json": components["schemas"]["Problem"] & {
            /** @enum {unknown} */
            code?: "client_has_events" | "client_has_calculations";
          };
        };
      };
      413: components["responses"]["PayloadTooLarge"];
      414: components["responses"]["UriTooLong"];
      429: components["responses"]["RateLimited"];
      500: components["responses"]["InternalError"];
    };
  };
  updateClient: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description A resource id, in the RFC 9562 string form in either case. A malformed or unknown id is `404` `not_found`, so the response never reveals whether a resource exists; a spelling such as `{<uuid>}` or `urn:uuid:<uuid>` is malformed. */
        id: components["parameters"]["Id"];
      };
      cookie?: never;
    };
    /** @description A JSON Merge Patch (RFC 7396). SDKs send `application/merge-patch+json`; `application/json` is accepted and read the same way. */
    requestBody: {
      content: {
        /**
         * @example {
         *       "status": "churned"
         *     }
         */
        "application/merge-patch+json": components["schemas"]["ClientPatch"];
        /**
         * @example {
         *       "status": "churned"
         *     }
         */
        "application/json": components["schemas"]["ClientPatch"];
      };
    };
    responses: {
      /** @description OK. */
      200: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          RateLimit: components["headers"]["RateLimit"];
          "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "id": "6f1c2d3e-4b5a-4c6d-8e7f-90a1b2c3d4e5",
           *       "name": "Acme Logistics",
           *       "status": "churned",
           *       "client_key": "acme",
           *       "renewal_date": "2026-12-31",
           *       "notes": "",
           *       "created_at": "2026-07-14T09:30:00Z"
           *     }
           */
          "application/json": components["schemas"]["Client"];
        };
      };
      400: components["responses"]["BadRequest"];
      401: components["responses"]["Unauthenticated"];
      403: components["responses"]["ForbiddenKeyOrSession"];
      404: components["responses"]["NotFound"];
      /** @description `client_key_in_use`, `client_key_has_events`: the request conflicts with the current state. */
      409: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          RateLimit: components["headers"]["RateLimit"];
          "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "type": "https://api.allisai.ai/errors/client_key_has_events",
           *       "title": "Events reference this client key",
           *       "status": 409,
           *       "detail": "Clearing a `client_key` that events carry would orphan them. Rename it instead.",
           *       "code": "client_key_has_events",
           *       "request_id": "3a9f6c1e2b7d4e5f8a0b1c2d3e4f5a6b"
           *     }
           */
          "application/problem+json": components["schemas"]["Problem"] & {
            /** @enum {unknown} */
            code?: "client_key_in_use" | "client_key_has_events";
          };
        };
      };
      413: components["responses"]["PayloadTooLarge"];
      414: components["responses"]["UriTooLong"];
      415: components["responses"]["UnsupportedMediaTypePatch"];
      429: components["responses"]["RateLimited"];
      500: components["responses"]["InternalError"];
    };
  };
  setClientAgents: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description A resource id, in the RFC 9562 string form in either case. A malformed or unknown id is `404` `not_found`, so the response never reveals whether a resource exists; a spelling such as `{<uuid>}` or `urn:uuid:<uuid>` is malformed. */
        id: components["parameters"]["Id"];
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        /**
         * @example {
         *       "agent_ids": [
         *         "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d"
         *       ]
         *     }
         */
        "application/json": components["schemas"]["ClientAgentsSet"];
      };
    };
    responses: {
      /** @description OK. */
      200: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          RateLimit: components["headers"]["RateLimit"];
          "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "agents": [
           *         {
           *           "id": "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
           *           "agent_key": "support-bot",
           *           "name": "Support bot",
           *           "status": "active"
           *         }
           *       ]
           *     }
           */
          "application/json": components["schemas"]["ClientAgents"];
        };
      };
      400: components["responses"]["BadRequest"];
      401: components["responses"]["Unauthenticated"];
      403: components["responses"]["ForbiddenKeyOrSession"];
      404: components["responses"]["NotFound"];
      413: components["responses"]["PayloadTooLarge"];
      414: components["responses"]["UriTooLong"];
      415: components["responses"]["UnsupportedMediaType"];
      429: components["responses"]["RateLimited"];
      500: components["responses"]["InternalError"];
    };
  };
  getClientValueModel: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description A resource id, in the RFC 9562 string form in either case. A malformed or unknown id is `404` `not_found`, so the response never reveals whether a resource exists; a spelling such as `{<uuid>}` or `urn:uuid:<uuid>` is malformed. */
        id: components["parameters"]["Id"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK. */
      200: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          RateLimit: components["headers"]["RateLimit"];
          "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "id": "3c4d5e6f-7a8b-4c9d-8e0f-2a3b4c5d6e7f",
           *       "client_id": "6f1c2d3e-4b5a-4c6d-8e7f-90a1b2c3d4e5",
           *       "name": "Acme support value",
           *       "status": "active",
           *       "version": 3,
           *       "currency": "JPY",
           *       "created_at": "2026-07-20T01:00:00Z",
           *       "updated_at": "2026-08-02T04:15:00Z",
           *       "line_items": [
           *         {
           *           "id": "4d5e6f7a-8b9c-4d0e-9f1a-3b4c5d6e7f80",
           *           "outcome_type": "ticket_resolved",
           *           "label": "Support ticket resolved autonomously",
           *           "unit_value": 1200,
           *           "provenance_note": "Agreed with Acme ops lead, 2026-07-20: fully loaded cost of a tier-1 ticket.",
           *           "position": 0
           *         },
           *         {
           *           "id": "5d6e7f80-9a0b-4c1d-8e2f-4a5b6c7d8e9f",
           *           "outcome_type": "escalation_avoided",
           *           "label": "Escalation to a human agent avoided",
           *           "unit_value": 450.5,
           *           "provenance_note": "",
           *           "position": 1
           *         }
           *       ]
           *     }
           */
          "application/json": components["schemas"]["ValueModel"];
        };
      };
      400: components["responses"]["BadRequest"];
      401: components["responses"]["Unauthenticated"];
      403: components["responses"]["ForbiddenKeyOrSession"];
      /** @description `not_found`: the client does not exist. `no_active_value_model`: it exists and has no active value model. */
      404: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          RateLimit: components["headers"]["RateLimit"];
          "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "type": "https://api.allisai.ai/errors/no_active_value_model",
           *       "title": "The client has no active value model",
           *       "status": 404,
           *       "detail": "This client has no active value model.",
           *       "code": "no_active_value_model",
           *       "request_id": "3a9f6c1e2b7d4e5f8a0b1c2d3e4f5a6b"
           *     }
           */
          "application/problem+json": components["schemas"]["Problem"] & {
            /** @enum {unknown} */
            code?: "not_found" | "no_active_value_model";
          };
        };
      };
      413: components["responses"]["PayloadTooLarge"];
      414: components["responses"]["UriTooLong"];
      429: components["responses"]["RateLimited"];
      500: components["responses"]["InternalError"];
    };
  };
  createValueModel: {
    parameters: {
      query?: never;
      header?: {
        /** @description Optional, sent once. 1 to 255 characters of visible ASCII not starting with `"`, or a structured-field String of 1 to 255 visible ASCII characters; the quoted form `"abc"` is the same key as `abc`. A repeat within 24 hours, in the same workspace, with the same method, path, query, media type and body, replays the stored response with `Idempotent-Replayed: true`; with a different request it is `422` `idempotency_key_reused`; while the first is still running it is `409` `idempotency_key_in_use`. Only `2xx` outcomes are stored. A malformed value, `""` included, or the header sent twice is refused with `invalid_format`, located by `header`. */
        "Idempotency-Key"?: components["parameters"]["IdempotencyKey"];
      };
      path: {
        /** @description A resource id, in the RFC 9562 string form in either case. A malformed or unknown id is `404` `not_found`, so the response never reveals whether a resource exists; a spelling such as `{<uuid>}` or `urn:uuid:<uuid>` is malformed. */
        id: components["parameters"]["Id"];
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        /**
         * @example {
         *       "name": "Acme support value",
         *       "template_id": "support-automation"
         *     }
         */
        "application/json": components["schemas"]["ValueModelCreate"];
      };
    };
    responses: {
      /** @description Created. `Location` is `/v1/value-models/{id}`. */
      201: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          RateLimit: components["headers"]["RateLimit"];
          "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
          "Idempotent-Replayed": components["headers"]["Idempotent-Replayed"];
          Location: components["headers"]["Location"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "id": "3c4d5e6f-7a8b-4c9d-8e0f-2a3b4c5d6e7f",
           *       "client_id": "6f1c2d3e-4b5a-4c6d-8e7f-90a1b2c3d4e5",
           *       "name": "Acme support value",
           *       "status": "active",
           *       "version": 1,
           *       "currency": "JPY",
           *       "created_at": "2026-07-20T01:00:00Z",
           *       "updated_at": "2026-07-20T01:00:00Z",
           *       "line_items": [
           *         {
           *           "id": "4d5e6f7a-8b9c-4d0e-9f1a-3b4c5d6e7f80",
           *           "outcome_type": "ticket_resolved",
           *           "label": "Support ticket resolved autonomously",
           *           "unit_value": 0,
           *           "provenance_note": "Agree this unit value with the client and record how it was derived.",
           *           "position": 0
           *         }
           *       ]
           *     }
           */
          "application/json": components["schemas"]["ValueModel"];
        };
      };
      400: components["responses"]["BadRequest"];
      401: components["responses"]["Unauthenticated"];
      403: components["responses"]["ForbiddenKeyOrSession"];
      404: components["responses"]["NotFound"];
      /** @description `idempotency_key_in_use`, `value_model_exists`: the request conflicts with the current state. */
      409: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          RateLimit: components["headers"]["RateLimit"];
          "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "type": "https://api.allisai.ai/errors/value_model_exists",
           *       "title": "The client already has an active value model",
           *       "status": 409,
           *       "detail": "Archive the active model before creating another.",
           *       "code": "value_model_exists",
           *       "request_id": "3a9f6c1e2b7d4e5f8a0b1c2d3e4f5a6b"
           *     }
           */
          "application/problem+json": components["schemas"]["Problem"] & {
            /** @enum {unknown} */
            code?: "idempotency_key_in_use" | "value_model_exists";
          };
        };
      };
      413: components["responses"]["PayloadTooLarge"];
      414: components["responses"]["UriTooLong"];
      415: components["responses"]["UnsupportedMediaType"];
      422: components["responses"]["IdempotencyKeyReused"];
      429: components["responses"]["RateLimited"];
      500: components["responses"]["InternalError"];
    };
  };
  deleteValueModel: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description A resource id, in the RFC 9562 string form in either case. A malformed or unknown id is `404` `not_found`, so the response never reveals whether a resource exists; a spelling such as `{<uuid>}` or `urn:uuid:<uuid>` is malformed. */
        id: components["parameters"]["Id"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Deleted. */
      204: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          RateLimit: components["headers"]["RateLimit"];
          "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
          [name: string]: unknown;
        };
        content?: never;
      };
      400: components["responses"]["BadRequest"];
      401: components["responses"]["Unauthenticated"];
      403: components["responses"]["ForbiddenKeyOrSession"];
      /** @description `not_found`: the client does not exist. `no_active_value_model`: it exists and has no active value model. */
      404: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          RateLimit: components["headers"]["RateLimit"];
          "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "type": "https://api.allisai.ai/errors/no_active_value_model",
           *       "title": "The client has no active value model",
           *       "status": 404,
           *       "detail": "This client has no active value model.",
           *       "code": "no_active_value_model",
           *       "request_id": "3a9f6c1e2b7d4e5f8a0b1c2d3e4f5a6b"
           *     }
           */
          "application/problem+json": components["schemas"]["Problem"] & {
            /** @enum {unknown} */
            code?: "not_found" | "no_active_value_model";
          };
        };
      };
      413: components["responses"]["PayloadTooLarge"];
      414: components["responses"]["UriTooLong"];
      429: components["responses"]["RateLimited"];
      500: components["responses"]["InternalError"];
    };
  };
  updateValueModel: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description A resource id, in the RFC 9562 string form in either case. A malformed or unknown id is `404` `not_found`, so the response never reveals whether a resource exists; a spelling such as `{<uuid>}` or `urn:uuid:<uuid>` is malformed. */
        id: components["parameters"]["Id"];
      };
      cookie?: never;
    };
    /** @description A JSON Merge Patch (RFC 7396). SDKs send `application/merge-patch+json`; `application/json` is accepted and read the same way. */
    requestBody: {
      content: {
        /**
         * @example {
         *       "status": "archived"
         *     }
         */
        "application/merge-patch+json": components["schemas"]["ValueModelPatch"];
        /**
         * @example {
         *       "status": "archived"
         *     }
         */
        "application/json": components["schemas"]["ValueModelPatch"];
      };
    };
    responses: {
      /** @description OK. */
      200: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          RateLimit: components["headers"]["RateLimit"];
          "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "id": "3c4d5e6f-7a8b-4c9d-8e0f-2a3b4c5d6e7f",
           *       "client_id": "6f1c2d3e-4b5a-4c6d-8e7f-90a1b2c3d4e5",
           *       "name": "Acme support value",
           *       "status": "archived",
           *       "version": 3,
           *       "currency": "JPY",
           *       "created_at": "2026-07-20T01:00:00Z",
           *       "updated_at": "2026-08-02T04:15:00Z",
           *       "line_items": [
           *         {
           *           "id": "4d5e6f7a-8b9c-4d0e-9f1a-3b4c5d6e7f80",
           *           "outcome_type": "ticket_resolved",
           *           "label": "Support ticket resolved autonomously",
           *           "unit_value": 1200,
           *           "provenance_note": "Agreed with Acme ops lead, 2026-07-20: fully loaded cost of a tier-1 ticket.",
           *           "position": 0
           *         },
           *         {
           *           "id": "5d6e7f80-9a0b-4c1d-8e2f-4a5b6c7d8e9f",
           *           "outcome_type": "escalation_avoided",
           *           "label": "Escalation to a human agent avoided",
           *           "unit_value": 450.5,
           *           "provenance_note": "",
           *           "position": 1
           *         }
           *       ]
           *     }
           */
          "application/json": components["schemas"]["ValueModel"];
        };
      };
      400: components["responses"]["BadRequest"];
      401: components["responses"]["Unauthenticated"];
      403: components["responses"]["ForbiddenKeyOrSession"];
      /** @description `not_found`: the client does not exist. `no_active_value_model`: it exists and has no active value model. */
      404: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          RateLimit: components["headers"]["RateLimit"];
          "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "type": "https://api.allisai.ai/errors/no_active_value_model",
           *       "title": "The client has no active value model",
           *       "status": 404,
           *       "detail": "This client has no active value model.",
           *       "code": "no_active_value_model",
           *       "request_id": "3a9f6c1e2b7d4e5f8a0b1c2d3e4f5a6b"
           *     }
           */
          "application/problem+json": components["schemas"]["Problem"] & {
            /** @enum {unknown} */
            code?: "not_found" | "no_active_value_model";
          };
        };
      };
      413: components["responses"]["PayloadTooLarge"];
      414: components["responses"]["UriTooLong"];
      415: components["responses"]["UnsupportedMediaTypePatch"];
      429: components["responses"]["RateLimited"];
      500: components["responses"]["InternalError"];
    };
  };
  setValueModelLineItems: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description A resource id, in the RFC 9562 string form in either case. A malformed or unknown id is `404` `not_found`, so the response never reveals whether a resource exists; a spelling such as `{<uuid>}` or `urn:uuid:<uuid>` is malformed. */
        id: components["parameters"]["Id"];
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        /**
         * @example {
         *       "version": 3,
         *       "line_items": [
         *         {
         *           "outcome_type": "ticket_resolved",
         *           "label": "Support ticket resolved autonomously",
         *           "unit_value": 1200,
         *           "provenance_note": "Agreed with Acme ops lead, 2026-07-20: fully loaded cost of a tier-1 ticket."
         *         },
         *         {
         *           "outcome_type": "escalation_avoided",
         *           "label": "Escalation to a human agent avoided",
         *           "unit_value": 450.5
         *         }
         *       ]
         *     }
         */
        "application/json": components["schemas"]["ValueLineItemsSet"];
      };
    };
    responses: {
      /** @description OK. */
      200: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          RateLimit: components["headers"]["RateLimit"];
          "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "id": "3c4d5e6f-7a8b-4c9d-8e0f-2a3b4c5d6e7f",
           *       "client_id": "6f1c2d3e-4b5a-4c6d-8e7f-90a1b2c3d4e5",
           *       "name": "Acme support value",
           *       "status": "active",
           *       "version": 4,
           *       "currency": "JPY",
           *       "created_at": "2026-07-20T01:00:00Z",
           *       "updated_at": "2026-08-02T04:15:00Z",
           *       "line_items": [
           *         {
           *           "id": "4d5e6f7a-8b9c-4d0e-9f1a-3b4c5d6e7f80",
           *           "outcome_type": "ticket_resolved",
           *           "label": "Support ticket resolved autonomously",
           *           "unit_value": 1200,
           *           "provenance_note": "Agreed with Acme ops lead, 2026-07-20: fully loaded cost of a tier-1 ticket.",
           *           "position": 0
           *         },
           *         {
           *           "id": "5d6e7f80-9a0b-4c1d-8e2f-4a5b6c7d8e9f",
           *           "outcome_type": "escalation_avoided",
           *           "label": "Escalation to a human agent avoided",
           *           "unit_value": 450.5,
           *           "provenance_note": "",
           *           "position": 1
           *         }
           *       ]
           *     }
           */
          "application/json": components["schemas"]["ValueModel"];
        };
      };
      400: components["responses"]["BadRequest"];
      401: components["responses"]["Unauthenticated"];
      403: components["responses"]["ForbiddenKeyOrSession"];
      /** @description `not_found`: the client does not exist. `no_active_value_model`: it exists and has no active value model. */
      404: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          RateLimit: components["headers"]["RateLimit"];
          "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "type": "https://api.allisai.ai/errors/no_active_value_model",
           *       "title": "The client has no active value model",
           *       "status": 404,
           *       "detail": "This client has no active value model.",
           *       "code": "no_active_value_model",
           *       "request_id": "3a9f6c1e2b7d4e5f8a0b1c2d3e4f5a6b"
           *     }
           */
          "application/problem+json": components["schemas"]["Problem"] & {
            /** @enum {unknown} */
            code?: "not_found" | "no_active_value_model";
          };
        };
      };
      /** @description `value_model_version_stale`: the request conflicts with the current state. */
      409: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          RateLimit: components["headers"]["RateLimit"];
          "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "type": "https://api.allisai.ai/errors/value_model_version_stale",
           *       "title": "The value model changed since it was read",
           *       "status": 409,
           *       "detail": "The `version` sent is not the stored one. Reload the model and reapply the change.",
           *       "code": "value_model_version_stale",
           *       "request_id": "3a9f6c1e2b7d4e5f8a0b1c2d3e4f5a6b"
           *     }
           */
          "application/problem+json": components["schemas"]["Problem"] & {
            /** @enum {unknown} */
            code?: "value_model_version_stale";
          };
        };
      };
      413: components["responses"]["PayloadTooLarge"];
      414: components["responses"]["UriTooLong"];
      415: components["responses"]["UnsupportedMediaType"];
      429: components["responses"]["RateLimited"];
      500: components["responses"]["InternalError"];
    };
  };
  listClientOutcomeTypes: {
    parameters: {
      query?: {
        /**
         * @description Start of a half-open range, inclusive. Absent means unbounded. Must not be after `to`, or it is refused with `out_of_range` on `from`. Each sent bound must be at or after `1900-01-01T00:00:00Z` and before `10000-01-01T00:00:00Z`; otherwise it is refused with `out_of_range` on its own parameter. Digits below a microsecond are dropped before any check. When both bounds are sent, `to` may be at most 731 days after `from`; a longer period is refused with `out_of_range` on `from`.
         * @example 2026-08-01T00:00:00Z
         */
        from?: components["parameters"]["FromOptional"];
        /**
         * @description End of a half-open range, exclusive. Absent means unbounded. Each sent bound must be at or after `1900-01-01T00:00:00Z` and before `10000-01-01T00:00:00Z`; otherwise it is refused with `out_of_range` on its own parameter. Digits below a microsecond are dropped before any check. When both bounds are sent, `to` may be at most 731 days after `from`; a longer period is refused with `out_of_range` on `from`.
         * @example 2026-09-01T00:00:00Z
         */
        to?: components["parameters"]["ToOptional"];
        /** @description Page size, 1 to 200. A value outside the range is refused with `out_of_range`, never clamped. */
        limit?: components["parameters"]["Limit"];
        /** @description `next_cursor` from the previous page. Valid only with the filters and sort it was issued under; otherwise refused with `invalid_value`. An empty value is refused with `invalid_format`, like any empty query parameter. `limit` may change between pages. */
        cursor?: components["parameters"]["Cursor"];
      };
      header?: never;
      path: {
        /** @description A resource id, in the RFC 9562 string form in either case. A malformed or unknown id is `404` `not_found`, so the response never reveals whether a resource exists; a spelling such as `{<uuid>}` or `urn:uuid:<uuid>` is malformed. */
        id: components["parameters"]["Id"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK. */
      200: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          RateLimit: components["headers"]["RateLimit"];
          "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "data": [
           *         {
           *           "outcome_type": "ticket_resolved",
           *           "events": 340,
           *           "quantity": 340,
           *           "priced": true
           *         },
           *         {
           *           "outcome_type": "survey_sent",
           *           "events": 12,
           *           "quantity": 12,
           *           "priced": false
           *         }
           *       ],
           *       "has_more": false,
           *       "next_cursor": null
           *     }
           */
          "application/json": components["schemas"]["OutcomeTypeList"];
        };
      };
      400: components["responses"]["BadRequest"];
      401: components["responses"]["Unauthenticated"];
      403: components["responses"]["ForbiddenKeyOrSession"];
      404: components["responses"]["NotFound"];
      413: components["responses"]["PayloadTooLarge"];
      414: components["responses"]["UriTooLong"];
      429: components["responses"]["RateLimited"];
      500: components["responses"]["InternalError"];
    };
  };
  getClientValue: {
    parameters: {
      query?: {
        /**
         * @description Start of a half-open range, inclusive. Absent means unbounded. Must not be after `to`, or it is refused with `out_of_range` on `from`. Each sent bound must be at or after `1900-01-01T00:00:00Z` and before `10000-01-01T00:00:00Z`; otherwise it is refused with `out_of_range` on its own parameter. Digits below a microsecond are dropped before any check. When both bounds are sent, `to` may be at most 731 days after `from`; a longer period is refused with `out_of_range` on `from`.
         * @example 2026-08-01T00:00:00Z
         */
        from?: components["parameters"]["FromOptional"];
        /**
         * @description End of a half-open range, exclusive. Absent means unbounded. Each sent bound must be at or after `1900-01-01T00:00:00Z` and before `10000-01-01T00:00:00Z`; otherwise it is refused with `out_of_range` on its own parameter. Digits below a microsecond are dropped before any check. When both bounds are sent, `to` may be at most 731 days after `from`; a longer period is refused with `out_of_range` on `from`.
         * @example 2026-09-01T00:00:00Z
         */
        to?: components["parameters"]["ToOptional"];
      };
      header?: never;
      path: {
        /** @description A resource id, in the RFC 9562 string form in either case. A malformed or unknown id is `404` `not_found`, so the response never reveals whether a resource exists; a spelling such as `{<uuid>}` or `urn:uuid:<uuid>` is malformed. */
        id: components["parameters"]["Id"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK. */
      200: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          RateLimit: components["headers"]["RateLimit"];
          "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "client_id": "6f1c2d3e-4b5a-4c6d-8e7f-90a1b2c3d4e5",
           *       "currency": "JPY",
           *       "minor_units": 0,
           *       "period": {
           *         "from": "2026-08-01T00:00:00Z",
           *         "to": "2026-09-01T00:00:00Z"
           *       },
           *       "value_model": {
           *         "id": "3c4d5e6f-7a8b-4c9d-8e0f-2a3b4c5d6e7f",
           *         "name": "Acme support value",
           *         "version": 3
           *       },
           *       "lines": [
           *         {
           *           "outcome_type": "ticket_resolved",
           *           "label": "Support ticket resolved autonomously",
           *           "unit_value": 1200,
           *           "events": 340,
           *           "quantity": 340,
           *           "total": 408000,
           *           "provenance_note": "Agreed with Acme ops lead, 2026-07-20: fully loaded cost of a tier-1 ticket."
           *         }
           *       ],
           *       "total": 408000,
           *       "coverage": {
           *         "unpriced_outcome_types": [
           *           {
           *             "outcome_type": "survey_sent",
           *             "events": 12,
           *             "quantity": 12,
           *             "priced": null
           *           }
           *         ],
           *         "unpriced_outcome_types_omitted": 0,
           *         "unmatched_client_keys": [],
           *         "unmatched_client_keys_omitted": 0,
           *         "unattributable_outcome_events": 0,
           *         "client_key_unset": false,
           *         "line_items_empty": false,
           *         "period_precedes_model": false
           *       }
           *     }
           */
          "application/json": components["schemas"]["ClientValue"];
        };
      };
      400: components["responses"]["BadRequest"];
      401: components["responses"]["Unauthenticated"];
      403: components["responses"]["ForbiddenKeyOrSession"];
      404: components["responses"]["NotFound"];
      413: components["responses"]["PayloadTooLarge"];
      414: components["responses"]["UriTooLong"];
      429: components["responses"]["RateLimited"];
      500: components["responses"]["InternalError"];
    };
  };
  getClientCost: {
    parameters: {
      query: {
        /**
         * @description Start of the period, inclusive. Must not be after `to`, or it is refused with `out_of_range` on `from`. Each sent bound must be at or after `1900-01-01T00:00:00Z` and before `10000-01-01T00:00:00Z`; otherwise it is refused with `out_of_range` on its own parameter. Digits below a microsecond are dropped before any check. When both bounds are sent, `to` may be at most 731 days after `from`; a longer period is refused with `out_of_range` on `from`.
         * @example 2026-08-01T00:00:00Z
         */
        from: components["parameters"]["FromRequired"];
        /**
         * @description End of the period, exclusive. Required: an open period would prorate to the current day, so the figure would change with the day it was read. Each sent bound must be at or after `1900-01-01T00:00:00Z` and before `10000-01-01T00:00:00Z`; otherwise it is refused with `out_of_range` on its own parameter. Digits below a microsecond are dropped before any check. When both bounds are sent, `to` may be at most 731 days after `from`; a longer period is refused with `out_of_range` on `from`.
         * @example 2026-09-01T00:00:00Z
         */
        to: components["parameters"]["ToRequired"];
      };
      header?: never;
      path: {
        /** @description A resource id, in the RFC 9562 string form in either case. A malformed or unknown id is `404` `not_found`, so the response never reveals whether a resource exists; a spelling such as `{<uuid>}` or `urn:uuid:<uuid>` is malformed. */
        id: components["parameters"]["Id"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK. */
      200: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          RateLimit: components["headers"]["RateLimit"];
          "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "client_id": "6f1c2d3e-4b5a-4c6d-8e7f-90a1b2c3d4e5",
           *       "currency": "JPY",
           *       "minor_units": 0,
           *       "period": {
           *         "from": "2026-08-01T00:00:00Z",
           *         "to": "2026-09-01T00:00:00Z"
           *       },
           *       "pass_through": 52000,
           *       "token_valued": 3100,
           *       "manual": 30000,
           *       "total": 85100,
           *       "manual_lines": [
           *         {
           *           "id": "5e6f7a8b-9c0d-4e1f-8a2b-4c5d6e7f8091",
           *           "label": "Hosting",
           *           "target": {
           *             "kind": "client",
           *             "id": "6f1c2d3e-4b5a-4c6d-8e7f-90a1b2c3d4e5",
           *             "name": "Acme Logistics"
           *           },
           *           "monthly_amount": 30000,
           *           "covered_days": 31,
           *           "total": 30000
           *         }
           *       ],
           *       "manual_lines_omitted": 0,
           *       "token_lines": [
           *         {
           *           "model": "gpt-4o",
           *           "events": 220,
           *           "tokens_in": 410000,
           *           "tokens_out": 95000,
           *           "in_rate": 0.375,
           *           "out_rate": 1.5,
           *           "total": 3100
           *         }
           *       ],
           *       "agent_lines": [
           *         {
           *           "agent_id": "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
           *           "agent_name": "Support bot",
           *           "pass_through": 52000,
           *           "token_valued": 3100,
           *           "manual": 0,
           *           "total": 55100
           *         }
           *       ],
           *       "agent_lines_omitted": 0,
           *       "coverage": {
           *         "uncosted_model_events": 220,
           *         "unpriceable_models": [],
           *         "unpriceable_models_omitted": 0,
           *         "token_valued_events": 220,
           *         "unattributed_line_items": [],
           *         "unattributed_line_items_omitted": 0,
           *         "partially_covered_line_items": [],
           *         "partially_covered_line_items_omitted": 0,
           *         "prorated_through": "2026-08-31",
           *         "period_truncated": false
           *       }
           *     }
           */
          "application/json": components["schemas"]["ClientCost"];
        };
      };
      400: components["responses"]["BadRequest"];
      401: components["responses"]["Unauthenticated"];
      403: components["responses"]["ForbiddenKeyOrSession"];
      404: components["responses"]["NotFound"];
      413: components["responses"]["PayloadTooLarge"];
      414: components["responses"]["UriTooLong"];
      429: components["responses"]["RateLimited"];
      500: components["responses"]["InternalError"];
    };
  };
  getClientRoi: {
    parameters: {
      query: {
        /**
         * @description Start of the period, inclusive. Must not be after `to`, or it is refused with `out_of_range` on `from`. Each sent bound must be at or after `1900-01-01T00:00:00Z` and before `10000-01-01T00:00:00Z`; otherwise it is refused with `out_of_range` on its own parameter. Digits below a microsecond are dropped before any check. When both bounds are sent, `to` may be at most 731 days after `from`; a longer period is refused with `out_of_range` on `from`.
         * @example 2026-08-01T00:00:00Z
         */
        from: components["parameters"]["FromRequired"];
        /**
         * @description End of the period, exclusive. Required: an open period would prorate to the current day, so the figure would change with the day it was read. Each sent bound must be at or after `1900-01-01T00:00:00Z` and before `10000-01-01T00:00:00Z`; otherwise it is refused with `out_of_range` on its own parameter. Digits below a microsecond are dropped before any check. When both bounds are sent, `to` may be at most 731 days after `from`; a longer period is refused with `out_of_range` on `from`.
         * @example 2026-09-01T00:00:00Z
         */
        to: components["parameters"]["ToRequired"];
      };
      header?: never;
      path: {
        /** @description A resource id, in the RFC 9562 string form in either case. A malformed or unknown id is `404` `not_found`, so the response never reveals whether a resource exists; a spelling such as `{<uuid>}` or `urn:uuid:<uuid>` is malformed. */
        id: components["parameters"]["Id"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK. */
      200: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          RateLimit: components["headers"]["RateLimit"];
          "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "client_id": "6f1c2d3e-4b5a-4c6d-8e7f-90a1b2c3d4e5",
           *       "currency": "JPY",
           *       "minor_units": 0,
           *       "period": {
           *         "from": "2026-08-01T00:00:00Z",
           *         "to": "2026-09-01T00:00:00Z"
           *       },
           *       "ratios": {
           *         "roi": 3.7943595769682728,
           *         "value_to_cost": 4.794359576968272,
           *         "undefined_reason": null
           *       },
           *       "value": {
           *         "value_model": {
           *           "id": "3c4d5e6f-7a8b-4c9d-8e0f-2a3b4c5d6e7f",
           *           "name": "Acme support value",
           *           "version": 3
           *         },
           *         "lines": [
           *           {
           *             "outcome_type": "ticket_resolved",
           *             "label": "Support ticket resolved autonomously",
           *             "unit_value": 1200,
           *             "events": 340,
           *             "quantity": 340,
           *             "total": 408000,
           *             "provenance_note": "Agreed with Acme ops lead, 2026-07-20: fully loaded cost of a tier-1 ticket."
           *           }
           *         ],
           *         "total": 408000,
           *         "coverage": {
           *           "unpriced_outcome_types": [
           *             {
           *               "outcome_type": "survey_sent",
           *               "events": 12,
           *               "quantity": 12,
           *               "priced": null
           *             }
           *           ],
           *           "unpriced_outcome_types_omitted": 0,
           *           "unmatched_client_keys": [],
           *           "unmatched_client_keys_omitted": 0,
           *           "unattributable_outcome_events": 0,
           *           "client_key_unset": false,
           *           "line_items_empty": false,
           *           "period_precedes_model": false
           *         }
           *       },
           *       "cost": {
           *         "pass_through": 52000,
           *         "token_valued": 3100,
           *         "manual": 30000,
           *         "total": 85100,
           *         "manual_lines": [
           *           {
           *             "id": "5e6f7a8b-9c0d-4e1f-8a2b-4c5d6e7f8091",
           *             "label": "Hosting",
           *             "target": {
           *               "kind": "client",
           *               "id": "6f1c2d3e-4b5a-4c6d-8e7f-90a1b2c3d4e5",
           *               "name": "Acme Logistics"
           *             },
           *             "monthly_amount": 30000,
           *             "covered_days": 31,
           *             "total": 30000
           *           }
           *         ],
           *         "manual_lines_omitted": 0,
           *         "token_lines": [
           *           {
           *             "model": "gpt-4o",
           *             "events": 220,
           *             "tokens_in": 410000,
           *             "tokens_out": 95000,
           *             "in_rate": 0.375,
           *             "out_rate": 1.5,
           *             "total": 3100
           *           }
           *         ],
           *         "agent_lines": [
           *           {
           *             "agent_id": "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
           *             "agent_name": "Support bot",
           *             "pass_through": 52000,
           *             "token_valued": 3100,
           *             "manual": 0,
           *             "total": 55100
           *           }
           *         ],
           *         "agent_lines_omitted": 0,
           *         "coverage": {
           *           "uncosted_model_events": 220,
           *           "unpriceable_models": [],
           *           "unpriceable_models_omitted": 0,
           *           "token_valued_events": 220,
           *           "unattributed_line_items": [],
           *           "unattributed_line_items_omitted": 0,
           *           "partially_covered_line_items": [],
           *           "partially_covered_line_items_omitted": 0,
           *           "prorated_through": "2026-08-31",
           *           "period_truncated": false
           *         }
           *       }
           *     }
           */
          "application/json": components["schemas"]["RoiResult"];
        };
      };
      400: components["responses"]["BadRequest"];
      401: components["responses"]["Unauthenticated"];
      403: components["responses"]["ForbiddenKeyOrSession"];
      404: components["responses"]["NotFound"];
      413: components["responses"]["PayloadTooLarge"];
      414: components["responses"]["UriTooLong"];
      429: components["responses"]["RateLimited"];
      500: components["responses"]["InternalError"];
    };
  };
  listClientEvents: {
    parameters: {
      query: {
        /**
         * @description Start of the period, inclusive. Must not be after `to`, or it is refused with `out_of_range` on `from`. Each sent bound must be at or after `1900-01-01T00:00:00Z` and before `10000-01-01T00:00:00Z`; otherwise it is refused with `out_of_range` on its own parameter. Digits below a microsecond are dropped before any check. When both bounds are sent, `to` may be at most 731 days after `from`; a longer period is refused with `out_of_range` on `from`.
         * @example 2026-08-01T00:00:00Z
         */
        from: components["parameters"]["FromRequired"];
        /**
         * @description End of the period, exclusive. Required: an open period would prorate to the current day, so the figure would change with the day it was read. Each sent bound must be at or after `1900-01-01T00:00:00Z` and before `10000-01-01T00:00:00Z`; otherwise it is refused with `out_of_range` on its own parameter. Digits below a microsecond are dropped before any check. When both bounds are sent, `to` may be at most 731 days after `from`; a longer period is refused with `out_of_range` on `from`.
         * @example 2026-09-01T00:00:00Z
         */
        to: components["parameters"]["ToRequired"];
        /** @description Only events of this category. */
        category?: components["schemas"]["EventCategory"];
        /** @description Only events with this outcome type. An empty value, or one with leading or trailing whitespace, is refused with `invalid_format`. */
        outcome_type?: string;
        /** @description Only events from this agent. An id in any spelling but the RFC 9562 string form is refused with `invalid_format`. */
        agent_id?: components["schemas"]["UuidInput"];
        /** @description Sort key. `timestamp` and `cost` default to descending; `agent_name`, `attributed_by` and `source` to ascending. `attributed_by` sorts events that carried a client key apart from those attributed by solo-agent assignment. `cost` puts events without a cost last in both directions. */
        sort?: "timestamp" | "cost" | "agent_name" | "attributed_by" | "source";
        /** @description Sort direction. Absent means the sort key's default. */
        dir?: "asc" | "desc";
        /** @description Page size, 1 to 200. A value outside the range is refused with `out_of_range`, never clamped. */
        limit?: components["parameters"]["Limit"];
        /** @description `next_cursor` from the previous page. Valid only with the filters and sort it was issued under; otherwise refused with `invalid_value`. An empty value is refused with `invalid_format`, like any empty query parameter. `limit` may change between pages. */
        cursor?: components["parameters"]["Cursor"];
        /** @description Page number, from 1: the offset `(page − 1) × limit`. Not with `cursor`: both together are refused with `mutually_exclusive` on `cursor`. The offset must not exceed 10,000,000, the most a cursor holds; a larger one is refused with `out_of_range` on `page`. A page whose next offset would exceed 10,000,000 has `has_more` false and a null `next_cursor`, even if rows remain. */
        page?: number;
      };
      header?: never;
      path: {
        /** @description A resource id, in the RFC 9562 string form in either case. A malformed or unknown id is `404` `not_found`, so the response never reveals whether a resource exists; a spelling such as `{<uuid>}` or `urn:uuid:<uuid>` is malformed. */
        id: components["parameters"]["Id"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK. */
      200: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          RateLimit: components["headers"]["RateLimit"];
          "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "client_id": "6f1c2d3e-4b5a-4c6d-8e7f-90a1b2c3d4e5",
           *       "period": {
           *         "from": "2026-08-01T00:00:00Z",
           *         "to": "2026-09-01T00:00:00Z"
           *       },
           *       "currency": "JPY",
           *       "page": 1,
           *       "total": 2,
           *       "data": [
           *         {
           *           "id": "9007199254740993",
           *           "timestamp": "2026-08-14T03:12:45.5Z",
           *           "agent_id": "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
           *           "agent_name": "Support bot",
           *           "category": "outcome",
           *           "event_type": "ticket_closed",
           *           "outcome_type": "ticket_resolved",
           *           "quantity": 1,
           *           "cost": null,
           *           "tokens_in": null,
           *           "tokens_out": null,
           *           "model": null,
           *           "client_key": "acme",
           *           "source": "api"
           *         },
           *         {
           *           "id": "9007199254740992",
           *           "timestamp": "2026-08-14T03:12:40Z",
           *           "agent_id": "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
           *           "agent_name": "Support bot",
           *           "category": "model",
           *           "event_type": "completion",
           *           "outcome_type": null,
           *           "quantity": 1,
           *           "cost": 0.3683,
           *           "tokens_in": 1840,
           *           "tokens_out": 312,
           *           "model": "gpt-4o",
           *           "client_key": null,
           *           "source": "csv"
           *         }
           *       ],
           *       "has_more": false,
           *       "next_cursor": null
           *     }
           */
          "application/json": components["schemas"]["ClientEventList"];
        };
      };
      400: components["responses"]["BadRequest"];
      401: components["responses"]["Unauthenticated"];
      403: components["responses"]["ForbiddenKeyOrSession"];
      404: components["responses"]["NotFound"];
      413: components["responses"]["PayloadTooLarge"];
      414: components["responses"]["UriTooLong"];
      429: components["responses"]["RateLimited"];
      500: components["responses"]["InternalError"];
    };
  };
  listClientCalculations: {
    parameters: {
      query?: {
        /** @description Page size, 1 to 200. A value outside the range is refused with `out_of_range`, never clamped. */
        limit?: components["parameters"]["Limit"];
        /** @description `next_cursor` from the previous page. Valid only with the filters and sort it was issued under; otherwise refused with `invalid_value`. An empty value is refused with `invalid_format`, like any empty query parameter. `limit` may change between pages. */
        cursor?: components["parameters"]["Cursor"];
      };
      header?: never;
      path: {
        /** @description A resource id, in the RFC 9562 string form in either case. A malformed or unknown id is `404` `not_found`, so the response never reveals whether a resource exists; a spelling such as `{<uuid>}` or `urn:uuid:<uuid>` is malformed. */
        id: components["parameters"]["Id"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK. */
      200: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          RateLimit: components["headers"]["RateLimit"];
          "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "data": [
           *         {
           *           "id": "7a8b9c0d-1e2f-4a3b-9c4d-5e6f708192a3",
           *           "client_id": "6f1c2d3e-4b5a-4c6d-8e7f-90a1b2c3d4e5",
           *           "state": "published",
           *           "period": {
           *             "from": "2026-08-01T00:00:00Z",
           *             "to": "2026-09-01T00:00:00Z"
           *           },
           *           "currency": "JPY",
           *           "minor_units": 0,
           *           "value_total": 408000,
           *           "cost_total": 85100,
           *           "ratios": {
           *             "roi": 3.7943595769682728,
           *             "value_to_cost": 4.794359576968272,
           *             "undefined_reason": null
           *           },
           *           "checklist": {
           *             "coverage_confirmed": true,
           *             "counts_spot_checked": true,
           *             "costs_reviewed": true,
           *             "unit_values_current": true,
           *             "note": "Spot-checked 20 tickets against the helpdesk export."
           *           },
           *           "created_at": "2026-09-02T00:10:00Z",
           *           "validated_at": "2026-09-02T00:40:00Z",
           *           "published_at": "2026-09-02T00:45:00Z",
           *           "is_current": true
           *         }
           *       ],
           *       "has_more": false,
           *       "next_cursor": null
           *     }
           */
          "application/json": components["schemas"]["CalculationList"];
        };
      };
      400: components["responses"]["BadRequest"];
      401: components["responses"]["Unauthenticated"];
      403: components["responses"]["ForbiddenKeyOrSession"];
      404: components["responses"]["NotFound"];
      413: components["responses"]["PayloadTooLarge"];
      414: components["responses"]["UriTooLong"];
      429: components["responses"]["RateLimited"];
      500: components["responses"]["InternalError"];
    };
  };
  createCalculation: {
    parameters: {
      query?: never;
      header?: {
        /** @description Optional, sent once. 1 to 255 characters of visible ASCII not starting with `"`, or a structured-field String of 1 to 255 visible ASCII characters; the quoted form `"abc"` is the same key as `abc`. A repeat within 24 hours, in the same workspace, with the same method, path, query, media type and body, replays the stored response with `Idempotent-Replayed: true`; with a different request it is `422` `idempotency_key_reused`; while the first is still running it is `409` `idempotency_key_in_use`. Only `2xx` outcomes are stored. A malformed value, `""` included, or the header sent twice is refused with `invalid_format`, located by `header`. */
        "Idempotency-Key"?: components["parameters"]["IdempotencyKey"];
      };
      path: {
        /** @description A resource id, in the RFC 9562 string form in either case. A malformed or unknown id is `404` `not_found`, so the response never reveals whether a resource exists; a spelling such as `{<uuid>}` or `urn:uuid:<uuid>` is malformed. */
        id: components["parameters"]["Id"];
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        /**
         * @example {
         *       "period": {
         *         "from": "2026-08-01T00:00:00Z",
         *         "to": "2026-09-01T00:00:00Z"
         *       }
         *     }
         */
        "application/json": components["schemas"]["CalculationCreate"];
      };
    };
    responses: {
      /** @description Created as a draft. */
      201: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          RateLimit: components["headers"]["RateLimit"];
          "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
          "Idempotent-Replayed": components["headers"]["Idempotent-Replayed"];
          Location: components["headers"]["Location"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "id": "7a8b9c0d-1e2f-4a3b-9c4d-5e6f708192a3",
           *       "client_id": "6f1c2d3e-4b5a-4c6d-8e7f-90a1b2c3d4e5",
           *       "state": "draft",
           *       "period": {
           *         "from": "2026-08-01T00:00:00Z",
           *         "to": "2026-09-01T00:00:00Z"
           *       },
           *       "currency": "JPY",
           *       "minor_units": 0,
           *       "value_total": 408000,
           *       "cost_total": 85100,
           *       "ratios": {
           *         "roi": 3.7943595769682728,
           *         "value_to_cost": 4.794359576968272,
           *         "undefined_reason": null
           *       },
           *       "checklist": {
           *         "coverage_confirmed": false,
           *         "counts_spot_checked": false,
           *         "costs_reviewed": false,
           *         "unit_values_current": false,
           *         "note": ""
           *       },
           *       "created_at": "2026-09-02T00:10:00Z",
           *       "validated_at": null,
           *       "published_at": null,
           *       "snapshot": {
           *         "snapshot_version": 1,
           *         "client_id": "6f1c2d3e-4b5a-4c6d-8e7f-90a1b2c3d4e5",
           *         "currency": "JPY",
           *         "minor_units": 0,
           *         "period": {
           *           "from": "2026-08-01T00:00:00Z",
           *           "to": "2026-09-01T00:00:00Z"
           *         },
           *         "ratios": {
           *           "roi": 3.7943595769682728,
           *           "value_to_cost": 4.794359576968272,
           *           "undefined_reason": null
           *         },
           *         "value": {
           *           "value_model": {
           *             "id": "3c4d5e6f-7a8b-4c9d-8e0f-2a3b4c5d6e7f",
           *             "name": "Acme support value",
           *             "version": 3
           *           },
           *           "lines": [
           *             {
           *               "outcome_type": "ticket_resolved",
           *               "label": "Support ticket resolved autonomously",
           *               "unit_value": 1200,
           *               "events": 340,
           *               "quantity": 340,
           *               "total": 408000,
           *               "provenance_note": "Agreed with Acme ops lead, 2026-07-20: fully loaded cost of a tier-1 ticket."
           *             }
           *           ],
           *           "total": 408000,
           *           "coverage": {
           *             "unpriced_outcome_types": [
           *               {
           *                 "outcome_type": "survey_sent",
           *                 "events": 12,
           *                 "quantity": 12,
           *                 "priced": null
           *               }
           *             ],
           *             "unpriced_outcome_types_omitted": 0,
           *             "unmatched_client_keys": [],
           *             "unmatched_client_keys_omitted": 0,
           *             "unattributable_outcome_events": 0,
           *             "client_key_unset": false,
           *             "line_items_empty": false,
           *             "period_precedes_model": false
           *           }
           *         },
           *         "cost": {
           *           "pass_through": 52000,
           *           "token_valued": 3100,
           *           "manual": 30000,
           *           "total": 85100,
           *           "manual_lines": [
           *             {
           *               "id": "5e6f7a8b-9c0d-4e1f-8a2b-4c5d6e7f8091",
           *               "label": "Hosting",
           *               "target": {
           *                 "kind": "client",
           *                 "id": "6f1c2d3e-4b5a-4c6d-8e7f-90a1b2c3d4e5",
           *                 "name": "Acme Logistics"
           *               },
           *               "monthly_amount": 30000,
           *               "covered_days": 31,
           *               "total": 30000
           *             }
           *           ],
           *           "manual_lines_omitted": 0,
           *           "token_lines": [
           *             {
           *               "model": "gpt-4o",
           *               "events": 220,
           *               "tokens_in": 410000,
           *               "tokens_out": 95000,
           *               "in_rate": 0.375,
           *               "out_rate": 1.5,
           *               "total": 3100
           *             }
           *           ],
           *           "agent_lines": [
           *             {
           *               "agent_id": "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
           *               "agent_name": "Support bot",
           *               "pass_through": 52000,
           *               "token_valued": 3100,
           *               "manual": 0,
           *               "total": 55100
           *             }
           *           ],
           *           "agent_lines_omitted": 0,
           *           "coverage": {
           *             "uncosted_model_events": 220,
           *             "unpriceable_models": [],
           *             "unpriceable_models_omitted": 0,
           *             "token_valued_events": 220,
           *             "unattributed_line_items": [],
           *             "unattributed_line_items_omitted": 0,
           *             "partially_covered_line_items": [],
           *             "partially_covered_line_items_omitted": 0,
           *             "prorated_through": "2026-08-31",
           *             "period_truncated": false
           *           }
           *         }
           *       }
           *     }
           */
          "application/json": components["schemas"]["Calculation"];
        };
      };
      400: components["responses"]["BadRequest"];
      401: components["responses"]["Unauthenticated"];
      403: components["responses"]["ForbiddenKeyOrSession"];
      404: components["responses"]["NotFound"];
      /** @description `idempotency_key_in_use`: the request conflicts with the current state. */
      409: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          RateLimit: components["headers"]["RateLimit"];
          "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "type": "https://api.allisai.ai/errors/idempotency_key_in_use",
           *       "title": "A request with this idempotency key is in progress",
           *       "status": 409,
           *       "detail": "Another request with the same `Idempotency-Key` is still running. Retry after it completes.",
           *       "code": "idempotency_key_in_use",
           *       "request_id": "3a9f6c1e2b7d4e5f8a0b1c2d3e4f5a6b"
           *     }
           */
          "application/problem+json": components["schemas"]["Problem"] & {
            /** @enum {unknown} */
            code?: "idempotency_key_in_use";
          };
        };
      };
      413: components["responses"]["PayloadTooLarge"];
      414: components["responses"]["UriTooLong"];
      415: components["responses"]["UnsupportedMediaType"];
      422: components["responses"]["IdempotencyKeyReused"];
      429: components["responses"]["RateLimited"];
      500: components["responses"]["InternalError"];
    };
  };
  getClientAnomalies: {
    parameters: {
      query: {
        /**
         * @description Start of the period, inclusive. Must not be after `to`, or it is refused with `out_of_range` on `from`. Each sent bound must be at or after `1900-01-01T00:00:00Z` and before `10000-01-01T00:00:00Z`; otherwise it is refused with `out_of_range` on its own parameter. Digits below a microsecond are dropped before any check. When both bounds are sent, `to` may be at most 731 days after `from`; a longer period is refused with `out_of_range` on `from`.
         * @example 2026-08-01T00:00:00Z
         */
        from: components["parameters"]["FromRequired"];
        /**
         * @description End of the period, exclusive. Required: an open period would prorate to the current day, so the figure would change with the day it was read. Each sent bound must be at or after `1900-01-01T00:00:00Z` and before `10000-01-01T00:00:00Z`; otherwise it is refused with `out_of_range` on its own parameter. Digits below a microsecond are dropped before any check. When both bounds are sent, `to` may be at most 731 days after `from`; a longer period is refused with `out_of_range` on `from`.
         * @example 2026-09-01T00:00:00Z
         */
        to: components["parameters"]["ToRequired"];
      };
      header?: never;
      path: {
        /** @description A resource id, in the RFC 9562 string form in either case. A malformed or unknown id is `404` `not_found`, so the response never reveals whether a resource exists; a spelling such as `{<uuid>}` or `urn:uuid:<uuid>` is malformed. */
        id: components["parameters"]["Id"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK. */
      200: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          RateLimit: components["headers"]["RateLimit"];
          "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "client_id": "6f1c2d3e-4b5a-4c6d-8e7f-90a1b2c3d4e5",
           *       "period": {
           *         "from": "2026-08-01T00:00:00Z",
           *         "to": "2026-09-01T00:00:00Z"
           *       },
           *       "currency": "JPY",
           *       "minor_units": 0,
           *       "zero_outcome_days": [
           *         "2026-08-15",
           *         "2026-08-16"
           *       ],
           *       "cost_spikes": [
           *         {
           *           "date": "2026-08-21",
           *           "cost": 9800,
           *           "baseline": 1650
           *         }
           *       ],
           *       "unmapped_outcome_types": [
           *         {
           *           "outcome_type": "survey_sent",
           *           "events": 12,
           *           "quantity": 12
           *         }
           *       ],
           *       "unmapped_outcome_types_omitted": 0
           *     }
           */
          "application/json": components["schemas"]["Anomalies"];
        };
      };
      400: components["responses"]["BadRequest"];
      401: components["responses"]["Unauthenticated"];
      403: components["responses"]["ForbiddenKeyOrSession"];
      404: components["responses"]["NotFound"];
      413: components["responses"]["PayloadTooLarge"];
      414: components["responses"]["UriTooLong"];
      429: components["responses"]["RateLimited"];
      500: components["responses"]["InternalError"];
    };
  };
  listAgents: {
    parameters: {
      query?: {
        /** @description Page size, 1 to 200. A value outside the range is refused with `out_of_range`, never clamped. */
        limit?: components["parameters"]["Limit"];
        /** @description `next_cursor` from the previous page. Valid only with the filters and sort it was issued under; otherwise refused with `invalid_value`. An empty value is refused with `invalid_format`, like any empty query parameter. `limit` may change between pages. */
        cursor?: components["parameters"]["Cursor"];
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK. */
      200: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          RateLimit: components["headers"]["RateLimit"];
          "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "data": [
           *         {
           *           "id": "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
           *           "agent_key": "support-bot",
           *           "name": "Support bot",
           *           "framework": "LangGraph",
           *           "version": "1.4.0",
           *           "status": "active",
           *           "created_at": "2026-07-14T09:31:00Z",
           *           "client_count": 1
           *         }
           *       ],
           *       "has_more": true,
           *       "next_cursor": "eyJ2IjoxLCJmIjoiOWMxZTJiN2Q0ZTVmOGEwYiIsIm8iOjEwMH0"
           *     }
           */
          "application/json": components["schemas"]["AgentList"];
        };
      };
      400: components["responses"]["BadRequest"];
      401: components["responses"]["Unauthenticated"];
      403: components["responses"]["ForbiddenKeyOrSession"];
      413: components["responses"]["PayloadTooLarge"];
      414: components["responses"]["UriTooLong"];
      429: components["responses"]["RateLimited"];
      500: components["responses"]["InternalError"];
    };
  };
  createAgent: {
    parameters: {
      query?: never;
      header?: {
        /** @description Optional, sent once. 1 to 255 characters of visible ASCII not starting with `"`, or a structured-field String of 1 to 255 visible ASCII characters; the quoted form `"abc"` is the same key as `abc`. A repeat within 24 hours, in the same workspace, with the same method, path, query, media type and body, replays the stored response with `Idempotent-Replayed: true`; with a different request it is `422` `idempotency_key_reused`; while the first is still running it is `409` `idempotency_key_in_use`. Only `2xx` outcomes are stored. A malformed value, `""` included, or the header sent twice is refused with `invalid_format`, located by `header`. */
        "Idempotency-Key"?: components["parameters"]["IdempotencyKey"];
      };
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        /**
         * @example {
         *       "agent_key": "support-bot",
         *       "name": "Support bot",
         *       "framework": "LangGraph",
         *       "version": "1.4.0",
         *       "status": "active"
         *     }
         */
        "application/json": components["schemas"]["AgentCreate"];
      };
    };
    responses: {
      /** @description Created. */
      201: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          RateLimit: components["headers"]["RateLimit"];
          "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
          "Idempotent-Replayed": components["headers"]["Idempotent-Replayed"];
          Location: components["headers"]["Location"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "id": "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
           *       "agent_key": "support-bot",
           *       "name": "Support bot",
           *       "framework": "LangGraph",
           *       "version": "1.4.0",
           *       "status": "active",
           *       "created_at": "2026-07-14T09:31:00Z"
           *     }
           */
          "application/json": components["schemas"]["Agent"];
        };
      };
      400: components["responses"]["BadRequest"];
      401: components["responses"]["Unauthenticated"];
      403: components["responses"]["ForbiddenKeyOrSession"];
      /** @description `idempotency_key_in_use`, `agent_key_in_use`: the request conflicts with the current state. */
      409: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          RateLimit: components["headers"]["RateLimit"];
          "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "type": "https://api.allisai.ai/errors/agent_key_in_use",
           *       "title": "The agent key is in use",
           *       "status": 409,
           *       "detail": "Another agent in the workspace already has this `agent_key`.",
           *       "code": "agent_key_in_use",
           *       "request_id": "3a9f6c1e2b7d4e5f8a0b1c2d3e4f5a6b"
           *     }
           */
          "application/problem+json": components["schemas"]["Problem"] & {
            /** @enum {unknown} */
            code?: "idempotency_key_in_use" | "agent_key_in_use";
          };
        };
      };
      413: components["responses"]["PayloadTooLarge"];
      414: components["responses"]["UriTooLong"];
      415: components["responses"]["UnsupportedMediaType"];
      422: components["responses"]["IdempotencyKeyReused"];
      429: components["responses"]["RateLimited"];
      500: components["responses"]["InternalError"];
    };
  };
  getAgent: {
    parameters: {
      query?: {
        /**
         * @description Start of a half-open range, inclusive. Absent means unbounded. Must not be after `to`, or it is refused with `out_of_range` on `from`. Each sent bound must be at or after `1900-01-01T00:00:00Z` and before `10000-01-01T00:00:00Z`; otherwise it is refused with `out_of_range` on its own parameter. Digits below a microsecond are dropped before any check. When both bounds are sent, `to` may be at most 731 days after `from`; a longer period is refused with `out_of_range` on `from`.
         * @example 2026-08-01T00:00:00Z
         */
        from?: components["parameters"]["FromOptional"];
        /**
         * @description End of a half-open range, exclusive. Absent means unbounded. Each sent bound must be at or after `1900-01-01T00:00:00Z` and before `10000-01-01T00:00:00Z`; otherwise it is refused with `out_of_range` on its own parameter. Digits below a microsecond are dropped before any check. When both bounds are sent, `to` may be at most 731 days after `from`; a longer period is refused with `out_of_range` on `from`.
         * @example 2026-09-01T00:00:00Z
         */
        to?: components["parameters"]["ToOptional"];
      };
      header?: never;
      path: {
        /** @description A resource id, in the RFC 9562 string form in either case. A malformed or unknown id is `404` `not_found`, so the response never reveals whether a resource exists; a spelling such as `{<uuid>}` or `urn:uuid:<uuid>` is malformed. */
        id: components["parameters"]["Id"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK. */
      200: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          RateLimit: components["headers"]["RateLimit"];
          "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "id": "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
           *       "agent_key": "support-bot",
           *       "name": "Support bot",
           *       "framework": "LangGraph",
           *       "version": "1.4.0",
           *       "status": "active",
           *       "created_at": "2026-07-14T09:31:00Z",
           *       "clients": [
           *         {
           *           "id": "6f1c2d3e-4b5a-4c6d-8e7f-90a1b2c3d4e5",
           *           "name": "Acme Logistics",
           *           "status": "active"
           *         }
           *       ],
           *       "clients_omitted": 0,
           *       "stats": {
           *         "events": 1840,
           *         "cost_total": 52000,
           *         "currency": "JPY",
           *         "minor_units": 0
           *       }
           *     }
           */
          "application/json": components["schemas"]["AgentDetail"];
        };
      };
      400: components["responses"]["BadRequest"];
      401: components["responses"]["Unauthenticated"];
      403: components["responses"]["ForbiddenKeyOrSession"];
      404: components["responses"]["NotFound"];
      413: components["responses"]["PayloadTooLarge"];
      414: components["responses"]["UriTooLong"];
      429: components["responses"]["RateLimited"];
      500: components["responses"]["InternalError"];
    };
  };
  deleteAgent: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description A resource id, in the RFC 9562 string form in either case. A malformed or unknown id is `404` `not_found`, so the response never reveals whether a resource exists; a spelling such as `{<uuid>}` or `urn:uuid:<uuid>` is malformed. */
        id: components["parameters"]["Id"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Deleted. */
      204: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          RateLimit: components["headers"]["RateLimit"];
          "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
          [name: string]: unknown;
        };
        content?: never;
      };
      400: components["responses"]["BadRequest"];
      401: components["responses"]["Unauthenticated"];
      403: components["responses"]["ForbiddenKeyOrSession"];
      404: components["responses"]["NotFound"];
      /** @description `agent_has_events`: the request conflicts with the current state. */
      409: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          RateLimit: components["headers"]["RateLimit"];
          "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "type": "https://api.allisai.ai/errors/agent_has_events",
           *       "title": "The agent has events",
           *       "status": 409,
           *       "detail": "An agent that events reference cannot be deleted. Set its status to `retired` instead.",
           *       "code": "agent_has_events",
           *       "request_id": "3a9f6c1e2b7d4e5f8a0b1c2d3e4f5a6b"
           *     }
           */
          "application/problem+json": components["schemas"]["Problem"] & {
            /** @enum {unknown} */
            code?: "agent_has_events";
          };
        };
      };
      413: components["responses"]["PayloadTooLarge"];
      414: components["responses"]["UriTooLong"];
      429: components["responses"]["RateLimited"];
      500: components["responses"]["InternalError"];
    };
  };
  updateAgent: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description A resource id, in the RFC 9562 string form in either case. A malformed or unknown id is `404` `not_found`, so the response never reveals whether a resource exists; a spelling such as `{<uuid>}` or `urn:uuid:<uuid>` is malformed. */
        id: components["parameters"]["Id"];
      };
      cookie?: never;
    };
    /** @description A JSON Merge Patch (RFC 7396). SDKs send `application/merge-patch+json`; `application/json` is accepted and read the same way. */
    requestBody: {
      content: {
        /**
         * @example {
         *       "status": "retired"
         *     }
         */
        "application/merge-patch+json": components["schemas"]["AgentPatch"];
        /**
         * @example {
         *       "status": "retired"
         *     }
         */
        "application/json": components["schemas"]["AgentPatch"];
      };
    };
    responses: {
      /** @description OK. */
      200: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          RateLimit: components["headers"]["RateLimit"];
          "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "id": "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
           *       "agent_key": "support-bot",
           *       "name": "Support bot",
           *       "framework": "LangGraph",
           *       "version": "1.4.0",
           *       "status": "retired",
           *       "created_at": "2026-07-14T09:31:00Z"
           *     }
           */
          "application/json": components["schemas"]["Agent"];
        };
      };
      400: components["responses"]["BadRequest"];
      401: components["responses"]["Unauthenticated"];
      403: components["responses"]["ForbiddenKeyOrSession"];
      404: components["responses"]["NotFound"];
      413: components["responses"]["PayloadTooLarge"];
      414: components["responses"]["UriTooLong"];
      415: components["responses"]["UnsupportedMediaTypePatch"];
      429: components["responses"]["RateLimited"];
      500: components["responses"]["InternalError"];
    };
  };
  listValueModels: {
    parameters: {
      query?: {
        /** @description Page size, 1 to 200. A value outside the range is refused with `out_of_range`, never clamped. */
        limit?: components["parameters"]["Limit"];
        /** @description `next_cursor` from the previous page. Valid only with the filters and sort it was issued under; otherwise refused with `invalid_value`. An empty value is refused with `invalid_format`, like any empty query parameter. `limit` may change between pages. */
        cursor?: components["parameters"]["Cursor"];
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK. */
      200: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          RateLimit: components["headers"]["RateLimit"];
          "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "data": [
           *         {
           *           "id": "3c4d5e6f-7a8b-4c9d-8e0f-2a3b4c5d6e7f",
           *           "client_id": "6f1c2d3e-4b5a-4c6d-8e7f-90a1b2c3d4e5",
           *           "client_name": "Acme Logistics",
           *           "name": "Acme support value",
           *           "status": "active",
           *           "version": 3,
           *           "line_items": 2,
           *           "created_at": "2026-07-20T01:00:00Z",
           *           "updated_at": "2026-08-02T04:15:00Z"
           *         }
           *       ],
           *       "has_more": false,
           *       "next_cursor": null
           *     }
           */
          "application/json": components["schemas"]["ValueModelList"];
        };
      };
      400: components["responses"]["BadRequest"];
      401: components["responses"]["Unauthenticated"];
      403: components["responses"]["ForbiddenKeyOrSession"];
      413: components["responses"]["PayloadTooLarge"];
      414: components["responses"]["UriTooLong"];
      429: components["responses"]["RateLimited"];
      500: components["responses"]["InternalError"];
    };
  };
  getValueModel: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description A resource id, in the RFC 9562 string form in either case. A malformed or unknown id is `404` `not_found`, so the response never reveals whether a resource exists; a spelling such as `{<uuid>}` or `urn:uuid:<uuid>` is malformed. */
        id: components["parameters"]["Id"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK. */
      200: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          RateLimit: components["headers"]["RateLimit"];
          "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "id": "3c4d5e6f-7a8b-4c9d-8e0f-2a3b4c5d6e7f",
           *       "client_id": "6f1c2d3e-4b5a-4c6d-8e7f-90a1b2c3d4e5",
           *       "name": "Acme support value",
           *       "status": "active",
           *       "version": 3,
           *       "currency": "JPY",
           *       "created_at": "2026-07-20T01:00:00Z",
           *       "updated_at": "2026-08-02T04:15:00Z",
           *       "line_items": [
           *         {
           *           "id": "4d5e6f7a-8b9c-4d0e-9f1a-3b4c5d6e7f80",
           *           "outcome_type": "ticket_resolved",
           *           "label": "Support ticket resolved autonomously",
           *           "unit_value": 1200,
           *           "provenance_note": "Agreed with Acme ops lead, 2026-07-20: fully loaded cost of a tier-1 ticket.",
           *           "position": 0
           *         },
           *         {
           *           "id": "5d6e7f80-9a0b-4c1d-8e2f-4a5b6c7d8e9f",
           *           "outcome_type": "escalation_avoided",
           *           "label": "Escalation to a human agent avoided",
           *           "unit_value": 450.5,
           *           "provenance_note": "",
           *           "position": 1
           *         }
           *       ]
           *     }
           */
          "application/json": components["schemas"]["ValueModel"];
        };
      };
      400: components["responses"]["BadRequest"];
      401: components["responses"]["Unauthenticated"];
      403: components["responses"]["ForbiddenKeyOrSession"];
      404: components["responses"]["NotFound"];
      413: components["responses"]["PayloadTooLarge"];
      414: components["responses"]["UriTooLong"];
      429: components["responses"]["RateLimited"];
      500: components["responses"]["InternalError"];
    };
  };
  listOutcomeTypes: {
    parameters: {
      query?: {
        /**
         * @description Start of a half-open range, inclusive. Absent means unbounded. Must not be after `to`, or it is refused with `out_of_range` on `from`. Each sent bound must be at or after `1900-01-01T00:00:00Z` and before `10000-01-01T00:00:00Z`; otherwise it is refused with `out_of_range` on its own parameter. Digits below a microsecond are dropped before any check. When both bounds are sent, `to` may be at most 731 days after `from`; a longer period is refused with `out_of_range` on `from`.
         * @example 2026-08-01T00:00:00Z
         */
        from?: components["parameters"]["FromOptional"];
        /**
         * @description End of a half-open range, exclusive. Absent means unbounded. Each sent bound must be at or after `1900-01-01T00:00:00Z` and before `10000-01-01T00:00:00Z`; otherwise it is refused with `out_of_range` on its own parameter. Digits below a microsecond are dropped before any check. When both bounds are sent, `to` may be at most 731 days after `from`; a longer period is refused with `out_of_range` on `from`.
         * @example 2026-09-01T00:00:00Z
         */
        to?: components["parameters"]["ToOptional"];
        /** @description Page size, 1 to 200. A value outside the range is refused with `out_of_range`, never clamped. */
        limit?: components["parameters"]["Limit"];
        /** @description `next_cursor` from the previous page. Valid only with the filters and sort it was issued under; otherwise refused with `invalid_value`. An empty value is refused with `invalid_format`, like any empty query parameter. `limit` may change between pages. */
        cursor?: components["parameters"]["Cursor"];
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK. */
      200: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          RateLimit: components["headers"]["RateLimit"];
          "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "data": [
           *         {
           *           "outcome_type": "ticket_resolved",
           *           "events": 340,
           *           "quantity": 340,
           *           "priced": null
           *         }
           *       ],
           *       "has_more": false,
           *       "next_cursor": null
           *     }
           */
          "application/json": components["schemas"]["OutcomeTypeList"];
        };
      };
      400: components["responses"]["BadRequest"];
      401: components["responses"]["Unauthenticated"];
      403: components["responses"]["ForbiddenKeyOrSession"];
      413: components["responses"]["PayloadTooLarge"];
      414: components["responses"]["UriTooLong"];
      429: components["responses"]["RateLimited"];
      500: components["responses"]["InternalError"];
    };
  };
  listValueTemplates: {
    parameters: {
      query?: {
        /** @description Page size, 1 to 200. A value outside the range is refused with `out_of_range`, never clamped. */
        limit?: components["parameters"]["Limit"];
        /** @description `next_cursor` from the previous page. Valid only with the filters and sort it was issued under; otherwise refused with `invalid_value`. An empty value is refused with `invalid_format`, like any empty query parameter. `limit` may change between pages. */
        cursor?: components["parameters"]["Cursor"];
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK. */
      200: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          RateLimit: components["headers"]["RateLimit"];
          "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "data": [
           *         {
           *           "id": "support-automation",
           *           "name": "Support automation",
           *           "description": "Tickets an agent resolves or deflects without a human.",
           *           "line_items": [
           *             {
           *               "outcome_type": "ticket_resolved",
           *               "label": "Support ticket resolved autonomously",
           *               "unit_value": 0,
           *               "provenance_note": "Agree this unit value with the client and record how it was derived."
           *             }
           *           ]
           *         }
           *       ],
           *       "has_more": false,
           *       "next_cursor": null
           *     }
           */
          "application/json": components["schemas"]["ValueTemplateList"];
        };
      };
      400: components["responses"]["BadRequest"];
      401: components["responses"]["Unauthenticated"];
      403: components["responses"]["ForbiddenKeyOrSession"];
      413: components["responses"]["PayloadTooLarge"];
      414: components["responses"]["UriTooLong"];
      429: components["responses"]["RateLimited"];
      500: components["responses"]["InternalError"];
    };
  };
  listCostLineItems: {
    parameters: {
      query?: {
        /** @description Page size, 1 to 200. A value outside the range is refused with `out_of_range`, never clamped. */
        limit?: components["parameters"]["Limit"];
        /** @description `next_cursor` from the previous page. Valid only with the filters and sort it was issued under; otherwise refused with `invalid_value`. An empty value is refused with `invalid_format`, like any empty query parameter. `limit` may change between pages. */
        cursor?: components["parameters"]["Cursor"];
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK. */
      200: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          RateLimit: components["headers"]["RateLimit"];
          "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "data": [
           *         {
           *           "id": "5e6f7a8b-9c0d-4e1f-8a2b-4c5d6e7f8091",
           *           "label": "Hosting",
           *           "target": {
           *             "kind": "client",
           *             "id": "6f1c2d3e-4b5a-4c6d-8e7f-90a1b2c3d4e5",
           *             "name": "Acme Logistics"
           *           },
           *           "monthly_amount": 30000,
           *           "currency": "JPY",
           *           "start_date": "2026-07-01",
           *           "end_date": null,
           *           "created_at": "2026-07-20T01:05:00Z",
           *           "updated_at": "2026-07-20T01:05:00Z"
           *         }
           *       ],
           *       "has_more": false,
           *       "next_cursor": null
           *     }
           */
          "application/json": components["schemas"]["CostLineItemList"];
        };
      };
      400: components["responses"]["BadRequest"];
      401: components["responses"]["Unauthenticated"];
      403: components["responses"]["ForbiddenKeyOrSession"];
      413: components["responses"]["PayloadTooLarge"];
      414: components["responses"]["UriTooLong"];
      429: components["responses"]["RateLimited"];
      500: components["responses"]["InternalError"];
    };
  };
  createCostLineItem: {
    parameters: {
      query?: never;
      header?: {
        /** @description Optional, sent once. 1 to 255 characters of visible ASCII not starting with `"`, or a structured-field String of 1 to 255 visible ASCII characters; the quoted form `"abc"` is the same key as `abc`. A repeat within 24 hours, in the same workspace, with the same method, path, query, media type and body, replays the stored response with `Idempotent-Replayed: true`; with a different request it is `422` `idempotency_key_reused`; while the first is still running it is `409` `idempotency_key_in_use`. Only `2xx` outcomes are stored. A malformed value, `""` included, or the header sent twice is refused with `invalid_format`, located by `header`. */
        "Idempotency-Key"?: components["parameters"]["IdempotencyKey"];
      };
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        /**
         * @example {
         *       "label": "Hosting",
         *       "target": {
         *         "kind": "client",
         *         "id": "6f1c2d3e-4b5a-4c6d-8e7f-90a1b2c3d4e5"
         *       },
         *       "monthly_amount": 30000,
         *       "start_date": "2026-07-01"
         *     }
         */
        "application/json": components["schemas"]["CostLineItemCreate"];
      };
    };
    responses: {
      /** @description Created. */
      201: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          RateLimit: components["headers"]["RateLimit"];
          "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
          "Idempotent-Replayed": components["headers"]["Idempotent-Replayed"];
          Location: components["headers"]["Location"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "id": "5e6f7a8b-9c0d-4e1f-8a2b-4c5d6e7f8091",
           *       "label": "Hosting",
           *       "target": {
           *         "kind": "client",
           *         "id": "6f1c2d3e-4b5a-4c6d-8e7f-90a1b2c3d4e5",
           *         "name": "Acme Logistics"
           *       },
           *       "monthly_amount": 30000,
           *       "currency": "JPY",
           *       "start_date": "2026-07-01",
           *       "end_date": null,
           *       "created_at": "2026-07-20T01:05:00Z",
           *       "updated_at": "2026-07-20T01:05:00Z"
           *     }
           */
          "application/json": components["schemas"]["CostLineItem"];
        };
      };
      400: components["responses"]["BadRequest"];
      401: components["responses"]["Unauthenticated"];
      403: components["responses"]["ForbiddenKeyOrSession"];
      /** @description `idempotency_key_in_use`: the request conflicts with the current state. */
      409: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          RateLimit: components["headers"]["RateLimit"];
          "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "type": "https://api.allisai.ai/errors/idempotency_key_in_use",
           *       "title": "A request with this idempotency key is in progress",
           *       "status": 409,
           *       "detail": "Another request with the same `Idempotency-Key` is still running. Retry after it completes.",
           *       "code": "idempotency_key_in_use",
           *       "request_id": "3a9f6c1e2b7d4e5f8a0b1c2d3e4f5a6b"
           *     }
           */
          "application/problem+json": components["schemas"]["Problem"] & {
            /** @enum {unknown} */
            code?: "idempotency_key_in_use";
          };
        };
      };
      413: components["responses"]["PayloadTooLarge"];
      414: components["responses"]["UriTooLong"];
      415: components["responses"]["UnsupportedMediaType"];
      422: components["responses"]["IdempotencyKeyReused"];
      429: components["responses"]["RateLimited"];
      500: components["responses"]["InternalError"];
    };
  };
  getCostLineItem: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description A resource id, in the RFC 9562 string form in either case. A malformed or unknown id is `404` `not_found`, so the response never reveals whether a resource exists; a spelling such as `{<uuid>}` or `urn:uuid:<uuid>` is malformed. */
        id: components["parameters"]["Id"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK. */
      200: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          RateLimit: components["headers"]["RateLimit"];
          "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "id": "5e6f7a8b-9c0d-4e1f-8a2b-4c5d6e7f8091",
           *       "label": "Hosting",
           *       "target": {
           *         "kind": "client",
           *         "id": "6f1c2d3e-4b5a-4c6d-8e7f-90a1b2c3d4e5",
           *         "name": "Acme Logistics"
           *       },
           *       "monthly_amount": 30000,
           *       "currency": "JPY",
           *       "start_date": "2026-07-01",
           *       "end_date": null,
           *       "created_at": "2026-07-20T01:05:00Z",
           *       "updated_at": "2026-07-20T01:05:00Z"
           *     }
           */
          "application/json": components["schemas"]["CostLineItem"];
        };
      };
      400: components["responses"]["BadRequest"];
      401: components["responses"]["Unauthenticated"];
      403: components["responses"]["ForbiddenKeyOrSession"];
      404: components["responses"]["NotFound"];
      413: components["responses"]["PayloadTooLarge"];
      414: components["responses"]["UriTooLong"];
      429: components["responses"]["RateLimited"];
      500: components["responses"]["InternalError"];
    };
  };
  deleteCostLineItem: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description A resource id, in the RFC 9562 string form in either case. A malformed or unknown id is `404` `not_found`, so the response never reveals whether a resource exists; a spelling such as `{<uuid>}` or `urn:uuid:<uuid>` is malformed. */
        id: components["parameters"]["Id"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Deleted. */
      204: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          RateLimit: components["headers"]["RateLimit"];
          "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
          [name: string]: unknown;
        };
        content?: never;
      };
      400: components["responses"]["BadRequest"];
      401: components["responses"]["Unauthenticated"];
      403: components["responses"]["ForbiddenKeyOrSession"];
      404: components["responses"]["NotFound"];
      413: components["responses"]["PayloadTooLarge"];
      414: components["responses"]["UriTooLong"];
      429: components["responses"]["RateLimited"];
      500: components["responses"]["InternalError"];
    };
  };
  updateCostLineItem: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description A resource id, in the RFC 9562 string form in either case. A malformed or unknown id is `404` `not_found`, so the response never reveals whether a resource exists; a spelling such as `{<uuid>}` or `urn:uuid:<uuid>` is malformed. */
        id: components["parameters"]["Id"];
      };
      cookie?: never;
    };
    /** @description A JSON Merge Patch (RFC 7396). SDKs send `application/merge-patch+json`; `application/json` is accepted and read the same way. */
    requestBody: {
      content: {
        /**
         * @example {
         *       "end_date": "2026-12-31"
         *     }
         */
        "application/merge-patch+json": components["schemas"]["CostLineItemPatch"];
        /**
         * @example {
         *       "end_date": "2026-12-31"
         *     }
         */
        "application/json": components["schemas"]["CostLineItemPatch"];
      };
    };
    responses: {
      /** @description OK. */
      200: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          RateLimit: components["headers"]["RateLimit"];
          "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "id": "5e6f7a8b-9c0d-4e1f-8a2b-4c5d6e7f8091",
           *       "label": "Hosting",
           *       "target": {
           *         "kind": "client",
           *         "id": "6f1c2d3e-4b5a-4c6d-8e7f-90a1b2c3d4e5",
           *         "name": "Acme Logistics"
           *       },
           *       "monthly_amount": 30000,
           *       "currency": "JPY",
           *       "start_date": "2026-07-01",
           *       "end_date": "2026-12-31",
           *       "created_at": "2026-07-20T01:05:00Z",
           *       "updated_at": "2026-09-01T00:00:00Z"
           *     }
           */
          "application/json": components["schemas"]["CostLineItem"];
        };
      };
      400: components["responses"]["BadRequest"];
      401: components["responses"]["Unauthenticated"];
      403: components["responses"]["ForbiddenKeyOrSession"];
      404: components["responses"]["NotFound"];
      413: components["responses"]["PayloadTooLarge"];
      414: components["responses"]["UriTooLong"];
      415: components["responses"]["UnsupportedMediaTypePatch"];
      429: components["responses"]["RateLimited"];
      500: components["responses"]["InternalError"];
    };
  };
  getPriceTable: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK. */
      200: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          RateLimit: components["headers"]["RateLimit"];
          "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "currency": "JPY",
           *       "models": [
           *         {
           *           "model": "claude-sonnet",
           *           "input_per_1k": 0.45,
           *           "output_per_1k": 2.25
           *         },
           *         {
           *           "model": "gpt-4o",
           *           "input_per_1k": 0.375,
           *           "output_per_1k": 1.5
           *         }
           *       ]
           *     }
           */
          "application/json": components["schemas"]["PriceTable"];
        };
      };
      400: components["responses"]["BadRequest"];
      401: components["responses"]["Unauthenticated"];
      403: components["responses"]["ForbiddenKeyOrSession"];
      413: components["responses"]["PayloadTooLarge"];
      414: components["responses"]["UriTooLong"];
      429: components["responses"]["RateLimited"];
      500: components["responses"]["InternalError"];
    };
  };
  setPriceTable: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        /**
         * @example {
         *       "models": [
         *         {
         *           "model": "claude-sonnet",
         *           "input_per_1k": 0.45,
         *           "output_per_1k": 2.25
         *         },
         *         {
         *           "model": "gpt-4o",
         *           "input_per_1k": 0.375,
         *           "output_per_1k": 1.5
         *         }
         *       ]
         *     }
         */
        "application/json": components["schemas"]["PriceTableSet"];
      };
    };
    responses: {
      /** @description OK. */
      200: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          RateLimit: components["headers"]["RateLimit"];
          "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "currency": "JPY",
           *       "models": [
           *         {
           *           "model": "claude-sonnet",
           *           "input_per_1k": 0.45,
           *           "output_per_1k": 2.25
           *         },
           *         {
           *           "model": "gpt-4o",
           *           "input_per_1k": 0.375,
           *           "output_per_1k": 1.5
           *         }
           *       ]
           *     }
           */
          "application/json": components["schemas"]["PriceTable"];
        };
      };
      400: components["responses"]["BadRequest"];
      401: components["responses"]["Unauthenticated"];
      403: components["responses"]["ForbiddenKeyOrSession"];
      413: components["responses"]["PayloadTooLarge"];
      414: components["responses"]["UriTooLong"];
      415: components["responses"]["UnsupportedMediaType"];
      429: components["responses"]["RateLimited"];
      500: components["responses"]["InternalError"];
    };
  };
  getCalculation: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description A resource id, in the RFC 9562 string form in either case. A malformed or unknown id is `404` `not_found`, so the response never reveals whether a resource exists; a spelling such as `{<uuid>}` or `urn:uuid:<uuid>` is malformed. */
        id: components["parameters"]["Id"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK. */
      200: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          RateLimit: components["headers"]["RateLimit"];
          "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "id": "7a8b9c0d-1e2f-4a3b-9c4d-5e6f708192a3",
           *       "client_id": "6f1c2d3e-4b5a-4c6d-8e7f-90a1b2c3d4e5",
           *       "state": "published",
           *       "period": {
           *         "from": "2026-08-01T00:00:00Z",
           *         "to": "2026-09-01T00:00:00Z"
           *       },
           *       "currency": "JPY",
           *       "minor_units": 0,
           *       "value_total": 408000,
           *       "cost_total": 85100,
           *       "ratios": {
           *         "roi": 3.7943595769682728,
           *         "value_to_cost": 4.794359576968272,
           *         "undefined_reason": null
           *       },
           *       "checklist": {
           *         "coverage_confirmed": true,
           *         "counts_spot_checked": true,
           *         "costs_reviewed": true,
           *         "unit_values_current": true,
           *         "note": "Spot-checked 20 tickets against the helpdesk export."
           *       },
           *       "created_at": "2026-09-02T00:10:00Z",
           *       "validated_at": "2026-09-02T00:40:00Z",
           *       "published_at": "2026-09-02T00:45:00Z",
           *       "snapshot": {
           *         "snapshot_version": 1,
           *         "client_id": "6f1c2d3e-4b5a-4c6d-8e7f-90a1b2c3d4e5",
           *         "currency": "JPY",
           *         "minor_units": 0,
           *         "period": {
           *           "from": "2026-08-01T00:00:00Z",
           *           "to": "2026-09-01T00:00:00Z"
           *         },
           *         "ratios": {
           *           "roi": 3.7943595769682728,
           *           "value_to_cost": 4.794359576968272,
           *           "undefined_reason": null
           *         },
           *         "value": {
           *           "value_model": {
           *             "id": "3c4d5e6f-7a8b-4c9d-8e0f-2a3b4c5d6e7f",
           *             "name": "Acme support value",
           *             "version": 3
           *           },
           *           "lines": [
           *             {
           *               "outcome_type": "ticket_resolved",
           *               "label": "Support ticket resolved autonomously",
           *               "unit_value": 1200,
           *               "events": 340,
           *               "quantity": 340,
           *               "total": 408000,
           *               "provenance_note": "Agreed with Acme ops lead, 2026-07-20: fully loaded cost of a tier-1 ticket."
           *             }
           *           ],
           *           "total": 408000,
           *           "coverage": {
           *             "unpriced_outcome_types": [
           *               {
           *                 "outcome_type": "survey_sent",
           *                 "events": 12,
           *                 "quantity": 12,
           *                 "priced": null
           *               }
           *             ],
           *             "unpriced_outcome_types_omitted": 0,
           *             "unmatched_client_keys": [],
           *             "unmatched_client_keys_omitted": 0,
           *             "unattributable_outcome_events": 0,
           *             "client_key_unset": false,
           *             "line_items_empty": false,
           *             "period_precedes_model": false
           *           }
           *         },
           *         "cost": {
           *           "pass_through": 52000,
           *           "token_valued": 3100,
           *           "manual": 30000,
           *           "total": 85100,
           *           "manual_lines": [
           *             {
           *               "id": "5e6f7a8b-9c0d-4e1f-8a2b-4c5d6e7f8091",
           *               "label": "Hosting",
           *               "target": {
           *                 "kind": "client",
           *                 "id": "6f1c2d3e-4b5a-4c6d-8e7f-90a1b2c3d4e5",
           *                 "name": "Acme Logistics"
           *               },
           *               "monthly_amount": 30000,
           *               "covered_days": 31,
           *               "total": 30000
           *             }
           *           ],
           *           "manual_lines_omitted": 0,
           *           "token_lines": [
           *             {
           *               "model": "gpt-4o",
           *               "events": 220,
           *               "tokens_in": 410000,
           *               "tokens_out": 95000,
           *               "in_rate": 0.375,
           *               "out_rate": 1.5,
           *               "total": 3100
           *             }
           *           ],
           *           "agent_lines": [
           *             {
           *               "agent_id": "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
           *               "agent_name": "Support bot",
           *               "pass_through": 52000,
           *               "token_valued": 3100,
           *               "manual": 0,
           *               "total": 55100
           *             }
           *           ],
           *           "agent_lines_omitted": 0,
           *           "coverage": {
           *             "uncosted_model_events": 220,
           *             "unpriceable_models": [],
           *             "unpriceable_models_omitted": 0,
           *             "token_valued_events": 220,
           *             "unattributed_line_items": [],
           *             "unattributed_line_items_omitted": 0,
           *             "partially_covered_line_items": [],
           *             "partially_covered_line_items_omitted": 0,
           *             "prorated_through": "2026-08-31",
           *             "period_truncated": false
           *           }
           *         }
           *       }
           *     }
           */
          "application/json": components["schemas"]["Calculation"];
        };
      };
      400: components["responses"]["BadRequest"];
      401: components["responses"]["Unauthenticated"];
      403: components["responses"]["ForbiddenKeyOrSession"];
      404: components["responses"]["NotFound"];
      413: components["responses"]["PayloadTooLarge"];
      414: components["responses"]["UriTooLong"];
      429: components["responses"]["RateLimited"];
      500: components["responses"]["InternalError"];
    };
  };
  deleteCalculation: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description A resource id, in the RFC 9562 string form in either case. A malformed or unknown id is `404` `not_found`, so the response never reveals whether a resource exists; a spelling such as `{<uuid>}` or `urn:uuid:<uuid>` is malformed. */
        id: components["parameters"]["Id"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Deleted. */
      204: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          RateLimit: components["headers"]["RateLimit"];
          "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
          [name: string]: unknown;
        };
        content?: never;
      };
      400: components["responses"]["BadRequest"];
      401: components["responses"]["Unauthenticated"];
      403: components["responses"]["ForbiddenKeyOrSession"];
      404: components["responses"]["NotFound"];
      /** @description `calculation_not_draft`: the request conflicts with the current state. */
      409: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          RateLimit: components["headers"]["RateLimit"];
          "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "type": "https://api.allisai.ai/errors/calculation_not_draft",
           *       "title": "The calculation is not a draft",
           *       "status": 409,
           *       "detail": "Only a draft can be deleted. A validated or published calculation is a record.",
           *       "code": "calculation_not_draft",
           *       "request_id": "3a9f6c1e2b7d4e5f8a0b1c2d3e4f5a6b"
           *     }
           */
          "application/problem+json": components["schemas"]["Problem"] & {
            /** @enum {unknown} */
            code?: "calculation_not_draft";
          };
        };
      };
      413: components["responses"]["PayloadTooLarge"];
      414: components["responses"]["UriTooLong"];
      429: components["responses"]["RateLimited"];
      500: components["responses"]["InternalError"];
    };
  };
  validateCalculation: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description A resource id, in the RFC 9562 string form in either case. A malformed or unknown id is `404` `not_found`, so the response never reveals whether a resource exists; a spelling such as `{<uuid>}` or `urn:uuid:<uuid>` is malformed. */
        id: components["parameters"]["Id"];
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        /**
         * @example {
         *       "coverage_confirmed": true,
         *       "counts_spot_checked": true,
         *       "costs_reviewed": true,
         *       "unit_values_current": true,
         *       "note": "Spot-checked 20 tickets against the helpdesk export."
         *     }
         */
        "application/json": components["schemas"]["ChecklistInput"];
      };
    };
    responses: {
      /** @description OK. */
      200: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "id": "7a8b9c0d-1e2f-4a3b-9c4d-5e6f708192a3",
           *       "client_id": "6f1c2d3e-4b5a-4c6d-8e7f-90a1b2c3d4e5",
           *       "state": "validated",
           *       "period": {
           *         "from": "2026-08-01T00:00:00Z",
           *         "to": "2026-09-01T00:00:00Z"
           *       },
           *       "currency": "JPY",
           *       "minor_units": 0,
           *       "value_total": 408000,
           *       "cost_total": 85100,
           *       "ratios": {
           *         "roi": 3.7943595769682728,
           *         "value_to_cost": 4.794359576968272,
           *         "undefined_reason": null
           *       },
           *       "checklist": {
           *         "coverage_confirmed": true,
           *         "counts_spot_checked": true,
           *         "costs_reviewed": true,
           *         "unit_values_current": true,
           *         "note": "Spot-checked 20 tickets against the helpdesk export."
           *       },
           *       "created_at": "2026-09-02T00:10:00Z",
           *       "validated_at": "2026-09-02T00:40:00Z",
           *       "published_at": null,
           *       "snapshot": {
           *         "snapshot_version": 1,
           *         "client_id": "6f1c2d3e-4b5a-4c6d-8e7f-90a1b2c3d4e5",
           *         "currency": "JPY",
           *         "minor_units": 0,
           *         "period": {
           *           "from": "2026-08-01T00:00:00Z",
           *           "to": "2026-09-01T00:00:00Z"
           *         },
           *         "ratios": {
           *           "roi": 3.7943595769682728,
           *           "value_to_cost": 4.794359576968272,
           *           "undefined_reason": null
           *         },
           *         "value": {
           *           "value_model": {
           *             "id": "3c4d5e6f-7a8b-4c9d-8e0f-2a3b4c5d6e7f",
           *             "name": "Acme support value",
           *             "version": 3
           *           },
           *           "lines": [
           *             {
           *               "outcome_type": "ticket_resolved",
           *               "label": "Support ticket resolved autonomously",
           *               "unit_value": 1200,
           *               "events": 340,
           *               "quantity": 340,
           *               "total": 408000,
           *               "provenance_note": "Agreed with Acme ops lead, 2026-07-20: fully loaded cost of a tier-1 ticket."
           *             }
           *           ],
           *           "total": 408000,
           *           "coverage": {
           *             "unpriced_outcome_types": [
           *               {
           *                 "outcome_type": "survey_sent",
           *                 "events": 12,
           *                 "quantity": 12,
           *                 "priced": null
           *               }
           *             ],
           *             "unpriced_outcome_types_omitted": 0,
           *             "unmatched_client_keys": [],
           *             "unmatched_client_keys_omitted": 0,
           *             "unattributable_outcome_events": 0,
           *             "client_key_unset": false,
           *             "line_items_empty": false,
           *             "period_precedes_model": false
           *           }
           *         },
           *         "cost": {
           *           "pass_through": 52000,
           *           "token_valued": 3100,
           *           "manual": 30000,
           *           "total": 85100,
           *           "manual_lines": [
           *             {
           *               "id": "5e6f7a8b-9c0d-4e1f-8a2b-4c5d6e7f8091",
           *               "label": "Hosting",
           *               "target": {
           *                 "kind": "client",
           *                 "id": "6f1c2d3e-4b5a-4c6d-8e7f-90a1b2c3d4e5",
           *                 "name": "Acme Logistics"
           *               },
           *               "monthly_amount": 30000,
           *               "covered_days": 31,
           *               "total": 30000
           *             }
           *           ],
           *           "manual_lines_omitted": 0,
           *           "token_lines": [
           *             {
           *               "model": "gpt-4o",
           *               "events": 220,
           *               "tokens_in": 410000,
           *               "tokens_out": 95000,
           *               "in_rate": 0.375,
           *               "out_rate": 1.5,
           *               "total": 3100
           *             }
           *           ],
           *           "agent_lines": [
           *             {
           *               "agent_id": "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
           *               "agent_name": "Support bot",
           *               "pass_through": 52000,
           *               "token_valued": 3100,
           *               "manual": 0,
           *               "total": 55100
           *             }
           *           ],
           *           "agent_lines_omitted": 0,
           *           "coverage": {
           *             "uncosted_model_events": 220,
           *             "unpriceable_models": [],
           *             "unpriceable_models_omitted": 0,
           *             "token_valued_events": 220,
           *             "unattributed_line_items": [],
           *             "unattributed_line_items_omitted": 0,
           *             "partially_covered_line_items": [],
           *             "partially_covered_line_items_omitted": 0,
           *             "prorated_through": "2026-08-31",
           *             "period_truncated": false
           *           }
           *         }
           *       }
           *     }
           */
          "application/json": components["schemas"]["Calculation"];
        };
      };
      400: components["responses"]["BadRequest"];
      401: components["responses"]["Unauthenticated"];
      403: components["responses"]["ForbiddenSessionOnly"];
      404: components["responses"]["NotFound"];
      /** @description `calculation_transition_invalid`: the request conflicts with the current state. */
      409: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "type": "https://api.allisai.ai/errors/calculation_transition_invalid",
           *       "title": "The calculation's state does not allow this action",
           *       "status": 409,
           *       "detail": "calculation is not in a state that allows this transition",
           *       "code": "calculation_transition_invalid",
           *       "request_id": "3a9f6c1e2b7d4e5f8a0b1c2d3e4f5a6b"
           *     }
           */
          "application/problem+json": components["schemas"]["Problem"] & {
            /** @enum {unknown} */
            code?: "calculation_transition_invalid";
          };
        };
      };
      413: components["responses"]["PayloadTooLarge"];
      414: components["responses"]["UriTooLong"];
      415: components["responses"]["UnsupportedMediaType"];
      500: components["responses"]["InternalError"];
    };
  };
  publishCalculation: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description A resource id, in the RFC 9562 string form in either case. A malformed or unknown id is `404` `not_found`, so the response never reveals whether a resource exists; a spelling such as `{<uuid>}` or `urn:uuid:<uuid>` is malformed. */
        id: components["parameters"]["Id"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK. */
      200: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "id": "7a8b9c0d-1e2f-4a3b-9c4d-5e6f708192a3",
           *       "client_id": "6f1c2d3e-4b5a-4c6d-8e7f-90a1b2c3d4e5",
           *       "state": "published",
           *       "period": {
           *         "from": "2026-08-01T00:00:00Z",
           *         "to": "2026-09-01T00:00:00Z"
           *       },
           *       "currency": "JPY",
           *       "minor_units": 0,
           *       "value_total": 408000,
           *       "cost_total": 85100,
           *       "ratios": {
           *         "roi": 3.7943595769682728,
           *         "value_to_cost": 4.794359576968272,
           *         "undefined_reason": null
           *       },
           *       "checklist": {
           *         "coverage_confirmed": true,
           *         "counts_spot_checked": true,
           *         "costs_reviewed": true,
           *         "unit_values_current": true,
           *         "note": "Spot-checked 20 tickets against the helpdesk export."
           *       },
           *       "created_at": "2026-09-02T00:10:00Z",
           *       "validated_at": "2026-09-02T00:40:00Z",
           *       "published_at": "2026-09-02T00:45:00Z",
           *       "snapshot": {
           *         "snapshot_version": 1,
           *         "client_id": "6f1c2d3e-4b5a-4c6d-8e7f-90a1b2c3d4e5",
           *         "currency": "JPY",
           *         "minor_units": 0,
           *         "period": {
           *           "from": "2026-08-01T00:00:00Z",
           *           "to": "2026-09-01T00:00:00Z"
           *         },
           *         "ratios": {
           *           "roi": 3.7943595769682728,
           *           "value_to_cost": 4.794359576968272,
           *           "undefined_reason": null
           *         },
           *         "value": {
           *           "value_model": {
           *             "id": "3c4d5e6f-7a8b-4c9d-8e0f-2a3b4c5d6e7f",
           *             "name": "Acme support value",
           *             "version": 3
           *           },
           *           "lines": [
           *             {
           *               "outcome_type": "ticket_resolved",
           *               "label": "Support ticket resolved autonomously",
           *               "unit_value": 1200,
           *               "events": 340,
           *               "quantity": 340,
           *               "total": 408000,
           *               "provenance_note": "Agreed with Acme ops lead, 2026-07-20: fully loaded cost of a tier-1 ticket."
           *             }
           *           ],
           *           "total": 408000,
           *           "coverage": {
           *             "unpriced_outcome_types": [
           *               {
           *                 "outcome_type": "survey_sent",
           *                 "events": 12,
           *                 "quantity": 12,
           *                 "priced": null
           *               }
           *             ],
           *             "unpriced_outcome_types_omitted": 0,
           *             "unmatched_client_keys": [],
           *             "unmatched_client_keys_omitted": 0,
           *             "unattributable_outcome_events": 0,
           *             "client_key_unset": false,
           *             "line_items_empty": false,
           *             "period_precedes_model": false
           *           }
           *         },
           *         "cost": {
           *           "pass_through": 52000,
           *           "token_valued": 3100,
           *           "manual": 30000,
           *           "total": 85100,
           *           "manual_lines": [
           *             {
           *               "id": "5e6f7a8b-9c0d-4e1f-8a2b-4c5d6e7f8091",
           *               "label": "Hosting",
           *               "target": {
           *                 "kind": "client",
           *                 "id": "6f1c2d3e-4b5a-4c6d-8e7f-90a1b2c3d4e5",
           *                 "name": "Acme Logistics"
           *               },
           *               "monthly_amount": 30000,
           *               "covered_days": 31,
           *               "total": 30000
           *             }
           *           ],
           *           "manual_lines_omitted": 0,
           *           "token_lines": [
           *             {
           *               "model": "gpt-4o",
           *               "events": 220,
           *               "tokens_in": 410000,
           *               "tokens_out": 95000,
           *               "in_rate": 0.375,
           *               "out_rate": 1.5,
           *               "total": 3100
           *             }
           *           ],
           *           "agent_lines": [
           *             {
           *               "agent_id": "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
           *               "agent_name": "Support bot",
           *               "pass_through": 52000,
           *               "token_valued": 3100,
           *               "manual": 0,
           *               "total": 55100
           *             }
           *           ],
           *           "agent_lines_omitted": 0,
           *           "coverage": {
           *             "uncosted_model_events": 220,
           *             "unpriceable_models": [],
           *             "unpriceable_models_omitted": 0,
           *             "token_valued_events": 220,
           *             "unattributed_line_items": [],
           *             "unattributed_line_items_omitted": 0,
           *             "partially_covered_line_items": [],
           *             "partially_covered_line_items_omitted": 0,
           *             "prorated_through": "2026-08-31",
           *             "period_truncated": false
           *           }
           *         }
           *       }
           *     }
           */
          "application/json": components["schemas"]["Calculation"];
        };
      };
      400: components["responses"]["BadRequest"];
      401: components["responses"]["Unauthenticated"];
      403: components["responses"]["ForbiddenSessionOnly"];
      404: components["responses"]["NotFound"];
      /** @description `calculation_transition_invalid`: the request conflicts with the current state. */
      409: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "type": "https://api.allisai.ai/errors/calculation_transition_invalid",
           *       "title": "The calculation's state does not allow this action",
           *       "status": 409,
           *       "detail": "calculation is not in a state that allows this transition",
           *       "code": "calculation_transition_invalid",
           *       "request_id": "3a9f6c1e2b7d4e5f8a0b1c2d3e4f5a6b"
           *     }
           */
          "application/problem+json": components["schemas"]["Problem"] & {
            /** @enum {unknown} */
            code?: "calculation_transition_invalid";
          };
        };
      };
      413: components["responses"]["PayloadTooLarge"];
      414: components["responses"]["UriTooLong"];
      500: components["responses"]["InternalError"];
    };
  };
  reopenCalculation: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description A resource id, in the RFC 9562 string form in either case. A malformed or unknown id is `404` `not_found`, so the response never reveals whether a resource exists; a spelling such as `{<uuid>}` or `urn:uuid:<uuid>` is malformed. */
        id: components["parameters"]["Id"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK. */
      200: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "id": "7a8b9c0d-1e2f-4a3b-9c4d-5e6f708192a3",
           *       "client_id": "6f1c2d3e-4b5a-4c6d-8e7f-90a1b2c3d4e5",
           *       "state": "draft",
           *       "period": {
           *         "from": "2026-08-01T00:00:00Z",
           *         "to": "2026-09-01T00:00:00Z"
           *       },
           *       "currency": "JPY",
           *       "minor_units": 0,
           *       "value_total": 408000,
           *       "cost_total": 85100,
           *       "ratios": {
           *         "roi": 3.7943595769682728,
           *         "value_to_cost": 4.794359576968272,
           *         "undefined_reason": null
           *       },
           *       "checklist": {
           *         "coverage_confirmed": false,
           *         "counts_spot_checked": false,
           *         "costs_reviewed": false,
           *         "unit_values_current": false,
           *         "note": ""
           *       },
           *       "created_at": "2026-09-02T00:10:00Z",
           *       "validated_at": null,
           *       "published_at": null,
           *       "snapshot": {
           *         "snapshot_version": 1,
           *         "client_id": "6f1c2d3e-4b5a-4c6d-8e7f-90a1b2c3d4e5",
           *         "currency": "JPY",
           *         "minor_units": 0,
           *         "period": {
           *           "from": "2026-08-01T00:00:00Z",
           *           "to": "2026-09-01T00:00:00Z"
           *         },
           *         "ratios": {
           *           "roi": 3.7943595769682728,
           *           "value_to_cost": 4.794359576968272,
           *           "undefined_reason": null
           *         },
           *         "value": {
           *           "value_model": {
           *             "id": "3c4d5e6f-7a8b-4c9d-8e0f-2a3b4c5d6e7f",
           *             "name": "Acme support value",
           *             "version": 3
           *           },
           *           "lines": [
           *             {
           *               "outcome_type": "ticket_resolved",
           *               "label": "Support ticket resolved autonomously",
           *               "unit_value": 1200,
           *               "events": 340,
           *               "quantity": 340,
           *               "total": 408000,
           *               "provenance_note": "Agreed with Acme ops lead, 2026-07-20: fully loaded cost of a tier-1 ticket."
           *             }
           *           ],
           *           "total": 408000,
           *           "coverage": {
           *             "unpriced_outcome_types": [
           *               {
           *                 "outcome_type": "survey_sent",
           *                 "events": 12,
           *                 "quantity": 12,
           *                 "priced": null
           *               }
           *             ],
           *             "unpriced_outcome_types_omitted": 0,
           *             "unmatched_client_keys": [],
           *             "unmatched_client_keys_omitted": 0,
           *             "unattributable_outcome_events": 0,
           *             "client_key_unset": false,
           *             "line_items_empty": false,
           *             "period_precedes_model": false
           *           }
           *         },
           *         "cost": {
           *           "pass_through": 52000,
           *           "token_valued": 3100,
           *           "manual": 30000,
           *           "total": 85100,
           *           "manual_lines": [
           *             {
           *               "id": "5e6f7a8b-9c0d-4e1f-8a2b-4c5d6e7f8091",
           *               "label": "Hosting",
           *               "target": {
           *                 "kind": "client",
           *                 "id": "6f1c2d3e-4b5a-4c6d-8e7f-90a1b2c3d4e5",
           *                 "name": "Acme Logistics"
           *               },
           *               "monthly_amount": 30000,
           *               "covered_days": 31,
           *               "total": 30000
           *             }
           *           ],
           *           "manual_lines_omitted": 0,
           *           "token_lines": [
           *             {
           *               "model": "gpt-4o",
           *               "events": 220,
           *               "tokens_in": 410000,
           *               "tokens_out": 95000,
           *               "in_rate": 0.375,
           *               "out_rate": 1.5,
           *               "total": 3100
           *             }
           *           ],
           *           "agent_lines": [
           *             {
           *               "agent_id": "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
           *               "agent_name": "Support bot",
           *               "pass_through": 52000,
           *               "token_valued": 3100,
           *               "manual": 0,
           *               "total": 55100
           *             }
           *           ],
           *           "agent_lines_omitted": 0,
           *           "coverage": {
           *             "uncosted_model_events": 220,
           *             "unpriceable_models": [],
           *             "unpriceable_models_omitted": 0,
           *             "token_valued_events": 220,
           *             "unattributed_line_items": [],
           *             "unattributed_line_items_omitted": 0,
           *             "partially_covered_line_items": [],
           *             "partially_covered_line_items_omitted": 0,
           *             "prorated_through": "2026-08-31",
           *             "period_truncated": false
           *           }
           *         }
           *       }
           *     }
           */
          "application/json": components["schemas"]["Calculation"];
        };
      };
      400: components["responses"]["BadRequest"];
      401: components["responses"]["Unauthenticated"];
      403: components["responses"]["ForbiddenSessionOnly"];
      404: components["responses"]["NotFound"];
      /** @description `calculation_transition_invalid`: the request conflicts with the current state. */
      409: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "type": "https://api.allisai.ai/errors/calculation_transition_invalid",
           *       "title": "The calculation's state does not allow this action",
           *       "status": 409,
           *       "detail": "calculation is not in a state that allows this transition",
           *       "code": "calculation_transition_invalid",
           *       "request_id": "3a9f6c1e2b7d4e5f8a0b1c2d3e4f5a6b"
           *     }
           */
          "application/problem+json": components["schemas"]["Problem"] & {
            /** @enum {unknown} */
            code?: "calculation_transition_invalid";
          };
        };
      };
      413: components["responses"]["PayloadTooLarge"];
      414: components["responses"]["UriTooLong"];
      500: components["responses"]["InternalError"];
    };
  };
  listCalculationReports: {
    parameters: {
      query?: {
        /** @description Page size, 1 to 200. A value outside the range is refused with `out_of_range`, never clamped. */
        limit?: components["parameters"]["Limit"];
        /** @description `next_cursor` from the previous page. Valid only with the filters and sort it was issued under; otherwise refused with `invalid_value`. An empty value is refused with `invalid_format`, like any empty query parameter. `limit` may change between pages. */
        cursor?: components["parameters"]["Cursor"];
      };
      header?: never;
      path: {
        /** @description A resource id, in the RFC 9562 string form in either case. A malformed or unknown id is `404` `not_found`, so the response never reveals whether a resource exists; a spelling such as `{<uuid>}` or `urn:uuid:<uuid>` is malformed. */
        id: components["parameters"]["Id"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK. */
      200: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          RateLimit: components["headers"]["RateLimit"];
          "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "data": [
           *         {
           *           "id": "8b9c0d1e-2f3a-4b4c-8d5e-6f708192a3b4",
           *           "calculation_id": "7a8b9c0d-1e2f-4a3b-9c4d-5e6f708192a3",
           *           "client_name": "Acme Logistics",
           *           "workspace_name": "Northwind AI",
           *           "note": "August was the first full month on the new routing rules.",
           *           "share_token": null,
           *           "shared_at": null,
           *           "revoked_at": null,
           *           "first_viewed_at": null,
           *           "last_viewed_at": null,
           *           "created_at": "2026-09-02T01:00:00Z"
           *         }
           *       ],
           *       "has_more": false,
           *       "next_cursor": null
           *     }
           */
          "application/json": components["schemas"]["ReportList"];
        };
      };
      400: components["responses"]["BadRequest"];
      401: components["responses"]["Unauthenticated"];
      403: components["responses"]["ForbiddenKeyOrSession"];
      404: components["responses"]["NotFound"];
      413: components["responses"]["PayloadTooLarge"];
      414: components["responses"]["UriTooLong"];
      429: components["responses"]["RateLimited"];
      500: components["responses"]["InternalError"];
    };
  };
  createReport: {
    parameters: {
      query?: never;
      header?: {
        /** @description Optional, sent once. 1 to 255 characters of visible ASCII not starting with `"`, or a structured-field String of 1 to 255 visible ASCII characters; the quoted form `"abc"` is the same key as `abc`. A repeat within 24 hours, in the same workspace, with the same method, path, query, media type and body, replays the stored response with `Idempotent-Replayed: true`; with a different request it is `422` `idempotency_key_reused`; while the first is still running it is `409` `idempotency_key_in_use`. Only `2xx` outcomes are stored. A malformed value, `""` included, or the header sent twice is refused with `invalid_format`, located by `header`. */
        "Idempotency-Key"?: components["parameters"]["IdempotencyKey"];
      };
      path: {
        /** @description A resource id, in the RFC 9562 string form in either case. A malformed or unknown id is `404` `not_found`, so the response never reveals whether a resource exists; a spelling such as `{<uuid>}` or `urn:uuid:<uuid>` is malformed. */
        id: components["parameters"]["Id"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Created. `Location` is `/v1/reports/{id}`. */
      201: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          RateLimit: components["headers"]["RateLimit"];
          "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
          "Idempotent-Replayed": components["headers"]["Idempotent-Replayed"];
          Location: components["headers"]["Location"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "id": "8b9c0d1e-2f3a-4b4c-8d5e-6f708192a3b4",
           *       "calculation_id": "7a8b9c0d-1e2f-4a3b-9c4d-5e6f708192a3",
           *       "client_name": "Acme Logistics",
           *       "workspace_name": "Northwind AI",
           *       "note": "August was the first full month on the new routing rules.",
           *       "disclosures": [
           *         {
           *           "kind": "unpriced",
           *           "facts": {
           *             "outcome_types": [
           *               {
           *                 "outcome_type": "survey_sent",
           *                 "quantity": 12
           *               }
           *             ],
           *             "outcome_types_omitted": 0
           *           },
           *           "included": true,
           *           "text": null
           *         },
           *         {
           *           "kind": "token_valued",
           *           "facts": {
           *             "events": 220
           *           },
           *           "included": true,
           *           "text": "Model costs for 220 events were valued from token counts at list prices."
           *         }
           *       ],
           *       "share_token": null,
           *       "shared_at": null,
           *       "revoked_at": null,
           *       "first_viewed_at": null,
           *       "last_viewed_at": null,
           *       "created_at": "2026-09-02T01:00:00Z"
           *     }
           */
          "application/json": components["schemas"]["Report"];
        };
      };
      400: components["responses"]["BadRequest"];
      401: components["responses"]["Unauthenticated"];
      403: components["responses"]["ForbiddenKeyOrSession"];
      404: components["responses"]["NotFound"];
      /** @description `idempotency_key_in_use`, `calculation_not_published`: the request conflicts with the current state. */
      409: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          RateLimit: components["headers"]["RateLimit"];
          "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "type": "https://api.allisai.ai/errors/calculation_not_published",
           *       "title": "The calculation is not published",
           *       "status": 409,
           *       "detail": "A report can be composed only on a published calculation.",
           *       "code": "calculation_not_published",
           *       "request_id": "3a9f6c1e2b7d4e5f8a0b1c2d3e4f5a6b"
           *     }
           */
          "application/problem+json": components["schemas"]["Problem"] & {
            /** @enum {unknown} */
            code?: "idempotency_key_in_use" | "calculation_not_published";
          };
        };
      };
      413: components["responses"]["PayloadTooLarge"];
      414: components["responses"]["UriTooLong"];
      422: components["responses"]["IdempotencyKeyReused"];
      429: components["responses"]["RateLimited"];
      500: components["responses"]["InternalError"];
    };
  };
  getReport: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description A resource id, in the RFC 9562 string form in either case. A malformed or unknown id is `404` `not_found`, so the response never reveals whether a resource exists; a spelling such as `{<uuid>}` or `urn:uuid:<uuid>` is malformed. */
        id: components["parameters"]["Id"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK. */
      200: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          RateLimit: components["headers"]["RateLimit"];
          "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "id": "8b9c0d1e-2f3a-4b4c-8d5e-6f708192a3b4",
           *       "calculation_id": "7a8b9c0d-1e2f-4a3b-9c4d-5e6f708192a3",
           *       "client_name": "Acme Logistics",
           *       "workspace_name": "Northwind AI",
           *       "note": "August was the first full month on the new routing rules.",
           *       "disclosures": [
           *         {
           *           "kind": "unpriced",
           *           "facts": {
           *             "outcome_types": [
           *               {
           *                 "outcome_type": "survey_sent",
           *                 "quantity": 12
           *               }
           *             ],
           *             "outcome_types_omitted": 0
           *           },
           *           "included": true,
           *           "text": null
           *         },
           *         {
           *           "kind": "token_valued",
           *           "facts": {
           *             "events": 220
           *           },
           *           "included": true,
           *           "text": "Model costs for 220 events were valued from token counts at list prices."
           *         }
           *       ],
           *       "share_token": null,
           *       "shared_at": null,
           *       "revoked_at": null,
           *       "first_viewed_at": null,
           *       "last_viewed_at": null,
           *       "created_at": "2026-09-02T01:00:00Z",
           *       "preview": {
           *         "client_name": "Acme Logistics",
           *         "workspace_name": "Northwind AI",
           *         "note": "August was the first full month on the new routing rules.",
           *         "disclosures": [
           *           {
           *             "kind": "unpriced",
           *             "facts": {
           *               "outcome_types": [
           *                 {
           *                   "outcome_type": "survey_sent",
           *                   "quantity": 12
           *                 }
           *               ],
           *               "outcome_types_omitted": 0
           *             },
           *             "included": true,
           *             "text": null
           *           },
           *           {
           *             "kind": "token_valued",
           *             "facts": {
           *               "events": 220
           *             },
           *             "included": true,
           *             "text": "Model costs for 220 events were valued from token counts at list prices."
           *           }
           *         ],
           *         "period": {
           *           "from": "2026-08-01T00:00:00Z",
           *           "to": "2026-09-01T00:00:00Z"
           *         },
           *         "currency": "JPY",
           *         "minor_units": 0,
           *         "snapshot": {
           *           "snapshot_version": 1,
           *           "currency": "JPY",
           *           "minor_units": 0,
           *           "period": {
           *             "from": "2026-08-01T00:00:00Z",
           *             "to": "2026-09-01T00:00:00Z"
           *           },
           *           "ratios": {
           *             "roi": 3.7943595769682728,
           *             "value_to_cost": 4.794359576968272,
           *             "undefined_reason": null
           *           },
           *           "value": {
           *             "value_model": {
           *               "name": "Acme support value",
           *               "version": 3
           *             },
           *             "lines": [
           *               {
           *                 "outcome_type": "ticket_resolved",
           *                 "label": "Support ticket resolved autonomously",
           *                 "unit_value": 1200,
           *                 "events": 340,
           *                 "quantity": 340,
           *                 "total": 408000,
           *                 "provenance_note": "Agreed with Acme ops lead, 2026-07-20: fully loaded cost of a tier-1 ticket."
           *               }
           *             ],
           *             "total": 408000
           *           },
           *           "cost": {
           *             "pass_through": 52000,
           *             "token_valued": 3100,
           *             "manual": 30000,
           *             "total": 85100
           *           }
           *         },
           *         "compared_to": {
           *           "period": {
           *             "from": "2026-07-01T00:00:00Z",
           *             "to": "2026-08-01T00:00:00Z"
           *           },
           *           "value_total": 351600,
           *           "cost_total": 80400,
           *           "roi": 3.373134328358209
           *         }
           *       }
           *     }
           */
          "application/json": components["schemas"]["ReportWithPreview"];
        };
      };
      400: components["responses"]["BadRequest"];
      401: components["responses"]["Unauthenticated"];
      403: components["responses"]["ForbiddenKeyOrSession"];
      404: components["responses"]["NotFound"];
      413: components["responses"]["PayloadTooLarge"];
      414: components["responses"]["UriTooLong"];
      429: components["responses"]["RateLimited"];
      500: components["responses"]["InternalError"];
    };
  };
  deleteReport: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description A resource id, in the RFC 9562 string form in either case. A malformed or unknown id is `404` `not_found`, so the response never reveals whether a resource exists; a spelling such as `{<uuid>}` or `urn:uuid:<uuid>` is malformed. */
        id: components["parameters"]["Id"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Deleted. */
      204: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          RateLimit: components["headers"]["RateLimit"];
          "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
          [name: string]: unknown;
        };
        content?: never;
      };
      400: components["responses"]["BadRequest"];
      401: components["responses"]["Unauthenticated"];
      403: components["responses"]["ForbiddenKeyOrSession"];
      404: components["responses"]["NotFound"];
      /** @description `report_shared`: the request conflicts with the current state. */
      409: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          RateLimit: components["headers"]["RateLimit"];
          "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "type": "https://api.allisai.ai/errors/report_shared",
           *       "title": "The report has been shared",
           *       "status": 409,
           *       "detail": "A shared report cannot be edited, deleted or shared again.",
           *       "code": "report_shared",
           *       "request_id": "3a9f6c1e2b7d4e5f8a0b1c2d3e4f5a6b"
           *     }
           */
          "application/problem+json": components["schemas"]["Problem"] & {
            /** @enum {unknown} */
            code?: "report_shared";
          };
        };
      };
      413: components["responses"]["PayloadTooLarge"];
      414: components["responses"]["UriTooLong"];
      429: components["responses"]["RateLimited"];
      500: components["responses"]["InternalError"];
    };
  };
  updateReport: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description A resource id, in the RFC 9562 string form in either case. A malformed or unknown id is `404` `not_found`, so the response never reveals whether a resource exists; a spelling such as `{<uuid>}` or `urn:uuid:<uuid>` is malformed. */
        id: components["parameters"]["Id"];
      };
      cookie?: never;
    };
    /** @description A JSON Merge Patch (RFC 7396). SDKs send `application/merge-patch+json`; `application/json` is accepted and read the same way. */
    requestBody: {
      content: {
        /**
         * @example {
         *       "note": "August was the first full month on the new routing rules.",
         *       "disclosures": [
         *         {
         *           "kind": "unpriced",
         *           "included": true,
         *           "text": null
         *         },
         *         {
         *           "kind": "token_valued",
         *           "included": true,
         *           "text": "Model costs for 220 events were valued from token counts at list prices."
         *         }
         *       ]
         *     }
         */
        "application/merge-patch+json": components["schemas"]["ReportPatch"];
        /**
         * @example {
         *       "note": "August was the first full month on the new routing rules.",
         *       "disclosures": [
         *         {
         *           "kind": "unpriced",
         *           "included": true,
         *           "text": null
         *         },
         *         {
         *           "kind": "token_valued",
         *           "included": true,
         *           "text": "Model costs for 220 events were valued from token counts at list prices."
         *         }
         *       ]
         *     }
         */
        "application/json": components["schemas"]["ReportPatch"];
      };
    };
    responses: {
      /** @description OK. */
      200: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          RateLimit: components["headers"]["RateLimit"];
          "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "id": "8b9c0d1e-2f3a-4b4c-8d5e-6f708192a3b4",
           *       "calculation_id": "7a8b9c0d-1e2f-4a3b-9c4d-5e6f708192a3",
           *       "client_name": "Acme Logistics",
           *       "workspace_name": "Northwind AI",
           *       "note": "August was the first full month on the new routing rules.",
           *       "disclosures": [
           *         {
           *           "kind": "unpriced",
           *           "facts": {
           *             "outcome_types": [
           *               {
           *                 "outcome_type": "survey_sent",
           *                 "quantity": 12
           *               }
           *             ],
           *             "outcome_types_omitted": 0
           *           },
           *           "included": true,
           *           "text": null
           *         },
           *         {
           *           "kind": "token_valued",
           *           "facts": {
           *             "events": 220
           *           },
           *           "included": true,
           *           "text": "Model costs for 220 events were valued from token counts at list prices."
           *         }
           *       ],
           *       "share_token": null,
           *       "shared_at": null,
           *       "revoked_at": null,
           *       "first_viewed_at": null,
           *       "last_viewed_at": null,
           *       "created_at": "2026-09-02T01:00:00Z"
           *     }
           */
          "application/json": components["schemas"]["Report"];
        };
      };
      400: components["responses"]["BadRequest"];
      401: components["responses"]["Unauthenticated"];
      403: components["responses"]["ForbiddenKeyOrSession"];
      404: components["responses"]["NotFound"];
      /** @description `report_shared`: the request conflicts with the current state. */
      409: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          RateLimit: components["headers"]["RateLimit"];
          "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "type": "https://api.allisai.ai/errors/report_shared",
           *       "title": "The report has been shared",
           *       "status": 409,
           *       "detail": "A shared report cannot be edited, deleted or shared again.",
           *       "code": "report_shared",
           *       "request_id": "3a9f6c1e2b7d4e5f8a0b1c2d3e4f5a6b"
           *     }
           */
          "application/problem+json": components["schemas"]["Problem"] & {
            /** @enum {unknown} */
            code?: "report_shared";
          };
        };
      };
      413: components["responses"]["PayloadTooLarge"];
      414: components["responses"]["UriTooLong"];
      415: components["responses"]["UnsupportedMediaTypePatch"];
      429: components["responses"]["RateLimited"];
      500: components["responses"]["InternalError"];
    };
  };
  shareReport: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description A resource id, in the RFC 9562 string form in either case. A malformed or unknown id is `404` `not_found`, so the response never reveals whether a resource exists; a spelling such as `{<uuid>}` or `urn:uuid:<uuid>` is malformed. */
        id: components["parameters"]["Id"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK. */
      200: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "id": "8b9c0d1e-2f3a-4b4c-8d5e-6f708192a3b4",
           *       "calculation_id": "7a8b9c0d-1e2f-4a3b-9c4d-5e6f708192a3",
           *       "client_name": "Acme Logistics",
           *       "workspace_name": "Northwind AI",
           *       "note": "August was the first full month on the new routing rules.",
           *       "disclosures": [
           *         {
           *           "kind": "unpriced",
           *           "facts": {
           *             "outcome_types": [
           *               {
           *                 "outcome_type": "survey_sent",
           *                 "quantity": 12
           *               }
           *             ],
           *             "outcome_types_omitted": 0
           *           },
           *           "included": true,
           *           "text": null
           *         },
           *         {
           *           "kind": "token_valued",
           *           "facts": {
           *             "events": 220
           *           },
           *           "included": true,
           *           "text": "Model costs for 220 events were valued from token counts at list prices."
           *         }
           *       ],
           *       "share_token": "q3Vb8Kx0dT1uYwZr5LmN2oPa7sCe4fGh9iJk6lMn0Qp",
           *       "shared_at": "2026-09-02T01:20:00Z",
           *       "revoked_at": null,
           *       "first_viewed_at": null,
           *       "last_viewed_at": null,
           *       "created_at": "2026-09-02T01:00:00Z"
           *     }
           */
          "application/json": components["schemas"]["Report"];
        };
      };
      400: components["responses"]["BadRequest"];
      401: components["responses"]["Unauthenticated"];
      403: components["responses"]["ForbiddenSessionOnly"];
      404: components["responses"]["NotFound"];
      /** @description `report_shared`: the request conflicts with the current state. */
      409: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "type": "https://api.allisai.ai/errors/report_shared",
           *       "title": "The report has been shared",
           *       "status": 409,
           *       "detail": "A shared report cannot be edited, deleted or shared again.",
           *       "code": "report_shared",
           *       "request_id": "3a9f6c1e2b7d4e5f8a0b1c2d3e4f5a6b"
           *     }
           */
          "application/problem+json": components["schemas"]["Problem"] & {
            /** @enum {unknown} */
            code?: "report_shared";
          };
        };
      };
      413: components["responses"]["PayloadTooLarge"];
      414: components["responses"]["UriTooLong"];
      500: components["responses"]["InternalError"];
    };
  };
  revokeReport: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description A resource id, in the RFC 9562 string form in either case. A malformed or unknown id is `404` `not_found`, so the response never reveals whether a resource exists; a spelling such as `{<uuid>}` or `urn:uuid:<uuid>` is malformed. */
        id: components["parameters"]["Id"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK. */
      200: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "id": "8b9c0d1e-2f3a-4b4c-8d5e-6f708192a3b4",
           *       "calculation_id": "7a8b9c0d-1e2f-4a3b-9c4d-5e6f708192a3",
           *       "client_name": "Acme Logistics",
           *       "workspace_name": "Northwind AI",
           *       "note": "August was the first full month on the new routing rules.",
           *       "disclosures": [
           *         {
           *           "kind": "unpriced",
           *           "facts": {
           *             "outcome_types": [
           *               {
           *                 "outcome_type": "survey_sent",
           *                 "quantity": 12
           *               }
           *             ],
           *             "outcome_types_omitted": 0
           *           },
           *           "included": true,
           *           "text": null
           *         },
           *         {
           *           "kind": "token_valued",
           *           "facts": {
           *             "events": 220
           *           },
           *           "included": true,
           *           "text": "Model costs for 220 events were valued from token counts at list prices."
           *         }
           *       ],
           *       "share_token": "q3Vb8Kx0dT1uYwZr5LmN2oPa7sCe4fGh9iJk6lMn0Qp",
           *       "shared_at": "2026-09-02T01:20:00Z",
           *       "revoked_at": "2026-09-20T08:00:00Z",
           *       "first_viewed_at": "2026-09-03T00:12:00Z",
           *       "last_viewed_at": "2026-09-18T06:40:00Z",
           *       "created_at": "2026-09-02T01:00:00Z"
           *     }
           */
          "application/json": components["schemas"]["Report"];
        };
      };
      400: components["responses"]["BadRequest"];
      401: components["responses"]["Unauthenticated"];
      403: components["responses"]["ForbiddenSessionOnly"];
      404: components["responses"]["NotFound"];
      /** @description `report_not_shared`: the request conflicts with the current state. */
      409: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "type": "https://api.allisai.ai/errors/report_not_shared",
           *       "title": "The report has no active link",
           *       "status": 409,
           *       "detail": "Revoking a report that was never shared, or is already revoked.",
           *       "code": "report_not_shared",
           *       "request_id": "3a9f6c1e2b7d4e5f8a0b1c2d3e4f5a6b"
           *     }
           */
          "application/problem+json": components["schemas"]["Problem"] & {
            /** @enum {unknown} */
            code?: "report_not_shared";
          };
        };
      };
      413: components["responses"]["PayloadTooLarge"];
      414: components["responses"]["UriTooLong"];
      500: components["responses"]["InternalError"];
    };
  };
  getDashboard: {
    parameters: {
      query: {
        /** @description The calendar month, between `1900-01` and `9999-12`. */
        month: components["schemas"]["Month"];
        /** @description Sort key for `clients`. Every key defaults to ascending. A client with no value in the sorted column sorts after every client with one, in both directions. Ties are broken by `name`, A to Z and case-insensitively, whichever way the column runs, then by `id`. The sort orders `clients` only; `top_clients` keeps its own order. */
        sort?: "name" | "value_total" | "cost_total" | "roi" | "renewal_date";
        /** @description Sort direction. */
        dir?: "asc" | "desc";
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK. */
      200: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          RateLimit: components["headers"]["RateLimit"];
          "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "currency": "JPY",
           *       "minor_units": 0,
           *       "period": {
           *         "from": "2026-08-01T00:00:00Z",
           *         "to": "2026-09-01T00:00:00Z"
           *       },
           *       "period_ended": true,
           *       "latest_published_month": "2026-08",
           *       "value_total": 408000,
           *       "cost_total": 85100,
           *       "ratios": {
           *         "roi": 3.7943595769682728,
           *         "value_to_cost": 4.794359576968272,
           *         "undefined_reason": null
           *       },
           *       "counted": 1,
           *       "clients": [
           *         {
           *           "client_id": "6f1c2d3e-4b5a-4c6d-8e7f-90a1b2c3d4e5",
           *           "name": "Acme Logistics",
           *           "status": "active",
           *           "renewal_date": "2026-12-31",
           *           "value_total": 408000,
           *           "cost_total": 85100,
           *           "roi": 3.7943595769682728,
           *           "reason": null
           *         },
           *         {
           *           "client_id": "7e2d3c4b-5a6f-4d7e-9f80-a1b2c3d4e5f6",
           *           "name": "Fabrikam",
           *           "status": "prospect",
           *           "renewal_date": null,
           *           "value_total": null,
           *           "cost_total": null,
           *           "roi": null,
           *           "reason": "never_published"
           *         }
           *       ],
           *       "clients_omitted": 0,
           *       "top_clients": [
           *         {
           *           "client_id": "6f1c2d3e-4b5a-4c6d-8e7f-90a1b2c3d4e5",
           *           "name": "Acme Logistics",
           *           "status": "active",
           *           "renewal_date": "2026-12-31",
           *           "value_total": 408000,
           *           "cost_total": 85100,
           *           "roi": 3.7943595769682728,
           *           "reason": null
           *         }
           *       ],
           *       "cost_components": {
           *         "pass_through": 52000,
           *         "token_valued": 3100,
           *         "manual": 30000
           *       },
           *       "value_by_outcome": [
           *         {
           *           "outcome_type": "ticket_resolved",
           *           "label": "Support ticket resolved autonomously",
           *           "total": 408000,
           *           "events": 340
           *         }
           *       ],
           *       "value_by_outcome_omitted": 0,
           *       "value_by_outcome_omitted_total": 0,
           *       "agent_costs": [
           *         {
           *           "agent_id": "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
           *           "agent_name": "Support bot",
           *           "pass_through": 52000,
           *           "token_valued": 3100,
           *           "manual": 0,
           *           "total": 55100
           *         }
           *       ],
           *       "agent_costs_recorded": 1,
           *       "unpriced_outcome_types": [
           *         {
           *           "outcome_type": "survey_sent",
           *           "events": 12
           *         }
           *       ],
           *       "unpriced_outcome_types_omitted": 0,
           *       "unallocated_charges": [],
           *       "unallocated_charges_omitted": 0,
           *       "onboarding": {
           *         "has_client": true,
           *         "has_assigned_agent": true,
           *         "has_priced_outcomes": true,
           *         "has_events": true,
           *         "has_published": true
           *       }
           *     }
           */
          "application/json": components["schemas"]["Dashboard"];
        };
      };
      400: components["responses"]["BadRequest"];
      401: components["responses"]["Unauthenticated"];
      403: components["responses"]["ForbiddenKeyOrSession"];
      413: components["responses"]["PayloadTooLarge"];
      414: components["responses"]["UriTooLong"];
      429: components["responses"]["RateLimited"];
      500: components["responses"]["InternalError"];
    };
  };
  listRenewals: {
    parameters: {
      query?: {
        /** @description Page size, 1 to 200. A value outside the range is refused with `out_of_range`, never clamped. */
        limit?: components["parameters"]["Limit"];
        /** @description `next_cursor` from the previous page. Valid only with the filters and sort it was issued under; otherwise refused with `invalid_value`. An empty value is refused with `invalid_format`, like any empty query parameter. `limit` may change between pages. */
        cursor?: components["parameters"]["Cursor"];
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK. */
      200: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          RateLimit: components["headers"]["RateLimit"];
          "RateLimit-Policy": components["headers"]["RateLimit-Policy"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "data": [
           *         {
           *           "client_id": "6f1c2d3e-4b5a-4c6d-8e7f-90a1b2c3d4e5",
           *           "name": "Acme Logistics",
           *           "renewal_date": "2026-12-31",
           *           "roi": 3.7943595769682728,
           *           "period": {
           *             "from": "2026-08-01T00:00:00Z",
           *             "to": "2026-09-01T00:00:00Z"
           *           },
           *           "health": {
           *             "direction": "improving",
           *             "delta_points": 41.9,
           *             "current_roi": 3.7943595769682728,
           *             "prior_roi": 3.373134328358209
           *           },
           *           "unavailable": null,
           *           "prior_period": "2026-07"
           *         }
           *       ],
           *       "has_more": false,
           *       "next_cursor": null
           *     }
           */
          "application/json": components["schemas"]["RenewalList"];
        };
      };
      400: components["responses"]["BadRequest"];
      401: components["responses"]["Unauthenticated"];
      403: components["responses"]["ForbiddenKeyOrSession"];
      413: components["responses"]["PayloadTooLarge"];
      414: components["responses"]["UriTooLong"];
      429: components["responses"]["RateLimited"];
      500: components["responses"]["InternalError"];
    };
  };
  listApiKeys: {
    parameters: {
      query?: {
        /** @description Page size, 1 to 200. A value outside the range is refused with `out_of_range`, never clamped. */
        limit?: components["parameters"]["Limit"];
        /** @description `next_cursor` from the previous page. Valid only with the filters and sort it was issued under; otherwise refused with `invalid_value`. An empty value is refused with `invalid_format`, like any empty query parameter. `limit` may change between pages. */
        cursor?: components["parameters"]["Cursor"];
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK. */
      200: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "data": [
           *         {
           *           "id": "0f8e5a2c-3b1d-4c6e-9a7f-2d4b8c1e6f30",
           *           "name": "production ingest",
           *           "prefix": "aia_AbCdEfGh",
           *           "scopes": [
           *             "ingest"
           *           ],
           *           "created_at": "2026-10-09T09:30:00Z",
           *           "last_used_at": "2026-10-10T02:14:00Z",
           *           "revoked_at": null
           *         },
           *         {
           *           "id": "1e9f6b3d-4c2e-4d7f-8b80-3e5c9d2f7a41",
           *           "name": "Provisioned key",
           *           "prefix": "aia_Zx9Yw8Vu",
           *           "scopes": [
           *             "ingest"
           *           ],
           *           "created_at": "2026-06-01T00:00:00Z",
           *           "last_used_at": "2026-10-09T09:58:00Z",
           *           "revoked_at": "2026-10-09T10:00:00Z"
           *         }
           *       ],
           *       "has_more": false,
           *       "next_cursor": null
           *     }
           */
          "application/json": components["schemas"]["ApiKeyList"];
        };
      };
      400: components["responses"]["BadRequest"];
      401: components["responses"]["Unauthenticated"];
      403: components["responses"]["ForbiddenSessionOnly"];
      413: components["responses"]["PayloadTooLarge"];
      414: components["responses"]["UriTooLong"];
      500: components["responses"]["InternalError"];
    };
  };
  createApiKey: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        /**
         * @example {
         *       "name": "production ingest",
         *       "scopes": [
         *         "ingest"
         *       ]
         *     }
         */
        "application/json": components["schemas"]["ApiKeyCreate"];
      };
    };
    responses: {
      /** @description Created. The only response that carries `token`. */
      201: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          "Cache-Control": components["headers"]["Cache-Control"];
          Location: components["headers"]["Location"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "id": "0f8e5a2c-3b1d-4c6e-9a7f-2d4b8c1e6f30",
           *       "name": "production ingest",
           *       "prefix": "aia_AbCdEfGh",
           *       "scopes": [
           *         "ingest"
           *       ],
           *       "created_at": "2026-10-09T09:30:00Z",
           *       "last_used_at": null,
           *       "revoked_at": null,
           *       "token": "aia_AbCdEfGhq3Vb8Kx0dT1uYwZr5LmN2oPa7sCe4fGh9iJk6lMn0Qp"
           *     }
           */
          "application/json": components["schemas"]["ApiKeyWithToken"];
        };
      };
      400: components["responses"]["BadRequest"];
      401: components["responses"]["Unauthenticated"];
      403: components["responses"]["ForbiddenSessionOnly"];
      413: components["responses"]["PayloadTooLarge"];
      414: components["responses"]["UriTooLong"];
      415: components["responses"]["UnsupportedMediaType"];
      500: components["responses"]["InternalError"];
    };
  };
  getApiKey: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description A resource id, in the RFC 9562 string form in either case. A malformed or unknown id is `404` `not_found`, so the response never reveals whether a resource exists; a spelling such as `{<uuid>}` or `urn:uuid:<uuid>` is malformed. */
        id: components["parameters"]["Id"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK. */
      200: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "id": "0f8e5a2c-3b1d-4c6e-9a7f-2d4b8c1e6f30",
           *       "name": "production ingest",
           *       "prefix": "aia_AbCdEfGh",
           *       "scopes": [
           *         "ingest"
           *       ],
           *       "created_at": "2026-10-09T09:30:00Z",
           *       "last_used_at": null,
           *       "revoked_at": null
           *     }
           */
          "application/json": components["schemas"]["ApiKey"];
        };
      };
      400: components["responses"]["BadRequest"];
      401: components["responses"]["Unauthenticated"];
      403: components["responses"]["ForbiddenSessionOnly"];
      404: components["responses"]["NotFound"];
      413: components["responses"]["PayloadTooLarge"];
      414: components["responses"]["UriTooLong"];
      500: components["responses"]["InternalError"];
    };
  };
  revokeApiKey: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description A resource id, in the RFC 9562 string form in either case. A malformed or unknown id is `404` `not_found`, so the response never reveals whether a resource exists; a spelling such as `{<uuid>}` or `urn:uuid:<uuid>` is malformed. */
        id: components["parameters"]["Id"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK. */
      200: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "id": "0f8e5a2c-3b1d-4c6e-9a7f-2d4b8c1e6f30",
           *       "name": "production ingest",
           *       "prefix": "aia_AbCdEfGh",
           *       "scopes": [
           *         "ingest"
           *       ],
           *       "created_at": "2026-10-09T09:30:00Z",
           *       "last_used_at": null,
           *       "revoked_at": "2026-10-10T03:00:00Z"
           *     }
           */
          "application/json": components["schemas"]["ApiKey"];
        };
      };
      400: components["responses"]["BadRequest"];
      401: components["responses"]["Unauthenticated"];
      403: components["responses"]["ForbiddenSessionOnly"];
      404: components["responses"]["NotFound"];
      /** @description `api_key_revoked`: the request conflicts with the current state. */
      409: {
        headers: {
          "X-Request-Id": components["headers"]["X-Request-Id"];
          [name: string]: unknown;
        };
        content: {
          /**
           * @example {
           *       "type": "https://api.allisai.ai/errors/api_key_revoked",
           *       "title": "The API key is already revoked",
           *       "status": 409,
           *       "detail": "Revoking a key that is already revoked.",
           *       "code": "api_key_revoked",
           *       "request_id": "3a9f6c1e2b7d4e5f8a0b1c2d3e4f5a6b"
           *     }
           */
          "application/problem+json": components["schemas"]["Problem"] & {
            /** @enum {unknown} */
            code?: "api_key_revoked";
          };
        };
      };
      413: components["responses"]["PayloadTooLarge"];
      414: components["responses"]["UriTooLong"];
      500: components["responses"]["InternalError"];
    };
  };
}
