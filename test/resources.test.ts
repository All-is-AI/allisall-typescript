// The resource clients and the shared-report function: every method against
// the operation it calls, the method names against the naming rule, the
// session-only operations, the share token, and the signatures at compile
// time. Each request goes through a fake fetch.

import { openAsBlob } from "node:fs";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  expectTypeOf,
  it,
  vi,
} from "vitest";
import { parse, stringify } from "yaml";
import { transportConfig } from "../src/client.js";
import {
  ITEMS,
  type JsonPath,
  OPERATIONS,
  type OperationId,
} from "../src/generated/operations.js";
import {
  Allisall,
  AllisallError,
  ApiError,
  type AttributedEvent,
  type Client,
  type ClientDetail,
  type ClientEventList,
  type ClientList,
  type ClientPatch,
  type CostLineItem,
  decimal,
  type FetchLike,
  getSharedReport,
  type IdempotentRequestOptions,
  type Import,
  type ImportDelimiter,
  type ImportMapping,
  type ImportUpload,
  type IngestSummary,
  type Page,
  type PagePromise,
  type PublicReport,
  type RenewalTerm,
  type ReportList,
  type ReportPatch,
  type ReportState,
  type ReportSummary,
  type ReportWithPreview,
  type RequestOptions,
  toImportMapping,
  type WorkspaceCalculationList,
} from "../src/index.js";
import { Page as PageClass } from "../src/pagination.js";
import { call, callPage, pageArgs, request } from "../src/request.js";
import type { TransportConfig } from "../src/transport.js";
import { event, instance, json, problem } from "./helpers.js";
import { isRecord, type Json, readSpecText } from "./spec-file.js";

const specText = readSpecText();
const spec: Json = specText === null ? null : parse(specText);

const BASE = "https://api.example.test";
const ID = "id-1";

interface Sent {
  method: string;
  url: string;
  /** The headers, by lower-case name. */
  headers: Record<string, string>;
  body: Uint8Array | FormData | undefined;
  /** The body as UTF-8, when it is bytes. */
  text: string | undefined;
}

type Answer = (req: Sent) => Response | Promise<Response>;

/** A fake fetch: each request gets the next answer, then `fallback`. */
function recorder(
  queue: Answer[] = [],
  fallback: Answer = () => json(200, {}),
): { fetch: FetchLike; sent: Sent[] } {
  const sent: Sent[] = [];
  const fetch: FetchLike = async (url, init) => {
    const raw = init.body;
    let body: Uint8Array | FormData | undefined;
    if (raw === undefined || raw === null) body = undefined;
    else if (raw instanceof Uint8Array) body = raw.slice();
    else if (raw instanceof FormData) body = raw;
    else throw new Error(`unexpected body ${String(raw)}`);
    const headers: Record<string, string> = {};
    new Headers(init.headers).forEach((value, name) => {
      headers[name] = value;
    });
    const req: Sent = {
      method: init.method ?? "GET",
      url,
      headers,
      body,
      text:
        body instanceof Uint8Array ? new TextDecoder().decode(body) : undefined,
    };
    sent.push(req);
    return (queue.shift() ?? fallback)(req);
  };
  return { fetch, sent };
}

function client(fetch: FetchLike): Allisall {
  return new Allisall({ apiKey: "aia_k", baseURL: BASE, fetch });
}

function only<T>(items: readonly T[]): T {
  expect(items).toHaveLength(1);
  const [item] = items;
  if (item === undefined) throw new Error("no item");
  return item;
}

