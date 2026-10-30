// A small consumer of the published package, compiled with TypeScript 5.0
// against dist/*.d.ts. It imports the package by name, so resolution goes
// through package.json "exports", as a partner's project would.

import {
  Allisall,
  AllisallError,
  ApiError,
  type ClientOptions,
  ConnectionError,
  type Decimal,
  decimal,
  type ErrorCode,
  type EventInput,
  IngestError,
  type IngestSummary,
  type RequestOptions,
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
