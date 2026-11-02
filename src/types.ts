// The public names of the wire types.
//
// Most are aliases of the types generated from the API's OpenAPI document,
// one per schema, under the schema's own name. The scalar schemas, such as
// `Money` and `Instant`, are not exported: each is a `string`, a `number` or
// a `Decimal`, and an exported `Date` would shadow the global one.
//
// The names this SDK exported before the generated types existed keep their
// hand-written definitions below: `ErrorCode`, `FieldErrorCode`,
// `EventCategory`, `EventInput`, `FieldError`, `Problem` and
// `IngestRowError`. A test holds each to the generated type it corresponds
// to, and reads the document to hold every list below to it.

import type { Decimal } from "./decimal.js";
import type { components, operations } from "./generated/openapi.js";

type Schemas = components["schemas"];

/**
 * The query of one operation, from the generated types. The resource
 * methods' arguments and the public `…Query` names below both use it.
 */
export type QueryOf<K extends keyof operations> = NonNullable<
  operations[K]["parameters"]["query"]
>;

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
  /**
   * One entry per problem, in the order of the list passed to `ingest`.
   * When `errors_truncated` is `true`, some problems have no entry, and a
   * rejected event may have none.
   */
  errors: IngestRowError[];
  /**
   * Whether `errors` omits any problem. The API lists at most 20 problems
   * of one event, and at most 1,000,000 bytes of entries for one batch. The
   * counts always cover every event.
   */
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

// ---- Aliases of the generated types, one per schema, in the document's order ----

