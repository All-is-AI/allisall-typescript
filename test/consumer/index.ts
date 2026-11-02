// A small consumer of the published package, compiled with TypeScript 5.0
// against dist/*.d.ts. It imports the package by name, so resolution goes
// through package.json "exports", as a partner's project would.

import {
  Allisall,
  AllisallError,
  ApiError,
  type Client,
  type ClientOptions,
  type ClientPatch,
  ConnectionError,
  type CostLineItem,
  type CostLineItemCreate,
  type Decimal,
  decimal,
  type ErrorCode,
  type EventInput,
  getSharedReport,
  type IdempotentRequestOptions,
  type ImportUpload,
  IngestError,
  type IngestSummary,
  type ListClientEventsQuery,
  type MoneyInput,
  type Page,
  type PeriodInput,
  type PublicReport,
  type RequestOptions,
  type SharedReportOptions,
} from "@allisall/sdk";

const options: ClientOptions = {
  apiKey: "aia_example",
  baseURL: "https://api.allisai.ai",
  timeout: 30_000,
  maxRetries: 2,
};
const client = new Allisall(options);

const cost: Decimal = decimal("0.3683");
const events: EventInput[] = [
  {
    timestamp: new Date(),
    agent_key: "support-bot",
    category: "model",
    event_type: "completion",
    model: "gpt-x",
    cost,
    tokens_in: 1200,
    tokens_out: 300,
    metadata: { ticket: "T-1" },
  },
];

const call: RequestOptions = { signal: new AbortController().signal };

export async function run(): Promise<number> {
  try {
    const summary: IngestSummary = await client.events.ingest(events, call);
    return summary.accepted + summary.batches;
  } catch (err) {
    if (err instanceof IngestError) {
      const cause: unknown = err.cause;
      if (cause instanceof ApiError) {
        const code: ErrorCode | undefined = cause.code;
        if (code === "rate_limited") return cause.retryAfter ?? 0;
        return cause.status;
      }
      if (cause instanceof ConnectionError) return cause.requestId.length;
      return err.remainingFrom + err.remaining.length + err.summary.rejected;
    }
    if (err instanceof AllisallError) return -1;
    throw err;
  }
}

// The wire types: money is a Decimal, an open status takes a value added
// later, a merge patch clears with null, and an input instant takes a Date.
export function wire(item: CostLineItem, client: Client): Decimal {
  const status: Client["status"] =
    client.status === "active" ? "a_later_status" : client.status;
  const patch: ClientPatch = { notes: null, name: status };
  const period: PeriodInput = { from: new Date(), to: "2026-09-01T00:00:00Z" };
  void [patch, period];
  return item.monthly_amount;
}

// The resource clients: a call on each of several groups, a list read a
// page at a time and item by item, money as a number, an import, a
// session-only call's error, and the shared report.
export async function resources(clientId: string): Promise<number> {
  let count = 0;
  for await (const c of client.clients.list({ limit: 200 })) {
    count += c.name.length;
  }
  const once: IdempotentRequestOptions = { idempotencyKey: "job-42" };
  const created: Client = await client.clients.create(
    { name: "Acme", status: "active" },
    once,
  );
  const line: MoneyInput<CostLineItemCreate> = {
    label: "Seats",
    target: { kind: "client", id: created.id },
    monthly_amount: 30000,
    start_date: "2026-08-01",
  };
  const item: CostLineItem = await client.cost.createLineItem(line);
  const query: ListClientEventsQuery = {
    from: new Date(),
    to: "2026-09-01T00:00:00Z",
    page: 2,
  };
  const events = await client.events.listForClient(clientId, query);
  if (events.hasNextPage()) {
    const next: Page<(typeof events.data)[number], typeof events.body> =
      await events.getNextPage({ timeout: 5_000 });
    count += next.data.length;
  }
  const upload: ImportUpload = {
    mapping: { timezone: "UTC" },
    file: new Uint8Array([0x61]),
    filename: "events.csv",
  };
  const imported = await client.imports.commit(upload);
  const dashboard = await client.dashboard.get({ month: "2026-08" });
  try {
    await client.calculations.publish(clientId);
  } catch (err) {
    if (err instanceof ApiError && err.code === "session_required") count++;
  }
  const options: SharedReportOptions = { baseURL: "https://api.allisai.ai" };
  const report: PublicReport = await getSharedReport("token", options);
  const health = await client.health.get();
  const agent = await client.agents.get(clientId, { from: new Date() });
  const model = await client.valueModels.getForClient(clientId);
  const outcomes = await client.outcomeTypes.list();
  const roi = await client.analytics.getRoiForClient(clientId, {
    from: "2026-08-01",
    to: "2026-09-01",
  });
  const reports = await client.reports.listForCalculation(clientId);
  const keys = await client.apiKeys.list();
  count +=
    agent.name.length +
    model.version +
    outcomes.data.length +
    roi.currency.length +
    reports.data.length +
    keys.data.length;
  return (
    count +
    events.body.total +
    item.monthly_amount.length +
    imported.accepted +
    dashboard.currency.length +
    report.client_name.length +
    health.status.length
  );
}