async function rejection(promise: PromiseLike<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (err) {
    return err;
  }
  throw new Error("the promise resolved");
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

// ---- Every method, against its operation ----

/** Money whose text a binary float cannot hold. */
const MONEY_TEXT = "0.1234567890123456789";

interface Row {
  readonly id: OperationId;
  /** The method, as `group.method`. */
  readonly method: string;
  /** Calls the method, passing `options` as its options. */
  readonly run: (
    c: Allisall,
    options: IdempotentRequestOptions,
  ) => PromiseLike<unknown>;
  /** The path and query sent, after the base URL. */
  readonly sent: string;
  /** The JSON body text sent, for a JSON or merge-patch operation. */
  readonly body?: string;
  /** The answer, when the default one does not fit the operation. */
  readonly answer?: Answer;
  /** Checks the result, when the default checks do not fit the operation. */
  readonly check?: (result: unknown) => void;
}

const UPLOAD: ImportUpload = {
  mapping: { timezone: "UTC" },
  file: "Time,Agent\n",
};

const ROWS: readonly Row[] = [
  // events
  {
    id: "ingestEvents",
    method: "events.ingest",
    run: (c, o) => c.events.ingest([event(1, { event_id: "e-1" })], o),
    sent: "/v1/events",
    body: '{"events":[{"timestamp":"2026-10-01T00:00:00Z","agent_key":"agent-1","category":"task","event_type":"step-1","event_id":"e-1"}]}',
    answer: () =>
      json(200, {
        accepted: 1,
        duplicates: 0,
        rejected: 0,
        errors: [],
        errors_truncated: false,
      }),
    check: (result) => {
      expect(result).toEqual({
        accepted: 1,
        duplicates: 0,
        rejected: 0,
        errors: [],
        errors_truncated: false,
        batches: 1,
      });
    },
  },
  {
    id: "listClientEvents",
    method: "events.listForClient",
    run: (c, o) =>
      c.events.listForClient(
        ID,
        {
          from: new Date("2026-08-01T00:00:00Z"),
          to: "2026-09-01T00:00:00Z",
          page: 3,
        },
        o,
      ),
    sent: "/v1/clients/id-1/events?from=2026-08-01T00%3A00%3A00.000Z&to=2026-09-01T00%3A00%3A00Z&page=3",
  },
  {
    id: "listEvents",
    method: "events.list",
    run: (c, o) =>
      c.events.list(
        {
          import_batch_id: ID,
          source: "csv",
          sort: "cost",
          dir: "asc",
          page: 2,
        },
        o,
      ),
    sent: "/v1/events?import_batch_id=id-1&source=csv&sort=cost&dir=asc&page=2",
  },
  {
    id: "getEventSummary",
    method: "events.getSummary",
    run: (c, o) =>
      c.events.getSummary(
        {
          from: "2026-08-01T00:00:00+09:00",
          to: "2026-09-01T00:00:00+09:00",
          as_of: "2026-09-02T00:00:00Z",
        },
        o,
      ),
    sent: "/v1/events/summary?from=2026-08-01T00%3A00%3A00%2B09%3A00&to=2026-09-01T00%3A00%3A00%2B09%3A00&as_of=2026-09-02T00%3A00%3A00Z",
  },
  {
    id: "listEventArrivals",
    method: "events.listArrivals",
    run: (c, o) =>
      c.events.listArrivals(
        { since: new Date("2026-09-01T12:00:00Z"), limit: 1 },
        o,
      ),
    sent: "/v1/events/arrivals?since=2026-09-01T12%3A00%3A00.000Z&limit=1",
  },
  // imports
  {
    id: "listImports",
    method: "imports.list",
    run: (c, o) => c.imports.list({ limit: 5, page: 2 }, o),
    sent: "/v1/imports?limit=5&page=2",
  },
  {
    id: "getImport",
    method: "imports.get",
    run: (c, o) => c.imports.get(ID, o),
    sent: "/v1/imports/id-1",
  },
  {
    id: "previewImport",
    method: "imports.preview",
    run: (c, o) => c.imports.preview(UPLOAD, o),
    sent: "/v1/imports/preview",
  },
  {
    id: "commitImport",
    method: "imports.commit",
    run: (c, o) => c.imports.commit(UPLOAD, o),
    sent: "/v1/imports",
  },
  // clients
  {
    id: "listClients",
    method: "clients.list",
    run: (c, o) => c.clients.list({ limit: 5 }, o),
    sent: "/v1/clients?limit=5",
  },
  {
    id: "createClient",
    method: "clients.create",
    run: (c, o) => c.clients.create({ name: "Acme", status: "active" }, o),
    sent: "/v1/clients",
    body: '{"name":"Acme","status":"active"}',
  },
  {
    id: "getClient",
    method: "clients.get",
    run: (c, o) => c.clients.get(ID, o),
    sent: "/v1/clients/id-1",
  },
  {
    id: "updateClient",
    method: "clients.update",
    run: (c, o) => c.clients.update(ID, { notes: null, name: "Acme 2" }, o),
    sent: "/v1/clients/id-1",
    body: '{"notes":null,"name":"Acme 2"}',
  },
  {
    id: "deleteClient",
    method: "clients.delete",
    run: (c, o) => c.clients.delete(ID, o),
    sent: "/v1/clients/id-1",
  },
  {
    id: "setClientAgents",
    method: "clients.setAgents",
    run: (c, o) => c.clients.setAgents(ID, { agent_ids: ["a-1"] }, o),
    sent: "/v1/clients/id-1/agents",
    body: '{"agent_ids":["a-1"]}',
  },
  // agents
  {
    id: "listAgents",
    method: "agents.list",
    run: (c, o) => c.agents.list({ cursor: "k" }, o),
    sent: "/v1/agents?cursor=k",
  },
  {
    id: "createAgent",
    method: "agents.create",
    run: (c, o) =>
      c.agents.create({ agent_key: "bot", name: "Bot", status: "active" }, o),
    sent: "/v1/agents",
    body: '{"agent_key":"bot","name":"Bot","status":"active"}',
  },
  {
    id: "getAgent",
    method: "agents.get",
    run: (c, o) => c.agents.get(ID, { from: "2026-08-01T00:00:00Z" }, o),
    sent: "/v1/agents/id-1?from=2026-08-01T00%3A00%3A00Z",
  },
  {
    id: "updateAgent",
    method: "agents.update",
    run: (c, o) => c.agents.update(ID, { framework: null }, o),
    sent: "/v1/agents/id-1",
    body: '{"framework":null}',
  },
  {
    id: "deleteAgent",
    method: "agents.delete",
    run: (c, o) => c.agents.delete(ID, o),
    sent: "/v1/agents/id-1",
  },
  // valueModels
  {
    id: "listValueModels",
    method: "valueModels.list",
    run: (c, o) => c.valueModels.list(undefined, o),
    sent: "/v1/value-models",
  },
  {
    id: "getValueModel",
    method: "valueModels.get",
    run: (c, o) => c.valueModels.get(ID, o),
    sent: "/v1/value-models/id-1",
  },
  {
    id: "getClientValueModel",
    method: "valueModels.getForClient",
    run: (c, o) => c.valueModels.getForClient(ID, o),
    sent: "/v1/clients/id-1/value-model",
  },
  {
    id: "createValueModel",
    method: "valueModels.createForClient",
    run: (c, o) => c.valueModels.createForClient(ID, { name: "Model" }, o),
    sent: "/v1/clients/id-1/value-model",
    body: '{"name":"Model"}',
  },
  {
    id: "updateValueModel",
    method: "valueModels.updateForClient",
    run: (c, o) => c.valueModels.updateForClient(ID, { status: "archived" }, o),
    sent: "/v1/clients/id-1/value-model",
    body: '{"status":"archived"}',
  },
  {
    id: "deleteValueModel",
    method: "valueModels.deleteForClient",
    run: (c, o) => c.valueModels.deleteForClient(ID, o),
    sent: "/v1/clients/id-1/value-model",
  },
  {
    id: "setValueModelLineItems",
    method: "valueModels.setLineItemsForClient",
    run: (c, o) =>
      c.valueModels.setLineItemsForClient(
        ID,
        {
          version: 2,
          line_items: [
            {
              outcome_type: "resolved",
              label: "Resolved",
              unit_value: decimal("12.3456"),
            },
            { outcome_type: "escalated", label: "Escalated", unit_value: 7.5 },
          ],
        },
        o,
      ),
    sent: "/v1/clients/id-1/value-model/line-items",
    body: '{"version":2,"line_items":[{"outcome_type":"resolved","label":"Resolved","unit_value":12.3456},{"outcome_type":"escalated","label":"Escalated","unit_value":7.5}]}',
  },
  {
    id: "listValueTemplates",
    method: "valueModels.listTemplates",
    run: (c, o) => c.valueModels.listTemplates({ limit: 2 }, o),
    sent: "/v1/value-templates?limit=2",
  },
  // outcomeTypes
  {
    id: "listOutcomeTypes",
    method: "outcomeTypes.list",
    run: (c, o) => c.outcomeTypes.list({ to: "2026-09-01T00:00:00Z" }, o),
    sent: "/v1/outcome-types?to=2026-09-01T00%3A00%3A00Z",
  },
  {
    id: "listClientOutcomeTypes",
    method: "outcomeTypes.listForClient",
    run: (c, o) => c.outcomeTypes.listForClient(ID, undefined, o),
    sent: "/v1/clients/id-1/outcome-types",
  },
  // cost
  {
    id: "listCostLineItems",
    method: "cost.listLineItems",
    run: (c, o) => c.cost.listLineItems(undefined, o),
    sent: "/v1/cost-line-items",
  },
  {
    id: "createCostLineItem",
    method: "cost.createLineItem",
    run: (c, o) =>
      c.cost.createLineItem(
        {
          label: "Seats",
          target: { kind: "client", id: "c-1" },
          monthly_amount: decimal("1234.5678"),
          start_date: "2026-08-01",
        },
        o,
      ),
    sent: "/v1/cost-line-items",
    body: '{"label":"Seats","target":{"kind":"client","id":"c-1"},"monthly_amount":1234.5678,"start_date":"2026-08-01"}',
  },
  {
    id: "getCostLineItem",
    method: "cost.getLineItem",
    run: (c, o) => c.cost.getLineItem(ID, o),
    sent: "/v1/cost-line-items/id-1",
  },
  {
    id: "updateCostLineItem",
    method: "cost.updateLineItem",
    run: (c, o) =>
      c.cost.updateLineItem(ID, { monthly_amount: 99.5, end_date: null }, o),
    sent: "/v1/cost-line-items/id-1",
    body: '{"monthly_amount":99.5,"end_date":null}',
  },
  {
    id: "deleteCostLineItem",
    method: "cost.deleteLineItem",
    run: (c, o) => c.cost.deleteLineItem(ID, o),
    sent: "/v1/cost-line-items/id-1",
  },
  {
    id: "getPriceTable",
    method: "cost.getPriceTable",
    run: (c, o) => c.cost.getPriceTable(o),
    sent: "/v1/price-table",
  },
  {
    id: "setPriceTable",
    method: "cost.setPriceTable",
    run: (c, o) =>
      c.cost.setPriceTable(
        {
          models: [
            {
              model: "m-1",
              input_per_1k: decimal("0.000150000"),
              output_per_1k: 0.0006,
            },
          ],
        },
        o,
      ),
    sent: "/v1/price-table",
    body: '{"models":[{"model":"m-1","input_per_1k":0.000150000,"output_per_1k":0.0006}]}',
  },
  // analytics
  {
    id: "getClientValue",
    method: "analytics.getValueForClient",
    run: (c, o) => c.analytics.getValueForClient(ID, undefined, o),
    sent: "/v1/clients/id-1/value",
  },
  {
    id: "getClientCost",
    method: "analytics.getCostForClient",
    run: (c, o) =>
      c.analytics.getCostForClient(
        ID,
        { from: "2026-08-01", to: "2026-09-01" },
        o,
      ),
    sent: "/v1/clients/id-1/cost?from=2026-08-01&to=2026-09-01",
  },
  {
    id: "getClientRoi",
    method: "analytics.getRoiForClient",
    run: (c, o) =>
      c.analytics.getRoiForClient(
        ID,
        { from: "2026-08-01", to: "2026-09-01" },
        o,
      ),
    sent: "/v1/clients/id-1/roi?from=2026-08-01&to=2026-09-01",
  },
  {
    id: "getClientAnomalies",
    method: "analytics.getAnomaliesForClient",
    run: (c, o) =>
      c.analytics.getAnomaliesForClient(
        ID,
        { from: "2026-08-01", to: "2026-09-01" },
        o,
      ),
    sent: "/v1/clients/id-1/anomalies?from=2026-08-01&to=2026-09-01",
  },
  // calculations
  {
    id: "createCalculation",
    method: "calculations.createForClient",
    run: (c, o) =>
      c.calculations.createForClient(
        ID,
        {
          period: {
            from: new Date("2026-08-01T00:00:00Z"),
            to: "2026-09-01T00:00:00Z",
          },
        },
        o,
      ),
    sent: "/v1/clients/id-1/calculations",
    body: '{"period":{"from":"2026-08-01T00:00:00.000Z","to":"2026-09-01T00:00:00Z"}}',
  },
  {
    id: "listClientCalculations",
    method: "calculations.listForClient",
    run: (c, o) => c.calculations.listForClient(ID, { limit: 1 }, o),
    sent: "/v1/clients/id-1/calculations?limit=1",
  },
  {
    id: "listCalculations",
    method: "calculations.list",
    run: (c, o) =>
      c.calculations.list(
        { client_id: ID, state: "published", month: "2026-08", page: 2 },
        o,
      ),
    sent: "/v1/calculations?client_id=id-1&state=published&month=2026-08&page=2",
  },
  {
    id: "getCalculation",
    method: "calculations.get",
    run: (c, o) => c.calculations.get(ID, o),
    sent: "/v1/calculations/id-1",
  },
  {
    id: "deleteCalculation",
    method: "calculations.delete",
    run: (c, o) => c.calculations.delete(ID, o),
    sent: "/v1/calculations/id-1",
  },
  {
    id: "validateCalculation",
    method: "calculations.validate",
    run: (c, o) =>
      c.calculations.validate(
        ID,
        {
          coverage_confirmed: true,
          counts_spot_checked: true,
          costs_reviewed: true,
          unit_values_current: true,
        },
        o,
      ),
    sent: "/v1/calculations/id-1/validate",
    body: '{"coverage_confirmed":true,"counts_spot_checked":true,"costs_reviewed":true,"unit_values_current":true}',
  },
  {
    id: "publishCalculation",
    method: "calculations.publish",
    run: (c, o) => c.calculations.publish(ID, o),
    sent: "/v1/calculations/id-1/publish",
  },
  {
    id: "reopenCalculation",
    method: "calculations.reopen",
    run: (c, o) => c.calculations.reopen(ID, o),
    sent: "/v1/calculations/id-1/reopen",
  },
  // reports
  {
    id: "createReport",
    method: "reports.createForCalculation",
    run: (c, o) => c.reports.createForCalculation(ID, o),
    sent: "/v1/calculations/id-1/reports",
  },
  {
    id: "listCalculationReports",
    method: "reports.listForCalculation",
    run: (c, o) => c.reports.listForCalculation(ID, undefined, o),
    sent: "/v1/calculations/id-1/reports",
  },
  {
    id: "listReports",
    method: "reports.list",
    run: (c, o) => c.reports.list({ client_id: ID, state: "shared" }, o),
    sent: "/v1/reports?client_id=id-1&state=shared",
  },
  {
    id: "getReport",
    method: "reports.get",
    run: (c, o) => c.reports.get(ID, o),
    sent: "/v1/reports/id-1",
  },
  {
    id: "updateReport",
    method: "reports.update",
    run: (c, o) => c.reports.update(ID, { note: null }, o),
    sent: "/v1/reports/id-1",
    body: '{"note":null}',
  },
  {
    id: "deleteReport",
    method: "reports.delete",
    run: (c, o) => c.reports.delete(ID, o),
    sent: "/v1/reports/id-1",
  },
  {
    id: "shareReport",
    method: "reports.share",
    run: (c, o) => c.reports.share(ID, o),
    sent: "/v1/reports/id-1/share",
  },
  {
    id: "revokeReport",
    method: "reports.revoke",
    run: (c, o) => c.reports.revoke(ID, o),
    sent: "/v1/reports/id-1/revoke",
  },
  // dashboard
  {
    id: "getDashboard",
    method: "dashboard.get",
    run: (c, o) => c.dashboard.get({ month: "2026-08", sort: "roi" }, o),
    sent: "/v1/dashboard?month=2026-08&sort=roi",
  },
  {
    id: "listRenewals",
    method: "dashboard.listRenewals",
    run: (c, o) => c.dashboard.listRenewals(undefined, o),
    sent: "/v1/dashboard/renewals",
  },
  // apiKeys
  {
    id: "createApiKey",
    method: "apiKeys.create",
    run: (c, o) => c.apiKeys.create({ name: "ci", scopes: ["read"] }, o),
    sent: "/v1/api-keys",
    body: '{"name":"ci","scopes":["read"]}',
  },
  {
    id: "listApiKeys",
    method: "apiKeys.list",
    run: (c, o) => c.apiKeys.list(undefined, o),
    sent: "/v1/api-keys",
  },
  {
    id: "getApiKey",
    method: "apiKeys.get",
    run: (c, o) => c.apiKeys.get(ID, o),
    sent: "/v1/api-keys/id-1",
  },
  {
    id: "revokeApiKey",
    method: "apiKeys.revoke",
    run: (c, o) => c.apiKeys.revoke(ID, o),
    sent: "/v1/api-keys/id-1/revoke",
  },
  // health
  {
    id: "getHealth",
    method: "health.get",
    run: (c, o) => c.health.get(o),
    sent: "/healthz",
  },
  // workspace
  {
    id: "getWorkspace",
    method: "workspace.get",
    run: (c, o) => c.workspace.get(o),
    sent: "/v1/workspace",
  },
  // onboarding
  {
    id: "getOnboarding",
    method: "onboarding.get",
    run: (c, o) => c.onboarding.get(o),
    sent: "/v1/onboarding",
  },
  {
    id: "setOnboardingSkippedSteps",
    method: "onboarding.setSkippedSteps",
    run: (c, o) =>
      c.onboarding.setSkippedSteps(
        { steps: ["add_agent", "bring_in_data"] },
        o,
      ),
    sent: "/v1/onboarding/skipped-steps",
    body: '{"steps":["add_agent","bring_in_data"]}',
  },
];

const SENTINEL = "__money__";

/** A value with `leaf` at `path`, building an object or an array at each step. */
function valueAt(path: JsonPath, leaf: unknown): unknown {
  const [head, ...rest] = path;
  if (head === undefined) return leaf;
  const inner = valueAt(rest, leaf);
  return head === ITEMS ? [inner] : { [head]: inner };
}

/**
 * The default success body of an operation: a list's envelope for a list,
 * and, where the operation returns money, the money text at its first money
 * path, written so a float cannot carry it.
 */
function answerFor(id: OperationId): Answer {
  const operation = OPERATIONS[id];
  if (operation.status === 204) {
    return () => new Response(null, { status: 204 });
  }
  const base: Record<string, unknown> = { id: "r-1" };
  const [moneyPath] = operation.responseMoney;
  if (moneyPath !== undefined) {
    const [head, ...rest] = moneyPath;
    if (head === undefined || head === ITEMS) {
      throw new Error(`${id}: a money path starts with a member`);
    }
    base[head] = valueAt(rest, SENTINEL);
  }
  if (operation.list !== null) {
    base.data ??= [{ id: "item-1" }];
    base.has_more = false;
    base.next_cursor = null;
  }
  const text = JSON.stringify(base).replace(`"${SENTINEL}"`, MONEY_TEXT);
  return () =>
    new Response(text, {
      status: operation.status,
      headers: { "Content-Type": "application/json" },
    });
}

/** Follows `path` through `value`, taking the first item at each ITEMS. */
function follow(value: unknown, path: JsonPath): unknown {
  let at = value;
  for (const segment of path) {
    if (segment === ITEMS) {
      if (!Array.isArray(at)) throw new Error("expected an array");
      at = at[0];
    } else {
      if (!isRecord(at)) throw new Error(`expected an object at ${segment}`);
      at = at[segment];
    }
  }
  return at;
}

/** The decoded body of a call's result: a page's body, or the result itself. */
function bodyOf(result: unknown): unknown {
  return result instanceof PageClass ? result.body : result;
}

/** Wraps `group.method` on a client, counting its calls. */
function countCalls(c: Allisall, method: string): () => number {
  const [group = "", name = ""] = method.split(".");
  const target: unknown = Reflect.get(c, group);
  if (typeof target !== "object" || target === null) {
    throw new Error(`no group ${group}`);
  }
  const fn: unknown = Reflect.get(target, name);
  if (typeof fn !== "function") throw new Error(`no method ${method}`);
  let calls = 0;
  Reflect.set(target, name, function (this: unknown, ...args: unknown[]) {
    calls++;
    return Reflect.apply(fn, this, args);
  });
  return () => calls;
}

const CONTENT_TYPES = {
  none: undefined,
  json: "application/json",
  "merge-patch": "application/merge-patch+json",
  multipart: undefined,
} as const;

describe("the table of methods below", () => {
  it("covers every operation the client calls, once each", () => {
    const ids = ROWS.map((r) => r.id).sort();
    expect(new Set(ids).size).toBe(ids.length);
    const clientOperations = Object.keys(OPERATIONS)
      .filter((id) => id !== "getSharedReport")
      .sort();
    expect(clientOperations).toHaveLength(67);
    expect(ids).toEqual(clientOperations);
  });
});

describe("every method", () => {
  it.each(ROWS)(
    "$method sends $id's method, path, query and body, with the call's options, and decodes its answer",
    async (row) => {
      const operation = OPERATIONS[row.id];
      const { fetch, sent } = recorder([row.answer ?? answerFor(row.id)]);
      const c = client(fetch);
      const calls = countCalls(c, row.method);
      const result = await row.run(c, {
        headers: { "X-Trace": "t-1" },
        idempotencyKey: "key-1",
      });
      expect(calls()).toBe(1);
      const req = only(sent);

      // The operation's own method and path, with the id filled in.
      expect(req.method).toBe(operation.method);
      const url = new URL(req.url);
      expect(url.origin).toBe(BASE);
      expect(url.pathname).toBe(operation.path.replace("{id}", ID));
      expect(url.pathname + url.search).toBe(row.sent);

      // The body its kind sends.
      expect(req.headers["content-type"]).toBe(CONTENT_TYPES[operation.body]);
      if (operation.body === "json" || operation.body === "merge-patch") {
        expect(row.body, "a JSON operation's row names its body").toBeDefined();
        expect(req.text).toBe(row.body);
      } else if (operation.body === "multipart") {
        const form = instance(req.body, FormData);
        expect([...form.keys()]).toEqual(["mapping", "file"]);
      } else {
        expect(req.body).toBeUndefined();
      }

      // The credential its policy calls for, and the call's options.
      expect(req.headers.authorization).toBe(
        operation.access === "Public" ? undefined : "Bearer aia_k",
      );
      expect(req.headers["x-trace"]).toBe("t-1");
      expect(req.headers["idempotency-key"]).toBe(
        operation.idempotent ? "key-1" : undefined,
      );

      // The decoded answer.
      if (row.check !== undefined) {
        row.check(result);
      } else if (operation.status === 204) {
        expect(result).toBeUndefined();
      } else {
        const body = bodyOf(result);
        const [moneyPath] = operation.responseMoney;
        if (moneyPath === undefined) {
          expect(body).toMatchObject({ id: "r-1" });
        } else {
          // A Decimal is the money's own text; a float would have rounded it.
          expect(follow(body, moneyPath)).toBe(MONEY_TEXT);
        }
        if (operation.list !== null) {
          const page = instance(result, PageClass);
          expect(page.data).toEqual(isRecord(body) ? body.data : undefined);
        } else {
          expect(result).not.toBeInstanceOf(PageClass);
        }
      }
    },
  );

  it("decode money on 30 of the methods, and getSharedReport on the 31st", () => {
    // The answers above hold money only where the operation returns some.
    expect(
      ROWS.filter((r) => OPERATIONS[r.id].responseMoney.length > 0),
    ).toHaveLength(30);
    expect(OPERATIONS.getSharedReport.responseMoney.length).toBeGreaterThan(0);
  });
});

// ---- Session-only operations ----

const SESSION_ONLY = ROWS.filter(
  (r) => OPERATIONS[r.id].access === "SessionOnly",
);

describe("a session-only method called with an API key", () => {
  it("is one of nine", () => {
    expect(SESSION_ONLY.map((r) => r.id).sort()).toEqual(
      [
        "createApiKey",
        "getApiKey",
        "listApiKeys",
        "publishCalculation",
        "reopenCalculation",
        "revokeApiKey",
        "revokeReport",
        "shareReport",
        "validateCalculation",
      ].sort(),
    );
  });

  it.each(SESSION_ONLY)(
    "$method sends the key, and surfaces the API's 403 session_required as an ApiError",
    async (row) => {
      const { fetch, sent } = recorder([
        () => problem(403, "session_required"),
      ]);
      const err = await rejection(row.run(client(fetch), {}));
      const apiError = instance(err, ApiError);
      expect(apiError.status).toBe(403);
      expect(apiError.code).toBe("session_required");
      // Sent, not refused before sending, and not retried.
      expect(only(sent).headers.authorization).toBe("Bearer aia_k");
    },
  );
});

// ---- The method names ----

const GROUPS = [
  "events",
  "imports",
  "clients",
  "agents",
  "valueModels",
  "outcomeTypes",
  "cost",
  "analytics",
  "calculations",
  "reports",
  "dashboard",
  "apiKeys",
  "health",
  "workspace",
  "onboarding",
];

/** The tag and path of each operation in a document. */
function operationsOf(doc: Json): Map<string, { tag: string; path: string }> {
  const out = new Map<string, { tag: string; path: string }>();
  const paths = isRecord(doc) && isRecord(doc.paths) ? doc.paths : {};
  for (const [path, item] of Object.entries(paths)) {
    if (!isRecord(item)) continue;
    for (const operation of Object.values(item)) {
      if (!isRecord(operation) || typeof operation.operationId !== "string") {
        continue;
      }
      const [tag] = Array.isArray(operation.tags) ? operation.tags : [];
      if (typeof tag !== "string") throw new Error("an operation has no tag");
      out.set(operation.operationId, { tag, path });
    }
  }
  return out;
}

function capitalised(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/** A path parameter naming one of these is a parent's, unless the group is its own. */
const PARENTS: Record<string, { noun: string; group: string }> = {
  clients: { noun: "Client", group: "clients" },
  calculations: { noun: "Calculation", group: "calculations" },
};

/**
 * The one name the rule does not give: `listValueTemplates`, whose noun
 * `Value` is the first word of the group's, `Value models`.
 */
const NAMED_APART: Record<string, string> = {
  listValueTemplates: "listTemplates",
};

/**
 * The naming rule, as `group.method`: the group is the tag in camelCase; the
 * verb comes from the operationId; the group's own noun is dropped; a path
 * id naming a parent adds `For<Parent>`; any other noun stays.
 */
function methodOf(operationId: string, tag: string, path: string): string {
  const words = tag.split(" ");
  const group =
    (words[0] ?? "").toLowerCase() + words.slice(1).map(capitalised).join("");
  const apart = NAMED_APART[operationId];
  if (apart !== undefined) return `${group}.${apart}`;
  const verb = /^[a-z]+/.exec(operationId)?.[0] ?? "";
  let rest = operationId.slice(verb.length);
  const plural = words.map(capitalised).join("");
  const singular = plural.endsWith("s") ? plural.slice(0, -1) : plural;
  for (const noun of [plural, singular]) {
    if (rest.includes(noun)) {
      rest = rest.replace(noun, "");
      break;
    }
  }
  const segments = path.split("/").filter((s) => s !== "" && s !== "v1");
  const parent =
    segments[1] === "{id}" ? PARENTS[segments[0] ?? ""] : undefined;
  if (parent !== undefined && parent.group !== group) {
    rest = `${rest.replace(parent.noun, "")}For${parent.noun}`;
  }
  return `${group}.${verb}${rest}`;
}

/** Every method of every group of a client, as `group.method`. */
function methodsOf(c: Allisall): string[] {
  const out: string[] = [];
  for (const group of Object.keys(c)) {
    const value: unknown = Reflect.get(c, group);
    if (typeof value !== "object" || value === null) continue;
    const proto: unknown = Object.getPrototypeOf(value);
    if (typeof proto !== "object" || proto === null) continue;
    for (const name of Object.getOwnPropertyNames(proto)) {
      if (name === "constructor") continue;
      if (typeof Reflect.get(proto, name) === "function") {
        out.push(`${group}.${name}`);
      }
    }
  }
  return out.sort();
}

/** The methods the rule names for a set of operations, less the share-token one. */
function expectedMethods(
  ids: readonly string[],
  doc: Json,
  shareToken: ReadonlySet<string>,
): string[] {
  const tagged = operationsOf(doc);
  return ids
    .filter((id) => !shareToken.has(id))
    .map((id) => {
      const op = tagged.get(id);
      if (op === undefined) throw new Error(`${id} is not in the document`);
      return methodOf(id, op.tag, op.path);
    })
    .sort();
}

/** What is in `expected` and not in `actual`, and the reverse. */
function difference(
  expected: readonly string[],
  actual: readonly string[],
): { missing: string[]; extra: string[] } {
  return {
    missing: expected.filter((m) => !actual.includes(m)),
    extra: actual.filter((m) => !expected.includes(m)),
  };
}

const SHARE_TOKEN = new Set(
  // The operation table has one key per OperationId, and no other.
  (Object.keys(OPERATIONS) as OperationId[]).filter(
    (id) => OPERATIONS[id].access === "ShareToken",
  ),
);

describe("the client's groups", () => {
  it("are the fifteen of the API's tags with a client method, without sharedReports", () => {
    const c = client(recorder().fetch);
    expect(Object.keys(c).sort()).toEqual([...GROUPS].sort());
  });
});

describe.skipIf(spec === null)("the method names", () => {
  it("are the naming rule's name for each of the 68 operations, both ways, with the share-token one a function", () => {
    const actual = methodsOf(client(recorder().fetch));
    const expected = expectedMethods(
      Object.keys(OPERATIONS),
      spec,
      SHARE_TOKEN,
    );
    expect(expected).toHaveLength(67);
    expect(difference(expected, actual)).toEqual({ missing: [], extra: [] });
    // The 0.3 and 0.4 operations take the rule's names, with no new
    // exception: listCalculations, listReports, listImports and listEvents
    // drop their noun, getImport becomes imports.get, and getEventSummary
    // and listEventArrivals become events.getSummary and
    // events.listArrivals (question 18).
    expect(actual).toEqual(
      expect.arrayContaining([
        "workspace.get",
        "onboarding.get",
        "onboarding.setSkippedSteps",
        "calculations.list",
        "reports.list",
        "imports.list",
        "imports.get",
        "events.list",
        "events.getSummary",
        "events.listArrivals",
      ]),
    );
    // The one ShareToken operation is the standalone function.
    expect([...SHARE_TOKEN]).toEqual(["getSharedReport"]);
    expect(typeof getSharedReport).toBe("function");
  });

  it("name each row's method, so each method above is tied to its operation", () => {
    const tagged = operationsOf(spec);
    for (const row of ROWS) {
      const op = tagged.get(row.id);
      expect(op, row.id).toBeDefined();
      if (op !== undefined) {
        expect(methodOf(row.id, op.tag, op.path), row.id).toBe(row.method);
      }
    }
  });

  it("fail when the document gains an operation no method calls", async () => {
    // The check above must be able to fail: add an operation to a copy of
    // the document, regenerate the operation table, and compare again.
    const mutated: Json = parse(specText ?? "");
    if (!isRecord(mutated) || !isRecord(mutated.paths))
      throw new Error("no paths");
    const agents = mutated.paths["/v1/agents"];
    if (!isRecord(agents) || !isRecord(agents.get))
      throw new Error("no listAgents");
    mutated.paths["/v1/widgets"] = {
      get: { ...structuredClone(agents.get), operationId: "listWidgets" },
    };
    const href = new URL("../scripts/generate.mjs", import.meta.url).href;
    const module: unknown = await import(href);
    const generate: unknown = isRecord(module) ? module.generate : undefined;
    if (typeof generate !== "function") throw new Error("no generate");
    const files: unknown = await Reflect.apply(generate, undefined, [
      stringify(mutated),
    ]);
    const table: unknown = isRecord(files)
      ? files["src/generated/operations.ts"]
      : undefined;
    if (typeof table !== "string") throw new Error("no operation table");
    const body = table.slice(table.indexOf("export const OPERATIONS"));
    const ids = [...body.matchAll(/^ {2}(\w+): \{$/gm)].map((m) => m[1] ?? "");
    expect(ids).toHaveLength(69);

    const actual = methodsOf(client(recorder().fetch));
    const expected = expectedMethods(ids, mutated, SHARE_TOKEN);
    expect(difference(expected, actual)).toEqual({
      missing: ["agents.listWidgets"],
      extra: [],
    });
  });
});

// ---- The guided setup ----

describe("onboarding.get", () => {
  it("keeps a step the SDK does not list, in current_step and in a step's step", async () => {
    const answer = {
      steps: [
        { step: "add_client", completed: true, skipped_at: null },
        {
          step: "a_step_added_later",
          completed: false,
          skipped_at: "2026-11-02T10:05:00Z",
        },
      ],
      current_step: "a_step_added_later",
      has_published: false,
    };
    const { fetch } = recorder([() => json(200, answer)]);
    const progress = await client(fetch).onboarding.get();
    expect(progress.current_step).toBe("a_step_added_later");
    expect(progress.steps.map((s) => s.step)).toEqual([
      "add_client",
      "a_step_added_later",
    ]);
    expect(progress).toEqual(answer);
  });

  it("keeps a null current_step", async () => {
    const { fetch } = recorder([
      () => json(200, { steps: [], current_step: null, has_published: true }),
    ]);
    const progress = await client(fetch).onboarding.get();
    expect(progress.current_step).toBeNull();
  });
});

describe("onboarding.setSkippedSteps", () => {
  it("sends an empty set as [], which clears every skip", async () => {
    const { fetch, sent } = recorder([
      () => json(200, { steps: [], current_step: null, has_published: false }),
    ]);
    await client(fetch).onboarding.setSkippedSteps({ steps: [] });
    const req = only(sent);
    expect(req.method).toBe("PUT");
    expect(req.text).toBe('{"steps":[]}');
  });
});

// ---- The event drill-down through its method ----

describe("events.listForClient", () => {
  it("gives a page whose body holds total, and continues by cursor without page", async () => {
    const { fetch, sent } = recorder([
      () =>
        json(200, {
          data: [{ id: "e-1" }],
          has_more: true,
          next_cursor: "c-2",
          total: 7,
          period: { from: "2026-08-01T00:00:00Z", to: "2026-09-01T00:00:00Z" },
        }),
      () =>
        json(200, {
          data: [{ id: "e-2" }],
          has_more: false,
          next_cursor: null,
          total: 7,
          period: { from: "2026-08-01T00:00:00Z", to: "2026-09-01T00:00:00Z" },
        }),
    ]);
    const page = await client(fetch).events.listForClient(ID, {
      from: "2026-08-01T00:00:00Z",
      to: "2026-09-01T00:00:00Z",
      page: 3,
    });
    expect(page.body.total).toBe(7);
    expect(page.data.map((e) => e.id)).toEqual(["e-1"]);
    const next = await page.getNextPage();
    expect(next.data.map((e) => e.id)).toEqual(["e-2"]);
    expect(sent.map((r) => new URL(r.url).search)).toEqual([
      "?from=2026-08-01T00%3A00%3A00Z&to=2026-09-01T00%3A00%3A00Z&page=3",
      "?from=2026-08-01T00%3A00%3A00Z&to=2026-09-01T00%3A00%3A00Z&cursor=c-2",
    ]);
    expect(
      instance(await rejection(next.getNextPage()), AllisallError),
    ).toBeInstanceOf(AllisallError);
    expect(sent).toHaveLength(2);
  });

  it("sends nothing for a call whose result is never used", () => {
    const { fetch, sent } = recorder();
    void client(fetch).events.listForClient(ID, { from: "a", to: "b" });
    expect(sent).toHaveLength(0);
  });
});

describe("clients.list", () => {
  it("walks three pages with for await, each with its own cursor", async () => {
    const page =
      (ids: string[], cursor: string | null): Answer =>
      () =>
        json(200, {
          data: ids.map((id) => ({ id })),
          has_more: cursor !== null,
          next_cursor: cursor,
        });
    const { fetch, sent } = recorder([
      page(["a", "b"], "c-2"),
      page(["c", "d"], "c-3"),
      page(["e"], null),
    ]);
    const seen: string[] = [];
    for await (const item of client(fetch).clients.list({ limit: 2 })) {
      seen.push(item.id);
    }
    expect(seen).toEqual(["a", "b", "c", "d", "e"]);
    expect(sent.map((r) => new URL(r.url).search)).toEqual([
      "?limit=2",
      "?limit=2&cursor=c-2",
      "?limit=2&cursor=c-3",
    ]);
  });
});

describe("valueModels.get", () => {
  it("returns archived_at as the instant's text, or null", async () => {
    const model = { id: ID, status: "archived", line_items: [] };
    const { fetch } = recorder([
      () => json(200, { ...model, archived_at: "2026-08-02T04:15:00Z" }),
      () => json(200, { ...model, status: "active", archived_at: null }),
    ]);
    const c = client(fetch);
    const archived = await c.valueModels.get(ID);
    expectTypeOf(archived.archived_at).toEqualTypeOf<string | null>();
    expect(archived.archived_at).toBe("2026-08-02T04:15:00Z");
    expect((await c.valueModels.get(ID)).archived_at).toBeNull();
  });
});

/** A report summary as a 0.4 server sends it. */
const REPORT_SUMMARY = {
  id: "r-1",
  calculation_id: ID,
  client_id: "c-1",
  client_name: "Acme Logistics",
  period: { from: "2026-08-01T00:00:00Z", to: "2026-09-01T00:00:00Z" },
  state: "draft",
  letterhead_client_name: "Acme",
  letterhead_workspace_name: "Northwind",
  note: "",
  share_token: null,
  shared_at: null,
  revoked_at: null,
  first_viewed_at: null,
  last_viewed_at: null,
  created_at: "2026-09-01T00:00:00Z",
} satisfies ReportSummary;

describe("a client's renewal term", () => {
  it("is sent on create and update, null clears it, and the client returns it", async () => {
    const answer = (renewal_term: string | null) => () =>
      json(200, { id: ID, renewal_date: "2027-03-31", renewal_term });
    const { fetch, sent } = recorder([
      answer("annual"),
      answer("monthly"),
      answer(null),
    ]);
    const c = client(fetch);
    const created = await c.clients.create({
      name: "Acme",
      status: "active",
      renewal_date: "2027-03-31",
      renewal_term: "annual",
    });
    expectTypeOf(created.renewal_term).toEqualTypeOf<
      RenewalTerm | (string & {}) | null
    >();
    expect(created.renewal_term).toBe("annual");
    expect(
      (await c.clients.update(ID, { renewal_term: "monthly" })).renewal_term,
    ).toBe("monthly");
    expect(
      (await c.clients.update(ID, { renewal_term: null })).renewal_term,
    ).toBeNull();
    expect(sent.map((r) => r.text)).toEqual([
      '{"name":"Acme","status":"active","renewal_date":"2027-03-31","renewal_term":"annual"}',
      '{"renewal_term":"monthly"}',
      '{"renewal_term":null}',
    ]);
  });
});

describe("reports.listForCalculation", () => {
  it("gives each report as a summary, without disclosures", async () => {
    const { fetch, sent } = recorder([
      () =>
        json(200, {
          data: [REPORT_SUMMARY],
          has_more: false,
          next_cursor: null,
        }),
    ]);
    const page = await client(fetch).reports.listForCalculation(ID);
    expect(page.data).toEqual([REPORT_SUMMARY]);
    expect(page.data[0]).not.toHaveProperty("disclosures");
    expect(new URL(only(sent).url).pathname).toBe(
      "/v1/calculations/id-1/reports",
    );
  });
});

/** An import as a 0.4 server reads it back, with the mapping it ran with. */
const IMPORT = {
  id: "imp-1",
  filename: "august.csv",
  total_rows: 3,
  accepted: 2,
  duplicates: 1,
  rejected: 0,
  created_at: "2026-09-01T00:00:00Z",
  mapping: {
    columns: { timestamp: "Time", agent_key: "Agent" },
    constants: { category: "task" },
    timezone: "Asia/Tokyo",
    delimiter: ";",
  },
} satisfies Import;

describe("imports.get and toImportMapping", () => {
  it("sends the mapping an import ran with as the next commit's mapping", async () => {
    const { fetch, sent } = recorder([
      () => json(200, IMPORT),
      () =>
        json(200, {
          batch_id: "imp-2",
          accepted: 0,
          duplicates: 0,
          rejected: 0,
          errors: [],
          errors_truncated: false,
        }),
    ]);
    const c = client(fetch);
    const read = await c.imports.get("imp-1");
    const mapping = toImportMapping(read.mapping);
    expectTypeOf(mapping).toEqualTypeOf<ImportMapping>();
    await c.imports.commit({ mapping, file: "Time;Agent\n" });

    expect(sent).toHaveLength(2);
    const form = instance(sent[1]?.body, FormData);
    const part = form.get("mapping");
    const text = part instanceof Blob ? await part.text() : part;
    expect(JSON.parse(String(text))).toEqual(IMPORT.mapping);
    // A copy: changing the result leaves the read mapping as it was.
    mapping.columns = {};
    expect(read.mapping.columns).toEqual(IMPORT.mapping.columns);
  });

  it("keeps a delimiter the SDK does not list, on the read and on the way back", async () => {
    const unlisted = {
      ...IMPORT,
      mapping: { ...IMPORT.mapping, delimiter: "|" },
    };
    const { fetch } = recorder([() => json(200, unlisted)]);
    const read = await client(fetch).imports.get("imp-1");
    expectTypeOf(read.mapping.delimiter).toEqualTypeOf<
      ImportDelimiter | (string & {})
    >();
    expect(read.mapping.delimiter).toBe("|");
    expect(toImportMapping(read.mapping)).toEqual(unlisted.mapping);
  });
});

describe("reports.list", () => {
  it("keeps a state the SDK does not list, as the server sent it", async () => {
    const unknown = { ...REPORT_SUMMARY, state: "archived" };
    const { fetch } = recorder([
      () =>
        json(200, {
          page: null,
          total: null,
          data: [unknown, REPORT_SUMMARY],
          has_more: false,
          next_cursor: null,
        }),
    ]);
    const page = await client(fetch).reports.list();
    expectTypeOf(page.data[0]?.state).toEqualTypeOf<
      ReportState | (string & {}) | undefined
    >();
    expect(page.data.map((r) => r.state)).toEqual(["archived", "draft"]);
    expect(page.data[0]).toEqual(unknown);
  });
});

describe("reports.update", () => {
  it("sends the letterhead under its new names, and the type refuses the old ones", async () => {
    const { fetch, sent } = recorder([
      () => json(200, { ...REPORT_SUMMARY, disclosures: [] }),
    ]);
    await client(fetch).reports.update(ID, {
      letterhead_client_name: "Acme Holdings",
      letterhead_workspace_name: "Northwind Partners",
    });
    expect(only(sent).text).toBe(
      '{"letterhead_client_name":"Acme Holdings","letterhead_workspace_name":"Northwind Partners"}',
    );
    // @ts-expect-error: the letterhead's old name is no member of ReportPatch.
    const old: ReportPatch = { client_name: "Acme" };
    // @ts-expect-error: nor is the other.
    const older: ReportPatch = { workspace_name: "Northwind" };
    expect([old, older]).toHaveLength(2);
  });
});

describe("calculations.list", () => {
  it("gives each calculation with its client's name and its coverage findings", async () => {
    const item = {
      id: "calc-1",
      client_id: "c-1",
      client_name: "Acme Logistics",
      coverage_findings: 2,
    };
    const { fetch } = recorder([
      () =>
        json(200, {
          page: 1,
          total: 1,
          data: [item],
          has_more: false,
          next_cursor: null,
        }),
    ]);
    const page = await client(fetch).calculations.list({ page: 1 });
    expectTypeOf(page.body).toEqualTypeOf<WorkspaceCalculationList>();
    expect(page.data[0]?.client_name).toBe("Acme Logistics");
    expect(page.data[0]?.coverage_findings).toBe(2);
    expect(page.body.total).toBe(1);
  });
});

describe("a page's request", () => {
  it("carries every member of the call's arguments, with paging's query and options", () => {
    const signal = new AbortController().signal;
    const args = {
      path: { id: ID },
      query: { limit: 2, page: 3 },
      body: { kept: true },
      options: { timeout: 5 },
      shareToken: "kept",
    };
    const next = pageArgs(args, { limit: 2, cursor: "c-2" }, { signal });
    expect(next).toEqual({
      path: { id: ID },
      query: { limit: 2, cursor: "c-2" },
      body: { kept: true },
      options: { signal },
      shareToken: "kept",
    });
    // The call's own arguments are not changed.
    expect(args.query).toEqual({ limit: 2, page: 3 });
  });
});

// ---- The shared report ----

const REPORT_TEXT = `{"client_name":"Acme","compared_to":{"cost_total":${MONEY_TEXT}}}`;

function reportAnswer(): Response {
  return new Response(REPORT_TEXT, {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("getSharedReport", () => {
  it("sends the share token as Authorization: Report, never the client's key, and decodes money", async () => {
    vi.stubEnv("AIA_API_KEY", "aia_from_env");
    const { fetch, sent } = recorder([reportAnswer]);
    const report = await getSharedReport("  tok-1 \n", {
      baseURL: BASE,
      fetch,
    });
    const req = only(sent);
    expect(req.method).toBe("GET");
    expect(req.url).toBe(`${BASE}/report`);
    expect(req.headers.authorization).toBe("Report tok-1");
    expect(req.body).toBeUndefined();
    expect(follow(report, ["compared_to", "cost_total"])).toBe(MONEY_TEXT);
  });

  it("never reads AIA_API_KEY: a key in the environment is not sent", async () => {
    const key = "aia_7Hq2Lr9xPz4KbN0cW8eVt3Ys6Jd1Mf5G";
    vi.stubEnv("AIA_API_KEY", key);
    const { fetch, sent } = recorder([reportAnswer]);
    await getSharedReport("tok-1", { baseURL: BASE, fetch });
    const req = only(sent);
    expect(req.headers.authorization).toBe("Report tok-1");
    // No header carries the key, as a bearer or in any other form.
    for (const [name, value] of Object.entries(req.headers)) {
      expect(value, name).not.toContain(key);
      expect(value, name).not.toMatch(/^Bearer /);
    }
  });

  it("needs no credential in the environment", async () => {
    vi.stubEnv("AIA_API_KEY", undefined);
    const { fetch, sent } = recorder([reportAnswer]);
    await getSharedReport("tok-1", { baseURL: BASE, fetch });
    expect(only(sent).headers.authorization).toBe("Report tok-1");
  });

  it("takes AIA_BASE_URL, then the API's own host, when no baseURL is given", async () => {
    vi.stubEnv("AIA_BASE_URL", "https://env.example.test/");
    const first = recorder([reportAnswer]);
    await getSharedReport("tok-1", { fetch: first.fetch });
    expect(only(first.sent).url).toBe("https://env.example.test/report");

    vi.stubEnv("AIA_BASE_URL", "");
    const second = recorder([reportAnswer]);
    await getSharedReport("tok-1", { fetch: second.fetch });
    expect(only(second.sent).url).toBe("https://api.allisai.ai/report");
  });

  it("refuses a path-only baseURL outside a browser, sending nothing", async () => {
    const { fetch, sent } = recorder([reportAnswer]);
    const err = await rejection(
      getSharedReport("tok-1", { baseURL: "/api", fetch }),
    );
    expect(err).toBeInstanceOf(AllisallError);
    expect(sent).toHaveLength(0);
  });

  it("in a browser, resolves a path-only baseURL on the page's origin and needs no opt-in, even for a token starting aia_", async () => {
    vi.stubGlobal("document", {});
    vi.stubGlobal("location", { href: "https://app.example.test/r/x" });
    const { fetch, sent } = recorder([reportAnswer]);
    await getSharedReport("aia_tok", { baseURL: "/api", fetch });
    const req = only(sent);
    expect(req.url).toBe("https://app.example.test/api/report");
    expect(req.headers.authorization).toBe("Report aia_tok");
    expect(req.headers["user-agent"]).toBeUndefined();
  });

  it.each([
    ["empty", ""],
    ["white space", " \t "],
    ["holding a newline", "s3cr3t\n-9"],
    ["not a string", 7],
  ])(
    "refuses a share token %s with an AllisallError, sending nothing",
    async (_, token) => {
      const { fetch, sent } = recorder([reportAnswer]);
      // The value is deliberately not a string in one case, to check the run-time guard.
      const err = await rejection(
        getSharedReport(token as string, { baseURL: BASE, fetch }),
      );
      const allisallError = instance(err, AllisallError);
      // The message never quotes the token.
      expect(allisallError.message).not.toContain("s3cr3t");
      expect(sent).toHaveLength(0);
    },
  );

  it("surfaces the API's 404 as an ApiError", async () => {
    const { fetch } = recorder([() => problem(404, "not_found")]);
    const err = instance(
      await rejection(getSharedReport("tok-1", { baseURL: BASE, fetch })),
      ApiError,
    );
    expect(err.status).toBe(404);
    expect(err.code).toBe("not_found");
  });

  it("sends a call's headers, and refuses one the SDK owns before sending", async () => {
    const first = recorder([reportAnswer]);
    await getSharedReport("tok-1", {
      baseURL: BASE,
      fetch: first.fetch,
      headers: { "X-Edge": "e-1" },
    });
    expect(only(first.sent).headers["x-edge"]).toBe("e-1");

    const second = recorder([reportAnswer]);
    const err = await rejection(
      getSharedReport("tok-1", {
        baseURL: BASE,
        fetch: second.fetch,
        headers: { authorization: "Bearer aia_k" },
      }),
    );
    expect(err).toBeInstanceOf(TypeError);
    expect(second.sent).toHaveLength(0);
  });

  it("refuses a timeout or maxRetries a client would refuse, before sending", async () => {
    const { fetch, sent } = recorder([reportAnswer]);
    expect(
      await rejection(
        getSharedReport("tok-1", { baseURL: BASE, fetch, timeout: 0 }),
      ),
    ).toBeInstanceOf(AllisallError);
    expect(
      await rejection(
        getSharedReport("tok-1", { baseURL: BASE, fetch, maxRetries: -1 }),
      ),
    ).toBeInstanceOf(AllisallError);
    expect(sent).toHaveLength(0);
  });

  describe("on a fake clock", () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
    });

    it("is retried as a GET, with the share token on every attempt", async () => {
      const { fetch, sent } = recorder([
        () => problem(500, "internal_error"),
        reportAnswer,
      ]);
      const report = getSharedReport("tok-1", { baseURL: BASE, fetch });
      await vi.runAllTimersAsync();
      await report;
      expect(sent.map((r) => r.headers.authorization)).toEqual([
        "Report tok-1",
        "Report tok-1",
      ]);
    });

    it("takes a maxRetries of 0 as one attempt", async () => {
      const { fetch, sent } = recorder([], () =>
        problem(500, "internal_error"),
      );
      const caught = getSharedReport("tok-1", {
        baseURL: BASE,
        fetch,
        maxRetries: 0,
      }).catch((err: unknown) => err);
      await vi.runAllTimersAsync();
      expect(instance(await caught, ApiError).status).toBe(500);
      expect(sent).toHaveLength(1);
    });
  });
});

describe("a share token at the request layer", () => {
  it("reaches no operation but the shared report's", async () => {
    const { fetch, sent } = recorder();
    const config = transportConfig({ apiKey: "aia_k", baseURL: BASE, fetch });
    const err = await rejection(
      request(config, "getClient", { path: { id: ID }, shareToken: "tok-1" }),
    );
    expect(err).toBeInstanceOf(AllisallError);
    expect(sent).toHaveLength(0);
  });
});

// ---- Signatures, at compile time ----

// Never called: each line is checked by the compiler alone, and the
// expected errors would otherwise send requests.
function signatures(c: Allisall): void {
  expectTypeOf(c.clients.get).returns.toEqualTypeOf<Promise<ClientDetail>>();
  expectTypeOf(c.clients.delete).returns.toEqualTypeOf<Promise<void>>();
  expectTypeOf(c.clients.list).returns.toEqualTypeOf<
    PagePromise<Client, ClientList>
  >();
  expectTypeOf(c.clients.update).parameter(1).toEqualTypeOf<ClientPatch>();
  expectTypeOf(c.clients.update)
    .parameter(2)
    .toEqualTypeOf<RequestOptions | undefined>();
  expectTypeOf(c.clients.create)
    .parameter(1)
    .toEqualTypeOf<IdempotentRequestOptions | undefined>();
  expectTypeOf(c.events.listForClient).returns.toEqualTypeOf<
    PagePromise<AttributedEvent, ClientEventList>
  >();
  expectTypeOf(c.events.ingest).returns.toEqualTypeOf<Promise<IngestSummary>>();
  expectTypeOf(c.cost.getLineItem).returns.toEqualTypeOf<
    Promise<CostLineItem>
  >();
  expectTypeOf(getSharedReport).returns.toEqualTypeOf<Promise<PublicReport>>();
  expectTypeOf(c.reports.listForCalculation).returns.toEqualTypeOf<
    PagePromise<ReportSummary, ReportList>
  >();
  // A list item carries no disclosures; the report's own read has them.
  expectTypeOf<ReportSummary>().not.toHaveProperty("disclosures");
  expectTypeOf<ReportWithPreview>().toHaveProperty("disclosures");
  expectTypeOf<Awaited<ReturnType<typeof c.clients.list>>>().toEqualTypeOf<
    Page<Client, ClientList>
  >();

  // A money body takes a number or a Decimal, and nothing else.
  void c.cost.createLineItem({
    label: "Seats",
    target: { kind: "agent", id: "a-1" },
    monthly_amount: 30000,
    start_date: "2026-08-01",
  });
  void c.cost.updateLineItem(ID, { monthly_amount: decimal("1.5") });
  // @ts-expect-error A string is not money: only a Decimal or a number.
  void c.cost.updateLineItem(ID, { monthly_amount: "1.5" });
  // @ts-expect-error A body without money takes no number where it holds a string.
  void c.clients.create({ name: 1, status: "active" });

  // A required query is required.
  // @ts-expect-error getClientCost needs from and to.
  void c.analytics.getCostForClient(ID);
  // @ts-expect-error getDashboard needs month.
  void c.dashboard.get();
  void c.analytics.getValueForClient(ID);

  // idempotencyKey only on the idempotent operations.
  void c.clients.create(
    { name: "A", status: "active" },
    { idempotencyKey: "k" },
  );
  // @ts-expect-error updateClient takes no Idempotency-Key.
  void c.clients.update(ID, {}, { idempotencyKey: "k" });

  // The CSV import as the design writes it, relying on the API's default
  // delimiter.
  void (async () => {
    const result = await c.imports.commit({
      mapping: {
        columns: {
          timestamp: "Time",
          agent_key: "Agent",
          category: "Category",
          event_type: "Type",
        },
        timezone: "Asia/Tokyo",
      },
      file: await openAsBlob("events.csv"),
    });
    return result;
  })();

  // A merge patch refuses null on a member that cannot be cleared.
  // @ts-expect-error name cannot be cleared.
  void c.clients.update(ID, { name: null });
}
void signatures;

// The seam every method calls through: a query the generated types require
// is required, so a method left with an optional query fails to compile.
// Never called, as above.
function seam(config: TransportConfig): void {
  const period = { from: "2026-08-01", to: "2026-09-01" };
  // @ts-expect-error listClientEvents needs its query.
  void callPage(config, "listClientEvents", { path: { id: ID } });
  // @ts-expect-error getClientCost needs its query.
  void call(config, "getClientCost", { path: { id: ID } });
  // @ts-expect-error getClientRoi needs its query.
  void call(config, "getClientRoi", { path: { id: ID } });
  // @ts-expect-error getClientAnomalies needs its query.
  void call(config, "getClientAnomalies", { path: { id: ID } });
  // @ts-expect-error getDashboard needs its query.
  void call(config, "getDashboard", {});
  // @ts-expect-error A query that is passed must still hold the required parameters.
  void call(config, "getDashboard", { query: { sort: "roi" } });
  void call(config, "getClientCost", { path: { id: ID }, query: period });
  void call(config, "getDashboard", { query: { month: "2026-08" } });
  // An optional query, and an operation that takes none, may be left out.
  void call(config, "getClientValue", { path: { id: ID } });
  void callPage(config, "listClients", {});
  void call(config, "getHealth", {});
}
void seam;