export type Period = Schemas["Period"];
export type PeriodInput = Schemas["PeriodInput"];
export type ClientStatus = Schemas["ClientStatus"];
export type AgentStatus = Schemas["AgentStatus"];
export type ValueModelStatus = Schemas["ValueModelStatus"];
export type CalculationState = Schemas["CalculationState"];
export type Scope = Schemas["Scope"];
export type CostTargetKind = Schemas["CostTargetKind"];
export type EventSource = Schemas["EventSource"];
export type UndefinedReason = Schemas["UndefinedReason"];
export type DisclosureKind = Schemas["DisclosureKind"];
export type PortfolioExclusionReason = Schemas["PortfolioExclusionReason"];
export type HealthDirection = Schemas["HealthDirection"];
export type HealthUnavailable = Schemas["HealthUnavailable"];
export type Client = Schemas["Client"];
export type AssignedAgent = Schemas["AssignedAgent"];
export type ClientDetail = Schemas["ClientDetail"];
export type ClientCreate = Schemas["ClientCreate"];
export type ClientPatch = Schemas["ClientPatch"];
export type ClientAgentsSet = Schemas["ClientAgentsSet"];
export type ClientAgents = Schemas["ClientAgents"];
export type Agent = Schemas["Agent"];
export type AgentListItem = Schemas["AgentListItem"];
export type AgentStats = Schemas["AgentStats"];
export type AgentDetail = Schemas["AgentDetail"];
export type AgentCreate = Schemas["AgentCreate"];
export type AgentPatch = Schemas["AgentPatch"];
export type ValueLineItem = Schemas["ValueLineItem"];
export type ValueModel = Schemas["ValueModel"];
export type ValueModelSummary = Schemas["ValueModelSummary"];
export type ValueModelCreate = Schemas["ValueModelCreate"];
export type ValueModelPatch = Schemas["ValueModelPatch"];
export type ValueLineItemInput = Schemas["ValueLineItemInput"];
export type ValueLineItemsSet = Schemas["ValueLineItemsSet"];
export type ValueTemplateLineItem = Schemas["ValueTemplateLineItem"];
export type ValueTemplate = Schemas["ValueTemplate"];
export type OutcomeTypeUsage = Schemas["OutcomeTypeUsage"];
export type CostTarget = Schemas["CostTarget"];
export type CostTargetInput = Schemas["CostTargetInput"];
export type CostLineItem = Schemas["CostLineItem"];
export type CostLineItemCreate = Schemas["CostLineItemCreate"];
export type CostLineItemPatch = Schemas["CostLineItemPatch"];
export type ModelRate = Schemas["ModelRate"];
export type PriceTable = Schemas["PriceTable"];
export type ModelRateInput = Schemas["ModelRateInput"];
export type PriceTableSet = Schemas["PriceTableSet"];
export type Ratios = Schemas["Ratios"];
export type ValueModelRef = Schemas["ValueModelRef"];
export type ValueLine = Schemas["ValueLine"];
export type ValueCoverage = Schemas["ValueCoverage"];
export type ValueResult = Schemas["ValueResult"];
export type ManualCostLine = Schemas["ManualCostLine"];
export type TokenCostLine = Schemas["TokenCostLine"];
export type AgentCostLine = Schemas["AgentCostLine"];
export type UnattributedLineItem = Schemas["UnattributedLineItem"];
export type CostCoverage = Schemas["CostCoverage"];
export type CostResult = Schemas["CostResult"];
export type ClientValue = Schemas["ClientValue"];
export type ClientCost = Schemas["ClientCost"];
export type RoiResult = Schemas["RoiResult"];
export type Anomalies = Schemas["Anomalies"];
export type AttributedEvent = Schemas["AttributedEvent"];
export type ClientEventList = Schemas["ClientEventList"];
export type Checklist = Schemas["Checklist"];
export type ChecklistInput = Schemas["ChecklistInput"];
export type CalculationSnapshot = Schemas["CalculationSnapshot"];
export type Calculation = Schemas["Calculation"];
export type CalculationSummary = Schemas["CalculationSummary"];
export type CalculationCreate = Schemas["CalculationCreate"];
export type Disclosure = Schemas["Disclosure"];
export type DisclosureEdit = Schemas["DisclosureEdit"];
export type Report = Schemas["Report"];
export type ReportSummary = Schemas["ReportSummary"];
export type ReportWithPreview = Schemas["ReportWithPreview"];
export type ReportPatch = Schemas["ReportPatch"];
export type PublicReport = Schemas["PublicReport"];
export type PortfolioClient = Schemas["PortfolioClient"];
export type Dashboard = Schemas["Dashboard"];
export type Renewal = Schemas["Renewal"];
export type ApiKey = Schemas["ApiKey"];
export type ApiKeyWithToken = Schemas["ApiKeyWithToken"];
export type ApiKeyCreate = Schemas["ApiKeyCreate"];
export type ImportMapping = Schemas["ImportMapping"];
export type ImportRowError = Schemas["ImportRowError"];
export type PreviewEvent = Schemas["PreviewEvent"];
export type PreviewRow = Schemas["PreviewRow"];
export type ImportPreview = Schemas["ImportPreview"];
export type ImportResult = Schemas["ImportResult"];
export type Health = Schemas["Health"];
export type ClientList = Schemas["ClientList"];
export type AgentList = Schemas["AgentList"];
export type ValueModelList = Schemas["ValueModelList"];
export type OutcomeTypeList = Schemas["OutcomeTypeList"];
export type ValueTemplateList = Schemas["ValueTemplateList"];
export type CostLineItemList = Schemas["CostLineItemList"];
export type CalculationList = Schemas["CalculationList"];
export type ReportList = Schemas["ReportList"];
export type RenewalList = Schemas["RenewalList"];
export type ApiKeyList = Schemas["ApiKeyList"];

// The query of each operation that takes one, named after the operation:
// its operationId in PascalCase, followed by `Query`. An instant accepts a
// `Date`, written as ISO text.

export type ListClientsQuery = QueryOf<"listClients">;
export type ListClientOutcomeTypesQuery = QueryOf<"listClientOutcomeTypes">;
export type GetClientValueQuery = QueryOf<"getClientValue">;
export type GetClientCostQuery = QueryOf<"getClientCost">;
export type GetClientRoiQuery = QueryOf<"getClientRoi">;
export type ListClientEventsQuery = QueryOf<"listClientEvents">;
export type ListClientCalculationsQuery = QueryOf<"listClientCalculations">;
export type GetClientAnomaliesQuery = QueryOf<"getClientAnomalies">;
export type ListAgentsQuery = QueryOf<"listAgents">;
export type GetAgentQuery = QueryOf<"getAgent">;
export type ListValueModelsQuery = QueryOf<"listValueModels">;
export type ListOutcomeTypesQuery = QueryOf<"listOutcomeTypes">;
export type ListValueTemplatesQuery = QueryOf<"listValueTemplates">;
export type ListCostLineItemsQuery = QueryOf<"listCostLineItems">;
export type ListCalculationReportsQuery = QueryOf<"listCalculationReports">;
export type GetDashboardQuery = QueryOf<"getDashboard">;
export type ListRenewalsQuery = QueryOf<"listRenewals">;
export type ListApiKeysQuery = QueryOf<"listApiKeys">;
