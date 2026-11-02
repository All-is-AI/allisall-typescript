// The operation-call layer every resource method uses: URLs and queries,
// body kinds, credentials, retries and idempotency keys, per-call options,
// lists and their walk, and a path-only base URL in a browser. Each test
// calls a real operation of the operation table through a fake fetch.

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  expectTypeOf,
  it,
  vi,
} from "vitest";
import { Allisall, transportConfig } from "../src/client.js";
import { type Decimal, decimal } from "../src/decimal.js";
import {
  AllisallError,
  ApiError,
  ConnectionError,
  IngestError,
} from "../src/errors.js";
import { OPERATIONS, type OperationId } from "../src/generated/operations.js";
import type { ClientOptions, FetchLike } from "../src/index.js";
import type { Page, PagePromise } from "../src/pagination.js";
import { request, requestPage } from "../src/request.js";
import type {
  Client,
  ClientDetail,
  ClientEventList,
  ClientList,
  CostLineItem,
} from "../src/types.js";
import { event, instance, json, problem, UUID_V4 } from "./helpers.js";

interface Sent {
  method: string;
  url: string;
  /** The headers, by lower-case name. */
  headers: Record<string, string>;
  /** The header names exactly as the SDK wrote them, in order. */
  headerNames: string[];
  /** The members of the RequestInit, in order. */
  initKeys: string[];
  body: Uint8Array | FormData | undefined;
  /** The body as UTF-8, when it is bytes. */
  text: string | undefined;
  signal: AbortSignal | undefined;
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
      headerNames:
        init.headers !== undefined &&
        !(init.headers instanceof Headers) &&
        !Array.isArray(init.headers)
          ? Object.keys(init.headers)
          : [],
      initKeys: Object.keys(init),
      body,
      text:
        body instanceof Uint8Array ? new TextDecoder().decode(body) : undefined,
      signal: init.signal ?? undefined,
    };
    sent.push(req);
    return (queue.shift() ?? fallback)(req);
  };
  return { fetch, sent };
}

function config(fetch: FetchLike, options: ClientOptions = {}) {
  return transportConfig({
    apiKey: "aia_k",
    baseURL: "https://api.example.test",
    ...options,
    fetch,
  });
}

function only<T>(items: readonly T[]): T {
  expect(items).toHaveLength(1);
  const [item] = items;
  if (item === undefined) throw new Error("no item");
  return item;
}

function at<T>(items: readonly T[], i: number): T {
  const item = items[i];
  if (item === undefined) throw new Error(`no item ${i}`);
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

const noContent: Answer = () => new Response(null, { status: 204 });

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("the request each body kind sends", () => {
  it("sends JSON with application/json", async () => {
    const { fetch, sent } = recorder([() => json(201, { id: "c1" })]);
    await request(config(fetch), "createClient", {
      body: { name: "Acme", client_key: "acme" },
    });
    const req = only(sent);
    expect(req.method).toBe("POST");
    expect(req.url).toBe("https://api.example.test/v1/clients");
    expect(req.headers["content-type"]).toBe("application/json");
    expect(req.text).toBe('{"name":"Acme","client_key":"acme"}');
  });

  it("sends merge patch with application/merge-patch+json: null clears, undefined and absent leave the value", async () => {
    const { fetch, sent } = recorder([() => json(200, { id: "c1" })]);
    await request(config(fetch), "updateClient", {
      path: { id: "c1" },
      body: { name: "Acme", notes: null, client_key: undefined },
    });
    const req = only(sent);
    expect(req.method).toBe("PATCH");
    expect(req.url).toBe("https://api.example.test/v1/clients/c1");
    expect(req.headers["content-type"]).toBe("application/merge-patch+json");
    // notes is sent as null to clear it; client_key, undefined, is not sent.
    expect(req.text).toBe('{"name":"Acme","notes":null}');
  });

  it("sends no body and no Content-Type on an operation without a request body", async () => {
    const { fetch, sent } = recorder([() => json(200, { id: "calc" })]);
    await request(config(fetch), "publishCalculation", {
      path: { id: "calc" },
    });
    const req = only(sent);
    expect(req.method).toBe("POST");
    expect(req.url).toBe(
      "https://api.example.test/v1/calculations/calc/publish",
    );
    expect(req.body).toBeUndefined();
    expect(req.initKeys).not.toContain("body");
    expect(req.headers["content-type"]).toBeUndefined();
  });

  it("sends a form and leaves its Content-Type to fetch", async () => {
    const { fetch, sent } = recorder([() => json(200, { accepted: 1 })]);
    await request(config(fetch), "commitImport", {
      body: { mapping: { columns: {} }, file: "a,b\n" },
    });
    const req = only(sent);
    expect(req.body).toBeInstanceOf(FormData);
    expect(req.headers["content-type"]).toBeUndefined();
  });

  it("sends a member the caller added, rather than dropping it", async () => {
    const { fetch, sent } = recorder([() => json(201, { id: "c1" })]);
    await request(config(fetch), "createClient", {
      body: { name: "Acme", nmae: "typo" },
    });
    expect(only(sent).text).toBe('{"name":"Acme","nmae":"typo"}');
  });

  it("resolves a 204 with undefined", async () => {
    const { fetch } = recorder([noContent]);
    const result = await request(config(fetch), "deleteClient", {
      path: { id: "c1" },
    });
    expect(result).toBeUndefined();
  });

  it("refuses a request body with no JSON text, before sending", async () => {
    const { fetch, sent } = recorder();
    const err = await rejection(
      request(config(fetch), "createClient", { body: undefined }),
    );
    expect(err).toBeInstanceOf(TypeError);
    expect(sent).toHaveLength(0);
  });

  it("types each result from the generated types", () => {
    const { fetch } = recorder();
    const c = config(fetch);
    expectTypeOf(request(c, "getClient", { path: { id: "x" } })).toEqualTypeOf<
      Promise<ClientDetail>
    >();
    expectTypeOf(
      request(c, "deleteClient", { path: { id: "x" } }),
    ).toEqualTypeOf<Promise<undefined>>();
    expectTypeOf(requestPage(c, "listClients")).toEqualTypeOf<
      PagePromise<Client, ClientList>
    >();
  });
});

describe("the URL", () => {
  it("percent-encodes a path parameter as one segment", async () => {
    const { fetch, sent } = recorder([() => json(200, { id: "x" })]);
    await request(config(fetch), "getClient", { path: { id: "a/b%c?d#e" } });
    expect(only(sent).url).toBe(
      "https://api.example.test/v1/clients/a%2Fb%25c%3Fd%23e",
    );
  });

  it.each(["", ".", ".."])(
    "refuses the path parameter %j, which a URL cannot hold as one segment",
    async (id) => {
      const { fetch, sent } = recorder();
      const err = await rejection(
        request(config(fetch), "deleteClient", { path: { id } }),
      );
      expect(err).toBeInstanceOf(TypeError);
      expect(sent).toHaveLength(0);
    },
  );

  it("writes the query in the caller's order, a Date as ISO text, leaving undefined out", async () => {
    const { fetch, sent } = recorder([
      () =>
        json(200, {
          data: [],
          has_more: false,
          next_cursor: null,
          total: 0,
        }),
    ]);
    await requestPage(config(fetch), "listClientEvents", {
      path: { id: "c1" },
      query: {
        to: new Date(Date.UTC(2026, 8, 1)),
        category: undefined,
        from: "2026-08-01T00:00:00+09:00",
        limit: 50,
      },
    });
    expect(only(sent).url).toBe(
      "https://api.example.test/v1/clients/c1/events" +
        "?to=2026-09-01T00%3A00%3A00.000Z&from=2026-08-01T00%3A00%3A00%2B09%3A00&limit=50",
    );
  });

  it("refuses an invalid Date in the query, before sending", async () => {
    const { fetch, sent } = recorder();
    const err = await rejection(
      requestPage(config(fetch), "listClientEvents", {
        path: { id: "c1" },
        query: { from: new Date(Number.NaN), to: "2026-09-01T00:00:00Z" },
      }),
    );
    expect(err).toBeInstanceOf(TypeError);
    expect(sent).toHaveLength(0);
  });
});

describe("the credential each access policy sends", () => {
  it("sends no Authorization on a public operation, and never calls the token provider", async () => {
    const { fetch, sent } = recorder([() => json(200, { status: "ok" })]);
    const provider = vi.fn(() => "eyJ.session");
    await request(
      config(fetch, { apiKey: undefined, tokenProvider: provider }),
      "getHealth",
    );
    expect(only(sent).headers.authorization).toBeUndefined();
    expect(provider).not.toHaveBeenCalled();
  });

  it("sends the provider's token as a bearer on a session-only operation", async () => {
    const { fetch, sent } = recorder([
      () => json(200, { data: [], has_more: false, next_cursor: null }),
    ]);
    await requestPage(
      config(fetch, {
        apiKey: undefined,
        tokenProvider: () => " eyJ.session ",
      }),
      "listApiKeys",
    );
    expect(only(sent).headers.authorization).toBe("Bearer eyJ.session");
  });

  it("rejects a resource call with an AllisallError, sending nothing, when the provider returns an empty token", async () => {
    const { fetch, sent } = recorder();
    const err = await rejection(
      request(
        config(fetch, { apiKey: undefined, tokenProvider: () => "" }),
        "getClient",
        {
          path: { id: "c1" },
        },
      ),
    );
    expect(err).toBeInstanceOf(AllisallError);
    expect(sent).toHaveLength(0);
  });

  it("rejects with the provider's own error, unwrapped and not retried", async () => {
    const { fetch, sent } = recorder();
    const own = new Error("no session");
    const provider = vi.fn(async (): Promise<string> => {
      throw own;
    });
    const err = await rejection(
      request(
        config(fetch, { apiKey: undefined, tokenProvider: provider }),
        "getClient",
        {
          path: { id: "c1" },
        },
      ),
    );
    expect(err).toBe(own);
    expect(provider).toHaveBeenCalledTimes(1);
    expect(sent).toHaveLength(0);
  });

  it("refuses the share-token operation, which never takes the client's credential", async () => {
    const { fetch, sent } = recorder();
    const err = await rejection(request(config(fetch), "getSharedReport"));
    expect(err).toBeInstanceOf(AllisallError);
    expect(sent).toHaveLength(0);
  });
});

describe("money", () => {
  it("writes a Decimal and a number at the operation's request money paths", async () => {
    const { fetch, sent } = recorder([() => json(200, { models: [] })]);
    await request(config(fetch), "setPriceTable", {
      body: {
        models: [
          {
            model: "m",
            input_per_1k: decimal("0.000000123456789"),
            output_per_1k: 0.25,
          },
        ],
      },
    });
    expect(only(sent).text).toBe(
      '{"models":[{"model":"m","input_per_1k":0.000000123456789,"output_per_1k":0.25}]}',
    );
  });

  it("decodes a response's money exactly, at its money paths only", async () => {
    const { fetch } = recorder([
      () =>
        new Response(
          '{"id":"li","monthly_amount":0.1234567890123456789,"note_count":0.1234567890123456789}',
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
    ]);
    const item: CostLineItem = await request(config(fetch), "getCostLineItem", {
      path: { id: "li" },
    });
    // A float cannot hold the fixture, so only text decoding passes.
    expect(String(Number("0.1234567890123456789"))).not.toBe(
      "0.1234567890123456789",
    );
    const amount: Decimal | null = item.monthly_amount;
    expect(amount).toBe("0.1234567890123456789");
    expect(Reflect.get(item, "note_count")).toBe(
      Number("0.1234567890123456789"),
    );
  });
});

describe("what the SDK checks in a success response", () => {
  it.each([
    ["an array", "[]"],
    ["a string", '"ok"'],
    ["not JSON", "<html>ok</html>"],
  ])(
    "refuses a body that is %s, as an ApiError with the status, without retrying",
    async (_, text) => {
      const { fetch, sent } = recorder(
        [],
        () => new Response(text, { status: 200 }),
      );
      const err = instance(
        await rejection(
          request(config(fetch), "getClient", { path: { id: "c" } }),
        ),
        ApiError,
      );
      expect(err.status).toBe(200);
      expect(err.problem).toBeUndefined();
      expect(sent).toHaveLength(1);
    },
  );

  it("accepts members it does not know", async () => {
    const { fetch } = recorder([
      () => json(200, { id: "c", added_later: { x: 1 } }),
    ]);
    const client = await request(config(fetch), "getClient", {
      path: { id: "c" },
    });
    expect(Reflect.get(client, "added_later")).toEqual({ x: 1 });
  });
});

// ---- Retries and idempotency ----

/** Every operation the SDK does not retry, named independently of the code under test. */
const NOT_RETRIED = new Set<OperationId>([
  "updateClient",
  "updateAgent",
  "updateValueModel",
  "updateCostLineItem",
  "updateReport",
  "previewImport",
  "validateCalculation",
  "publishCalculation",
  "reopenCalculation",
  "shareReport",
  "revokeReport",
  "createApiKey",
  "revokeApiKey",
  // A PUT, but its version guard refuses a repeat of a write that landed.
  "setValueModelLineItems",
]);

const IDEMPOTENT = new Set<OperationId>([
  "commitImport",
  "createClient",
  "createValueModel",
  "createCalculation",
  "createAgent",
  "createCostLineItem",
  "createReport",
]);

function argsFor(id: OperationId) {
  const operation = OPERATIONS[id];
  const path: Record<string, string> = {};
  for (const [, name] of operation.path.matchAll(/\{([^{}]+)\}/g)) {
    if (name !== undefined) path[name] = "x1";
  }
  const body =
    operation.body === "multipart"
      ? { mapping: { columns: {} }, file: "a\n" }
      : operation.body === "none"
        ? undefined
        : {};
  return { path, body };
}

describe("retries, on a fake clock", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
  });

  // getSharedReport takes a share token, not the client's credential; its
  // function is tested with it.
  const ids = (Object.keys(OPERATIONS) as OperationId[]).filter(
    (id) => id !== "getSharedReport",
  );

  it("names 14 operations it never retries, every one in the table", () => {
    for (const id of NOT_RETRIED) expect(OPERATIONS).toHaveProperty(id);
    expect(NOT_RETRIED.size).toBe(14);
    expect(ids).toHaveLength(57);
    // getSharedReport, a GET, is the 58th operation and is eligible.
    const all = Object.keys(OPERATIONS) as OperationId[];
    expect(all).toHaveLength(58);
    expect(all.filter((id) => !NOT_RETRIED.has(id))).toHaveLength(44);
  });

  it.each(ids)(
    "makes three attempts at %s against three 500s when it is eligible, and one when not",
    async (id) => {
      const { fetch, sent } = recorder([], () =>
        problem(500, "internal_error"),
      );
      const caught = request(config(fetch), id, argsFor(id)).catch(
        (err: unknown) => err,
      );
      await vi.runAllTimersAsync();
      expect(instance(await caught, ApiError).status).toBe(500);
      expect(sent).toHaveLength(NOT_RETRIED.has(id) ? 1 : 3);
      // An Idempotency-Key on exactly the seven idempotent operations.
      const keys = sent.map((r) => r.headers["idempotency-key"]);
      if (IDEMPOTENT.has(id)) {
        expect(new Set(keys).size).toBe(1);
        expect(keys[0]).toMatch(UUID_V4);
      } else {
        expect(keys.every((k) => k === undefined)).toBe(true);
      }
    },
  );

  it("sends one generated Idempotency-Key and the same body bytes on every attempt of a call, and a new key on the next call", async () => {
    const { fetch, sent } = recorder(
      [() => problem(500, "internal_error"), () => json(201, { id: "c1" })],
      () => json(201, { id: "c2" }),
    );
    const c = config(fetch);
    const first = request(c, "createClient", {
      body: { name: "Acme", monthly: 1 },
    });
    await vi.runAllTimersAsync();
    await expect(first).resolves.toEqual({ id: "c1" });
    await request(c, "createClient", { body: { name: "Acme", monthly: 1 } });

    expect(sent).toHaveLength(3);
    const [a, b, next] = [at(sent, 0), at(sent, 1), at(sent, 2)];
    expect(a.headers["idempotency-key"]).toMatch(UUID_V4);
    expect(b.headers["idempotency-key"]).toBe(a.headers["idempotency-key"]);
    expect(b.body).toEqual(a.body);
    expect(b.headers["x-request-id"]).not.toBe(a.headers["x-request-id"]);
    expect(next.headers["idempotency-key"]).toMatch(UUID_V4);
    expect(next.headers["idempotency-key"]).not.toBe(
      a.headers["idempotency-key"],
    );
  });

  it("sends a caller's idempotencyKey as given, on every attempt", async () => {
    const { fetch, sent } = recorder([
      () => problem(503, "internal_error"),
      () => json(201, { id: "c1" }),
    ]);
    const done = request(config(fetch), "createAgent", {
      body: { name: "bot" },
      options: { idempotencyKey: '"job-42"' },
    });
    await vi.runAllTimersAsync();
    await done;
    expect(sent.map((r) => r.headers["idempotency-key"])).toEqual([
      '"job-42"',
      '"job-42"',
    ]);
  });

  it.each([
    "createApiKey",
    "updateClient",
    "setClientAgents",
    "getClient",
  ] as const)(
    "sends no Idempotency-Key on %s, nor one a caller passes",
    async (id) => {
      const { fetch, sent } = recorder([], () => json(200, { id: "x" }));
      const args = argsFor(id);
      await request(config(fetch), id, {
        ...args,
        options: { idempotencyKey: "ignored" },
      });
      expect(only(sent).headers["idempotency-key"]).toBeUndefined();
    },
  );

  it("sends no Idempotency-Key with ingest", async () => {
    const { fetch, sent } = recorder([], () =>
      json(200, {
        accepted: 1,
        duplicates: 0,
        rejected: 0,
        errors: [],
        errors_truncated: false,
      }),
    );
    await new Allisall({ apiKey: "aia_k", fetch }).events.ingest([event(0)]);
    expect(only(sent).headers["idempotency-key"]).toBeUndefined();
  });

  it("retries a 409 idempotency_key_in_use on an idempotent operation, resolving with the later 201", async () => {
    const { fetch, sent } = recorder([
      () => problem(409, "idempotency_key_in_use"),
      () => json(201, { id: "c1" }),
    ]);
    const done = request(config(fetch), "createClient", {
      body: { name: "A" },
    });
    await vi.runAllTimersAsync();
    await expect(done).resolves.toEqual({ id: "c1" });
    expect(sent).toHaveLength(2);
    expect(at(sent, 1).headers["idempotency-key"]).toBe(
      at(sent, 0).headers["idempotency-key"],
    );
  });

  it("does not retry another 409 on an idempotent operation", async () => {
    const { fetch, sent } = recorder([], () =>
      problem(409, "client_key_in_use"),
    );
    const caught = request(config(fetch), "createClient", {
      body: { name: "A" },
    }).catch((err: unknown) => err);
    await vi.runAllTimersAsync();
    expect(instance(await caught, ApiError).code).toBe("client_key_in_use");
    expect(sent).toHaveLength(1);
  });

  it("does not retry a 409 idempotency_key_in_use on an operation that is eligible but not idempotent", async () => {
    const { fetch, sent } = recorder([], () =>
      problem(409, "idempotency_key_in_use"),
    );
    const caught = request(config(fetch), "setClientAgents", {
      path: { id: "c1" },
      body: { agent_ids: [] },
    }).catch((err: unknown) => err);
    await vi.runAllTimersAsync();
    expect(instance(await caught, ApiError).status).toBe(409);
    expect(sent).toHaveLength(1);
  });

  it("does not retry a 409 idempotency_key_in_use on ingest", async () => {
    const { fetch, sent } = recorder([], () =>
      problem(409, "idempotency_key_in_use"),
    );
    const caught = new Allisall({ apiKey: "aia_k", fetch }).events
      .ingest([event(0)])
      .catch((err: unknown) => err);
    await vi.runAllTimersAsync();
    expect(instance(await caught, IngestError).cause).toBeInstanceOf(ApiError);
    expect(sent).toHaveLength(1);
  });

  it("sends the same form, mapping first, on every attempt of an import", async () => {
    const { fetch, sent } = recorder([
      () => problem(502, "internal_error"),
      () => json(200, { accepted: 1 }),
    ]);
    const done = request(config(fetch), "commitImport", {
      body: { mapping: { columns: { timestamp: "Time" } }, file: "Time\n" },
    });
    await vi.runAllTimersAsync();
    await done;
    expect(sent).toHaveLength(2);
    const [a, b] = [at(sent, 0), at(sent, 1)];
    expect(b.body).toBe(a.body);
    expect(b.headers["idempotency-key"]).toBe(a.headers["idempotency-key"]);
    const form = instance(a.body, FormData);
    expect([...form.keys()]).toEqual(["mapping", "file"]);
  });

  it("lets a call's maxRetries lower and raise the client's, but never make a PATCH eligible", async () => {
    const fail = () => problem(500, "internal_error");
    const one = recorder([], fail);
    const lowered = request(config(one.fetch), "getClient", {
      path: { id: "c" },
      options: { maxRetries: 0 },
    }).catch(() => undefined);
    await vi.runAllTimersAsync();
    await lowered;
    expect(one.sent).toHaveLength(1);

    const three = recorder([], fail);
    const raised = request(
      config(three.fetch, { maxRetries: 0 }),
      "getClient",
      {
        path: { id: "c" },
        options: { maxRetries: 2 },
      },
    ).catch(() => undefined);
    await vi.runAllTimersAsync();
    await raised;
    expect(three.sent).toHaveLength(3);

    const patch = recorder([], fail);
    const notEligible = request(config(patch.fetch), "updateClient", {
      path: { id: "c" },
      body: {},
      options: { maxRetries: 5 },
    }).catch(() => undefined);
    await vi.runAllTimersAsync();
    await notEligible;
    expect(patch.sent).toHaveLength(1);
  });

  it("makes one attempt at setValueModelLineItems against a 503 or a connection failure, even with maxRetries 5, while another PUT retries", async () => {
    const unavailable = () => problem(503, "internal_error");
    const guarded = recorder([], unavailable);
    const caught = new Allisall({
      apiKey: "aia_k",
      fetch: guarded.fetch,
      maxRetries: 5,
    }).valueModels
      .setLineItemsForClient(
        "c1",
        { version: 3, line_items: [] },
        { maxRetries: 5 },
      )
      .catch((err: unknown) => err);
    await vi.runAllTimersAsync();
    expect(instance(await caught, ApiError).status).toBe(503);
    expect(guarded.sent).toHaveLength(1);
    expect(only(guarded.sent).method).toBe("PUT");

    // A connection failure leaves the outcome unknown, so it is not retried
    // either: the caller re-reads the version.
    const dropped = recorder([], () => {
      throw new TypeError("fetch failed");
    });
    const lost = request(config(dropped.fetch), "setValueModelLineItems", {
      path: { id: "c1" },
      body: { version: 3, line_items: [] },
      options: { maxRetries: 5 },
    }).catch((err: unknown) => err);
    await vi.runAllTimersAsync();
    expect(await lost).toBeInstanceOf(ConnectionError);
    expect(dropped.sent).toHaveLength(1);

    // The same failure on a PUT with no version guard is retried, so the
    // single attempt above is the exception and not the fixture.
    const other = recorder([], unavailable);
    const retried = request(config(other.fetch), "setClientAgents", {
      path: { id: "c1" },
      body: { agent_ids: [] },
      options: { maxRetries: 5 },
    }).catch(() => undefined);
    await vi.runAllTimersAsync();
    await retried;
    expect(other.sent).toHaveLength(6);
  });
});

// ---- Per-request options ----

describe("per-call options", () => {
  it("applies a call's timeout to each attempt", async () => {
    // Never answers until its signal aborts.
    const hang: Answer = (req) =>
      new Promise((_, reject) => {
        req.signal?.addEventListener("abort", () => reject(req.signal?.reason));
      });
    const { fetch, sent } = recorder([], hang);
    const started = Date.now();
    const err = await rejection(
      request(config(fetch, { timeout: 60_000 }), "getClient", {
        path: { id: "c" },
        options: { timeout: 20, maxRetries: 0 },
      }),
    );
    expect(err).toBeInstanceOf(ConnectionError);
    expect(Date.now() - started).toBeLessThan(5_000);
    expect(only(sent).signal?.aborted).toBe(true);
  });

  it("refuses a call's timeout or maxRetries the client would refuse, before sending", async () => {
    const { fetch, sent } = recorder();
    for (const options of [{ timeout: 0 }, { maxRetries: -1 }]) {
      const err = await rejection(
        request(config(fetch), "getClient", { path: { id: "c" }, options }),
      );
      expect(err).toBeInstanceOf(AllisallError);
    }
    expect(sent).toHaveLength(0);
  });

  it("sends defaultHeaders, then a call's headers over them in any case", async () => {
    const { fetch, sent } = recorder([], () => json(200, { id: "c" }));
    const c = config(fetch, {
      defaultHeaders: { "X-Edge-Secret": "default", "X-Team": "ops" },
    });
    await request(c, "getClient", { path: { id: "c" } });
    await request(c, "getClient", {
      path: { id: "c" },
      options: { headers: { "x-edge-secret": "call" } },
    });
    expect(at(sent, 0).headers["x-edge-secret"]).toBe("default");
    expect(at(sent, 1).headers["x-edge-secret"]).toBe("call");
    expect(at(sent, 1).headers["x-team"]).toBe("ops");
    // One header, not two joined by a comma.
    expect(
      at(sent, 1).headerNames.filter(
        (n) => n.toLowerCase() === "x-edge-secret",
      ),
    ).toEqual(["x-edge-secret"]);
  });

  it.each(["Authorization", "content-type", "IDEMPOTENCY-KEY", "X-Request-Id"])(
    "refuses %s in a call's headers with a TypeError, before sending",
    async (name) => {
      const { fetch, sent } = recorder();
      const err = await rejection(
        request(config(fetch), "createClient", {
          body: { name: "A" },
          options: { headers: { [name]: "x" } },
        }),
      );
      expect(err).toBeInstanceOf(TypeError);
      expect(sent).toHaveLength(0);
    },
  );

  it("refuses an owned header in defaultHeaders with a TypeError, at construction", () => {
    expect(
      () =>
        new Allisall({
          apiKey: "aia_k",
          defaultHeaders: { authorization: "Bearer other" },
        }),
    ).toThrow(TypeError);
  });

  it("refuses a header the platform cannot send, before sending", async () => {
    const { fetch, sent } = recorder();
    const err = await rejection(
      request(config(fetch), "getClient", {
        path: { id: "c" },
        options: { headers: { "bad name": "x" } },
      }),
    );
    expect(err).toBeInstanceOf(TypeError);
    expect(sent).toHaveLength(0);
  });

  it("cancels a call with its signal, during the wait before a retry", async () => {
    const { fetch, sent } = recorder([], () => problem(503, "internal_error"));
    const controller = new AbortController();
    const done = rejection(
      request(config(fetch), "getClient", {
        path: { id: "c" },
        options: { signal: controller.signal },
      }),
    );
    await vi.waitFor(() => expect(sent).toHaveLength(1));
    controller.abort(new Error("stop"));
    expect(await done).toEqual(new Error("stop"));
    expect(sent).toHaveLength(1);
  });
});

describe("ingest with the per-call options", () => {
  const ok = () =>
    json(200, {
      accepted: 1,
      duplicates: 0,
      rejected: 0,
      errors: [],
      errors_truncated: false,
    });

  it("sends exactly what it did before, with no option set", async () => {
    const { fetch, sent } = recorder([], ok);
    await new Allisall({ apiKey: "aia_k", fetch }).events.ingest([event(0)]);
    const req = only(sent);
    expect(req.initKeys).toEqual([
      "method",
      "headers",
      "body",
      "signal",
      "redirect",
    ]);
    expect(req.headerNames).toEqual([
      "Authorization",
      "Content-Type",
      "X-Request-Id",
      "User-Agent",
    ]);
    expect(req.method).toBe("POST");
    expect(req.url).toBe("https://api.allisai.ai/v1/events");
  });

  it("sends a call's headers and the client's defaultHeaders on every batch", async () => {
    const { fetch, sent } = recorder([], ok);
    await new Allisall({
      apiKey: "aia_k",
      fetch,
      defaultHeaders: { "X-Default": "d" },
    }).events.ingest([event(0)], { headers: { "X-Call": "c" } });
    const req = only(sent);
    expect(req.headers["x-default"]).toBe("d");
    expect(req.headers["x-call"]).toBe("c");
  });

  it("takes a call's maxRetries", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
    const { fetch, sent } = recorder([], () => problem(500, "internal_error"));
    const caught = new Allisall({ apiKey: "aia_k", fetch }).events
      .ingest([event(0)], { maxRetries: 0 })
      .catch((err: unknown) => err);
    await vi.runAllTimersAsync();
    expect(await caught).toBeInstanceOf(IngestError);
    expect(sent).toHaveLength(1);
  });

  it("refuses an owned header with a TypeError, sending nothing", async () => {
    const { fetch, sent } = recorder([], ok);
    const err = await rejection(
      new Allisall({ apiKey: "aia_k", fetch }).events.ingest([event(0)], {
        headers: { Authorization: "Bearer other" },
      }),
    );
    expect(err).toBeInstanceOf(TypeError);
    expect(sent).toHaveLength(0);
  });
});

// ---- CSV import ----

async function parts(form: FormData): Promise<string> {
  return new Response(form).text();
}

describe("the import form", () => {
  it("writes mapping before file, the mapping as JSON named mapping.json, the file as text/csv", async () => {
    const { fetch, sent } = recorder([() => json(200, { accepted: 1 })]);
    await request(config(fetch), "previewImport", {
      body: {
        file: new TextEncoder().encode("Time\n2026"),
        mapping: { columns: { timestamp: "Time" }, timezone: "Asia/Tokyo" },
      },
    });
    const text = await parts(instance(only(sent).body, FormData));
    const mapping = text.indexOf('name="mapping"; filename="mapping.json"');
    const file = text.indexOf('name="file"; filename="upload.csv"');
    expect(mapping).toBeGreaterThanOrEqual(0);
    expect(file).toBeGreaterThan(mapping);
    expect(text).toContain(
      'Content-Type: application/json\r\n\r\n{"columns":{"timestamp":"Time"},"timezone":"Asia/Tokyo"}\r\n',
    );
    expect(text.slice(file)).toContain(
      "Content-Type: text/csv\r\n\r\nTime\n2026\r\n",
    );
  });

  it("keeps a File's name, and the filename option wins over it", async () => {
    const { fetch, sent } = recorder([], () => json(200, { accepted: 1 }));
    const file = new File(["a\n"], "march.csv", {
      type: "application/vnd.ms-excel",
    });
    await request(config(fetch), "previewImport", {
      body: { mapping: { columns: {} }, file },
    });
    await request(config(fetch), "previewImport", {
      body: { mapping: { columns: {} }, file, filename: "april.csv" },
    });
    const first = await parts(instance(at(sent, 0).body, FormData));
    const second = await parts(instance(at(sent, 1).body, FormData));
    expect(first).toContain(
      'name="file"; filename="march.csv"\r\nContent-Type: text/csv',
    );
    expect(second).toContain('name="file"; filename="april.csv"');
  });

  it("refuses a stream as the file, before sending", async () => {
    const { fetch, sent } = recorder();
    const err = await rejection(
      request(config(fetch), "commitImport", {
        body: { mapping: { columns: {} }, file: new ReadableStream() },
      }),
    );
    expect(err).toBeInstanceOf(TypeError);
    expect(sent).toHaveLength(0);
  });
});

// ---- Lists ----

function page(
  data: unknown[],
  next: string | null,
  extra: Record<string, unknown> = {},
): Answer {
  return () =>
    json(200, { data, has_more: next !== null, next_cursor: next, ...extra });
}

function queryOf(req: Sent): [string, string][] {
  return [...new URL(req.url).searchParams.entries()];
}

describe("lists", () => {
  it("walks every page with for await, sending the filters on every request and each page's own cursor", async () => {
    const { fetch, sent } = recorder([
      page([{ id: "a" }, { id: "b" }], "c1"),
      page([{ id: "c" }, { id: "d" }], "c2"),
      page([{ id: "e" }], null),
    ]);
    const ids: string[] = [];
    for await (const client of requestPage(config(fetch), "listClients", {
      query: { status: "active", limit: 2 },
    })) {
      ids.push(client.id);
    }
    expect(ids).toEqual(["a", "b", "c", "d", "e"]);
    expect(sent.map(queryOf)).toEqual([
      [
        ["status", "active"],
        ["limit", "2"],
      ],
      [
        ["status", "active"],
        ["limit", "2"],
        ["cursor", "c1"],
      ],
      [
        ["status", "active"],
        ["limit", "2"],
        ["cursor", "c2"],
      ],
    ]);
  });

  it("sends page on the first request only, and continues an offset list by cursor", async () => {
    const { fetch, sent } = recorder([
      page([{ id: "1" }], "off-1", { total: 7 }),
      page([{ id: "2" }], null, { total: 7 }),
    ]);
    const items: string[] = [];
    for await (const e of requestPage(config(fetch), "listClientEvents", {
      path: { id: "c1" },
      query: { from: "f", to: "t", page: 3, sort: "cost" },
    })) {
      items.push(e.id);
    }
    expect(items).toEqual(["1", "2"]);
    expect(sent.map(queryOf)).toEqual([
      [
        ["from", "f"],
        ["to", "t"],
        ["page", "3"],
        ["sort", "cost"],
      ],
      [
        ["from", "f"],
        ["to", "t"],
        ["sort", "cost"],
        ["cursor", "off-1"],
      ],
    ]);
    expect(at(sent, 1).url).toContain("/v1/clients/c1/events?");
  });

  it("resolves await with one page, its body, and the next page on request", async () => {
    const { fetch, sent } = recorder([
      page([{ id: "1" }], "n1", { total: 2 }),
      page([{ id: "2" }], null, { total: 2 }),
    ]);
    const first = await requestPage(config(fetch), "listClientEvents", {
      path: { id: "c1" },
      query: { from: "f", to: "t" },
    });
    expectTypeOf(first).toEqualTypeOf<
      Page<ClientEventList["data"][number], ClientEventList>
    >();
    expect(sent).toHaveLength(1);
    expect(first.data.map((e) => e.id)).toEqual(["1"]);
    expect(first.body.total).toBe(2);
    expect(first.hasNextPage()).toBe(true);
    const second = await first.getNextPage();
    expect(second.data.map((e) => e.id)).toEqual(["2"]);
    expect(second.hasNextPage()).toBe(false);
    expect(await rejection(second.getNextPage())).toBeInstanceOf(AllisallError);
    expect(sent).toHaveLength(2);
  });

  it("sends nothing for a list call that is never used", async () => {
    const { fetch, sent } = recorder();
    requestPage(config(fetch), "listClients");
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(sent).toHaveLength(0);
  });

  it("requests the first page once, however often it is awaited", async () => {
    const { fetch, sent } = recorder([], page([{ id: "a" }], null));
    const list = requestPage(config(fetch), "listClients");
    await list;
    await list;
    const ids: string[] = [];
    for await (const c of list) ids.push(c.id);
    expect(ids).toEqual(["a"]);
    expect(sent).toHaveLength(1);
  });

  it.each([
    ["null", null],
    ["empty", ""],
  ])(
    "refuses has_more true with a %s next_cursor, as an ApiError with the 200",
    async (_, cursor) => {
      const { fetch } = recorder([
        () => json(200, { data: [], has_more: true, next_cursor: cursor }),
      ]);
      const err = instance(
        await rejection(requestPage(config(fetch), "listClients")),
        ApiError,
      );
      expect(err.status).toBe(200);
      expect(err.problem).toBeUndefined();
    },
  );

  it.each([
    [
      "data that is not an array",
      { data: {}, has_more: false, next_cursor: null },
    ],
    [
      "has_more that is not a boolean",
      { data: [], has_more: "no", next_cursor: null },
    ],
    [
      "a next_cursor that is a number",
      { data: [], has_more: false, next_cursor: 1 },
    ],
  ])("refuses an envelope with %s", async (_, body) => {
    const { fetch } = recorder([() => json(200, body)]);
    expect(
      await rejection(requestPage(config(fetch), "listClients")),
    ).toBeInstanceOf(ApiError);
  });

  it("applies the call's options to every page, and getNextPage's to its own request alone", async () => {
    const { fetch, sent } = recorder([
      page([{ id: "a" }], "c1"),
      page([{ id: "b" }], "c2"),
      page([{ id: "c" }], null),
    ]);
    const first = await requestPage(config(fetch), "listClients", {
      options: { headers: { "X-Call": "call" } },
    });
    const second = await first.getNextPage({
      headers: { "X-Call": "override" },
    });
    await second.getNextPage();
    expect(sent.map((r) => r.headers["x-call"])).toEqual([
      "call",
      "override",
      "call",
    ]);
  });

  it("ends the walk with the error, after the items already yielded", async () => {
    const { fetch } = recorder([
      page([{ id: "a" }], "c1"),
      () => problem(404, "not_found"),
    ]);
    const ids: string[] = [];
    const err = await rejection(
      (async () => {
        for await (const c of requestPage(config(fetch), "listClients")) {
          ids.push(c.id);
        }
      })(),
    );
    expect(ids).toEqual(["a"]);
    expect(instance(err, ApiError).status).toBe(404);
  });

  it("decodes each page's money", async () => {
    const { fetch } = recorder([
      () =>
        new Response(
          '{"data":[{"id":"l","monthly_amount":1234.5678901234567890}],"has_more":false,"next_cursor":null}',
          { status: 200 },
        ),
    ]);
    const first = await requestPage(config(fetch), "listCostLineItems");
    expect(first.data[0]?.monthly_amount).toBe("1234.5678901234567890");
  });
});

// ---- A path-only base URL ----

describe("a path-only base URL", () => {
  function inBrowser(href: string | undefined): void {
    vi.stubGlobal("document", {});
    vi.stubGlobal("location", href === undefined ? undefined : { href });
  }

  it("resolves against the page's address in a browser, at construction", async () => {
    inBrowser("https://app.example.test/dashboard/clients?x=1");
    const { fetch, sent } = recorder([], () => json(200, { id: "c" }));
    const c = transportConfig({
      tokenProvider: () => "eyJ.s",
      baseURL: "/api",
      fetch,
    });
    // A later navigation does not move it.
    vi.stubGlobal("location", { href: "https://elsewhere.test/" });
    await request(c, "getClient", { path: { id: "c" } });
    expect(only(sent).url).toBe("https://app.example.test/api/v1/clients/c");
  });

  it("is refused outside a browser", () => {
    expect(() => new Allisall({ apiKey: "aia_k", baseURL: "/api" })).toThrow(
      AllisallError,
    );
  });

  it("refuses //host in a browser, which names another host", () => {
    inBrowser("https://app.example.test/");
    expect(
      () =>
        new Allisall({
          tokenProvider: () => "eyJ.s",
          baseURL: "//evil.test/api",
        }),
    ).toThrow(AllisallError);
  });

  it.each([
    [
      "a backslash after the slash",
      "/\\evil.test/api",
      "https://evil.test/api",
    ],
    ["a tab before a second slash", "/\t/evil.test", "https://evil.test/"],
  ])(
    "refuses a path with %s, which resolves to another origin",
    (_, baseURL, resolved) => {
      inBrowser("https://app.example.test/dash");
      // The fixture really does name another host once resolved.
      expect(new URL(baseURL, "https://app.example.test/dash").href).toBe(
        resolved,
      );
      const err = instance(
        (() => {
          try {
            new Allisall({ tokenProvider: () => "eyJ.s", baseURL });
          } catch (e) {
            return e;
          }
        })(),
        AllisallError,
      );
      expect(err.message).toContain("another origin");
    },
  );

  it("is refused in a browser whose page address cannot be read", () => {
    inBrowser(undefined);
    expect(
      () => new Allisall({ tokenProvider: () => "eyJ.s", baseURL: "/api" }),
    ).toThrow(AllisallError);
  });
});

// ---- Fixes from review: inputs that must fail before sending ----

describe("a caller's idempotencyKey the platform cannot send", () => {
  it.each([
    ["a newline", "a\nb"],
    ["a character above U+00FF", "key-\u20ac"],
    ["a number", 42],
  ])(
    "refuses one holding %s with a TypeError, sending nothing and not retrying",
    async (_, key) => {
      const { fetch, sent } = recorder();
      const err = await rejection(
        request(config(fetch), "createClient", {
          body: { name: "A" },
          // A caller without types can pass any value.
          options: { idempotencyKey: key as string },
        }),
      );
      expect(err).toBeInstanceOf(TypeError);
      expect(err).not.toBeInstanceOf(ConnectionError);
      expect(sent).toHaveLength(0);
    },
  );
});

describe("a JSON body holding a value JSON would write as null", () => {
  it.each([
    [
      "an invalid Date",
      { name: "A", period: { from: new Date(Number.NaN) } },
      "/period/from",
    ],
    ["NaN", { name: "A", score: Number.NaN }, "/score"],
    [
      "Infinity in an array",
      { name: "A", list: [1, Number.POSITIVE_INFINITY] },
      "/list/1",
    ],
    ["-Infinity", { name: "A", low: Number.NEGATIVE_INFINITY }, "/low"],
  ])(
    "refuses %s with a TypeError naming its path, sending nothing",
    async (_, body, path) => {
      const { fetch, sent } = recorder();
      const err = await rejection(
        request(config(fetch), "createClient", { body }),
      );
      expect(err).toBeInstanceOf(TypeError);
      expect(instance(err, TypeError).message).toContain(`at ${path} `);
      expect(sent).toHaveLength(0);
    },
  );

  it("refuses an invalid Date in a merge patch, where null would clear the member", async () => {
    const { fetch, sent } = recorder();
    const err = await rejection(
      request(config(fetch), "updateClient", {
        path: { id: "c1" },
        body: { renewal_date: new Date(Number.NaN) },
      }),
    );
    expect(instance(err, TypeError).message).toContain("/renewal_date");
    expect(sent).toHaveLength(0);
  });

  it("still writes a valid Date as ISO text, and a finite number as itself", async () => {
    const { fetch, sent } = recorder([() => json(201, { id: "c" })]);
    await request(config(fetch), "createClient", {
      body: { at: new Date(Date.UTC(2026, 9, 30)), n: 1.5 },
    });
    expect(only(sent).text).toBe('{"at":"2026-10-30T00:00:00.000Z","n":1.5}');
  });

  it("leaves ingest's own serialiser as 0.1.0 had it: NaN in metadata is written as null", async () => {
    const { fetch, sent } = recorder([], () =>
      json(200, {
        accepted: 1,
        duplicates: 0,
        rejected: 0,
        errors: [],
        errors_truncated: false,
      }),
    );
    await new Allisall({ apiKey: "aia_k", fetch }).events.ingest([
      event(0, { metadata: { x: Number.NaN } }),
    ]);
    expect(only(sent).text).toContain('"metadata":{"x":null}');
  });
});

describe("a body on an operation that takes none", () => {
  it("is a TypeError, sending nothing", async () => {
    const { fetch, sent } = recorder();
    const err = await rejection(
      request(config(fetch), "publishCalculation", {
        path: { id: "calc" },
        body: {},
      }),
    );
    expect(err).toBeInstanceOf(TypeError);
    expect(sent).toHaveLength(0);
  });
});

describe("headers that are not a plain object", () => {
  it.each([
    ["an array", ["x"]],
    ["a Map", new Map([["X-A", "1"]])],
    ["a Headers", new Headers({ "X-A": "1" })],
  ])("refuses %s as a call's headers, sending nothing", async (_, headers) => {
    const { fetch, sent } = recorder();
    const err = await rejection(
      request(config(fetch), "getClient", {
        path: { id: "c" },
        // A caller without types can pass any value.
        options: { headers: headers as unknown as Record<string, string> },
      }),
    );
    expect(instance(err, TypeError).message).toContain("plain object");
    expect(sent).toHaveLength(0);
  });

  it("refuses an array as defaultHeaders, at construction", () => {
    expect(
      () =>
        new Allisall({
          apiKey: "aia_k",
          // A caller without types can pass any value.
          defaultHeaders: ["x"] as unknown as Record<string, string>,
        }),
    ).toThrow(/plain object/);
  });

  it("refuses an array as ingest's headers, sending nothing", async () => {
    const { fetch, sent } = recorder();
    const err = await rejection(
      new Allisall({ apiKey: "aia_k", fetch }).events.ingest([event(0)], {
        // A caller without types can pass any value.
        headers: ["x"] as unknown as Record<string, string>,
      }),
    );
    expect(err).toBeInstanceOf(TypeError);
    expect(sent).toHaveLength(0);
  });
});

describe("an empty filename", () => {
  it("falls back on the File's name, then on upload.csv", async () => {
    const { fetch, sent } = recorder([], () => json(200, { accepted: 1 }));
    const file = new File(["a\n"], "march.csv");
    await request(config(fetch), "previewImport", {
      body: { mapping: { columns: {} }, file, filename: "" },
    });
    await request(config(fetch), "previewImport", {
      body: { mapping: { columns: {} }, file: "a\n", filename: "" },
    });
    expect(await parts(instance(at(sent, 0).body, FormData))).toContain(
      'name="file"; filename="march.csv"',
    );
    expect(await parts(instance(at(sent, 1).body, FormData))).toContain(
      'name="file"; filename="upload.csv"',
    );
  });
});

describe("getNextPage's options over the call's", () => {
  it("merges headers name by name, the override winning in any case", async () => {
    const { fetch, sent } = recorder([
      page([{ id: "a" }], "c1"),
      page([{ id: "b" }], "c2"),
      page([{ id: "c" }], null),
    ]);
    const first = await requestPage(config(fetch), "listClients", {
      options: { headers: { "X-One": "1", "X-Shared": "call" } },
    });
    const second = await first.getNextPage({
      headers: { "x-shared": "page", "X-Two": "2" },
    });
    await second.getNextPage();
    const [a, b, c] = [at(sent, 0), at(sent, 1), at(sent, 2)];
    expect(a.headers).toMatchObject({ "x-one": "1", "x-shared": "call" });
    expect(a.headers["x-two"]).toBeUndefined();
    expect(b.headers).toMatchObject({
      "x-one": "1",
      "x-shared": "page",
      "x-two": "2",
    });
    expect(
      b.headerNames.filter((n) => n.toLowerCase() === "x-shared"),
    ).toHaveLength(1);
    expect(c.headers).toMatchObject({ "x-one": "1", "x-shared": "call" });
    expect(c.headers["x-two"]).toBeUndefined();
  });

  it("keeps the call's value for a member it sets to undefined", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
    const { fetch, sent } = recorder([page([{ id: "a" }], "c1")], () =>
      problem(500, "internal_error"),
    );
    // The client allows two retries; the call allows none.
    const first = await requestPage(config(fetch), "listClients", {
      options: { maxRetries: 0 },
    });
    const next = first
      .getNextPage({ maxRetries: undefined, headers: undefined })
      .catch((err: unknown) => err);
    await vi.runAllTimersAsync();
    expect(instance(await next, ApiError).status).toBe(500);
    // One attempt for the second page: the call's maxRetries held.
    expect(sent).toHaveLength(2);
  });
});

// ---- Behaviours stated in the design, each pinned ----

describe("a header value that is not a string", () => {
  it("is a TypeError in a call's headers, sending nothing", async () => {
    const { fetch, sent } = recorder();
    const err = await rejection(
      request(config(fetch), "getClient", {
        path: { id: "c" },
        // A caller without types can pass any value.
        options: { headers: { "X-Count": 1 as unknown as string } },
      }),
    );
    expect(instance(err, TypeError).message).toContain("must be a string");
    expect(sent).toHaveLength(0);
  });

  it("is a TypeError in defaultHeaders, at construction", () => {
    expect(
      () =>
        new Allisall({
          apiKey: "aia_k",
          // A caller without types can pass any value.
          defaultHeaders: { "X-Flag": true as unknown as string },
        }),
    ).toThrow(/must be a string/);
  });
});

describe("a File with no name of its own", () => {
  it("is sent as upload.csv when no filename is given", async () => {
    const { fetch, sent } = recorder([() => json(200, { accepted: 1 })]);
    await request(config(fetch), "previewImport", {
      body: { mapping: { columns: {} }, file: new File(["a\n"], "") },
    });
    expect(await parts(instance(only(sent).body, FormData))).toContain(
      'name="file"; filename="upload.csv"',
    );
  });
});

describe("query values the API has no parameter kind for", () => {
  it.each([
    ["null", null],
    ["a boolean", true],
    ["an object", { from: "x" }],
  ])("refuses %s with a TypeError, sending nothing", async (_, value) => {
    const { fetch, sent } = recorder();
    const err = await rejection(
      requestPage(config(fetch), "listClients", { query: { status: value } }),
    );
    expect(instance(err, TypeError).message).toContain(
      "query parameter status",
    );
    expect(sent).toHaveLength(0);
  });

  it("writes a bigint as its decimal text", async () => {
    const { fetch, sent } = recorder([
      () => json(200, { data: [], has_more: false, next_cursor: null }),
    ]);
    await requestPage(config(fetch), "listClients", {
      query: { limit: 12345678901234567890n },
    });
    expect(queryOf(only(sent))).toEqual([["limit", "12345678901234567890"]]);
  });
});

describe("a caller's User-Agent", () => {
  it("replaces the SDK's, from defaultHeaders and from a call's headers", async () => {
    const { fetch, sent } = recorder([], () => json(200, { id: "c" }));
    const c = config(fetch, { defaultHeaders: { "user-agent": "wrapper/1" } });
    await request(c, "getClient", { path: { id: "c" } });
    await request(c, "getClient", {
      path: { id: "c" },
      options: { headers: { "User-Agent": "job/2" } },
    });
    expect(at(sent, 0).headers["user-agent"]).toBe("wrapper/1");
    expect(at(sent, 1).headers["user-agent"]).toBe("job/2");
    // One User-Agent, not the SDK's joined to the caller's.
    for (const req of sent) {
      expect(
        req.headerNames.filter((n) => n.toLowerCase() === "user-agent"),
      ).toHaveLength(1);
    }
  });
});

// ---- A list walk that would repeat a cursor ----

describe("a list walk that meets a cursor it has already sent", () => {
  /** Walks a list with for await, keeping the ids yielded and the error. */
  async function walk(
    list: PagePromise<Client, ClientList>,
  ): Promise<{ ids: string[]; err: unknown }> {
    const ids: string[] = [];
    let err: unknown;
    try {
      for await (const c of list) ids.push(c.id);
    } catch (e) {
      err = e;
    }
    return { ids, err };
  }

  it("ends a self-loop, a page naming its own cursor, as an ApiError with the 200 and no problem", async () => {
    const { fetch, sent } = recorder([
      page([{ id: "a" }], "A"),
      page([{ id: "b" }], "A"),
    ]);
    const { ids, err } = await walk(requestPage(config(fetch), "listClients"));
    const apiErr = instance(err, ApiError);
    expect(apiErr.status).toBe(200);
    expect(apiErr.problem).toBeUndefined();
    expect(apiErr.code).toBeUndefined();
    // The refused page's items are never yielded, and nothing more is sent.
    expect(ids).toEqual(["a"]);
    expect(sent.map(queryOf)).toEqual([[], [["cursor", "A"]]]);
  });

  it("ends a two-page cycle, A to B and back to A", async () => {
    const { fetch, sent } = recorder([
      page([{ id: "a" }], "A"),
      page([{ id: "b" }], "B"),
      page([{ id: "c" }], "A"),
    ]);
    const { ids, err } = await walk(requestPage(config(fetch), "listClients"));
    expect(instance(err, ApiError).status).toBe(200);
    expect(ids).toEqual(["a", "b"]);
    expect(sent.map(queryOf)).toEqual([
      [],
      [["cursor", "A"]],
      [["cursor", "B"]],
    ]);
  });

  it("refuses the repeat when the walk is driven by getNextPage, with the page's own status", async () => {
    const { fetch, sent } = recorder([
      page([{ id: "a" }], "A"),
      page([{ id: "b" }], "B"),
      () =>
        json(203, { data: [{ id: "c" }], has_more: true, next_cursor: "A" }),
    ]);
    const first = await requestPage(config(fetch), "listClients");
    const second = await first.getNextPage();
    expect(second.data.map((c) => c.id)).toEqual(["b"]);
    const err = instance(await rejection(second.getNextPage()), ApiError);
    expect(err.status).toBe(203);
    expect(err.problem).toBeUndefined();
    expect(sent).toHaveLength(3);
  });

  it("counts the cursor the caller's own query sent", async () => {
    const { fetch } = recorder([page([{ id: "a" }], "X")]);
    const err = await rejection(
      requestPage(config(fetch), "listClients", { query: { cursor: "X" } }),
    );
    expect(instance(err, ApiError).status).toBe(200);
  });

  it("lets a last page carry a sent cursor, since the walk does not follow it", async () => {
    const { fetch, sent } = recorder([
      page([{ id: "a" }], "A"),
      () =>
        json(200, { data: [{ id: "b" }], has_more: false, next_cursor: "A" }),
    ]);
    const { ids, err } = await walk(requestPage(config(fetch), "listClients"));
    expect(err).toBeUndefined();
    expect(ids).toEqual(["a", "b"]);
    expect(sent).toHaveLength(2);
  });

  it("still walks every page of a list whose cursors are all new", async () => {
    const { fetch, sent } = recorder([
      page([{ id: "a" }], "A"),
      page([{ id: "b" }], "B"),
      page([{ id: "c" }], "C"),
      page([{ id: "d" }], null),
    ]);
    const { ids, err } = await walk(requestPage(config(fetch), "listClients"));
    expect(err).toBeUndefined();
    expect(ids).toEqual(["a", "b", "c", "d"]);
    expect(sent).toHaveLength(4);
  });

  it("walks again from the first page without refusing the cursors it sends again", async () => {
    const pages = [
      page([{ id: "a" }], "A"),
      page([{ id: "b" }], "B"),
      page([{ id: "c" }], null),
    ];
    // The first page is requested once; each walk requests the rest.
    const { fetch, sent } = recorder([...pages, ...pages.slice(1)]);
    const list = requestPage(config(fetch), "listClients");
    const first = await walk(list);
    const again = await walk(list);
    expect(first).toEqual({ ids: ["a", "b", "c"], err: undefined });
    expect(again).toEqual({ ids: ["a", "b", "c"], err: undefined });
    expect(sent.map(queryOf)).toEqual([
      [],
      [["cursor", "A"]],
      [["cursor", "B"]],
      [["cursor", "A"]],
      [["cursor", "B"]],
    ]);
  });

  it("lets getNextPage on an earlier page run after the walk has gone ahead", async () => {
    const { fetch, sent } = recorder([
      page([{ id: "a" }], "A"),
      page([{ id: "b" }], "B"),
      page([{ id: "c" }], null),
      page([{ id: "b" }], "B"),
    ]);
    const first = await requestPage(config(fetch), "listClients");
    const second = await first.getNextPage();
    await second.getNextPage();
    const secondAgain = await first.getNextPage();
    expect(secondAgain.data.map((c) => c.id)).toEqual(["b"]);
    expect(secondAgain.hasNextPage()).toBe(true);
    expect(sent).toHaveLength(4);
  });

  it("remembers cursors per list call, so a second call may send one at another position", async () => {
    const { fetch } = recorder([
      page([{ id: "a" }], "A"),
      page([{ id: "b" }], null),
      // The second call meets A one page later than the first did.
      page([{ id: "x" }], "B"),
      page([{ id: "y" }], "A"),
      page([{ id: "z" }], null),
    ]);
    const first = await walk(requestPage(config(fetch), "listClients"));
    const second = await walk(requestPage(config(fetch), "listClients"));
    expect(first).toEqual({ ids: ["a", "b"], err: undefined });
    expect(second).toEqual({ ids: ["x", "y", "z"], err: undefined });
  });
});

// ---- Text that is not valid Unicode ----

describe("text holding a lone surrogate, outside ingest", () => {
  it.each([
    ["a high surrogate at the end", { name: "A\uD800" }, "/name"],
    ["a high surrogate before a letter", { name: "\uDBFFx" }, "/name"],
    [
      "a low surrogate in an array",
      { name: "A", tags: ["ok", "\uDC00"] },
      "/tags/1",
    ],
    ["a pair in the wrong order", { name: "\uDC00\uD800" }, "/name"],
    ["text at the body's root", "\uD800", "the body"],
  ])(
    "refuses %s in a JSON body with a TypeError naming its pointer, sending nothing",
    async (_, body, where) => {
      const { fetch, sent } = recorder();
      const err = await rejection(
        request(config(fetch), "createClient", { body }),
      );
      expect(instance(err, TypeError).message).toBe(
        `allisall: the value at ${where} is not valid Unicode (a lone surrogate)`,
      );
      expect(sent).toHaveLength(0);
    },
  );

  it("refuses one in a merge patch", async () => {
    const { fetch, sent } = recorder();
    const err = await rejection(
      request(config(fetch), "updateClient", {
        path: { id: "c1" },
        body: { notes: { text: "\uD83D" } },
      }),
    );
    expect(instance(err, TypeError).message).toContain(
      "at /notes/text is not valid Unicode",
    );
    expect(sent).toHaveLength(0);
  });

  it("refuses one in a member name, naming the object that holds it", async () => {
    const { fetch, sent } = recorder();
    const err = await rejection(
      request(config(fetch), "createClient", {
        body: { name: "A", meta: { "k\uDC00": 1 } },
      }),
    );
    expect(instance(err, TypeError).message).toBe(
      "allisall: a member name in the object at /meta is not valid Unicode (a lone surrogate)",
    );
    expect(sent).toHaveLength(0);
  });

  it("refuses one in an import's mapping", async () => {
    const { fetch, sent } = recorder();
    const err = await rejection(
      request(config(fetch), "previewImport", {
        body: { mapping: { columns: { timestamp: "T\uD800" } }, file: "T\n" },
      }),
    );
    expect(instance(err, TypeError).message).toContain(
      "at /columns/timestamp is not valid Unicode",
    );
    expect(sent).toHaveLength(0);
  });

  it("refuses one in an import's file given as a string, which a Blob would write as U+FFFD", async () => {
    const { fetch, sent } = recorder();
    const err = await rejection(
      request(config(fetch), "commitImport", {
        body: { mapping: { columns: {} }, file: "Time\n\uDC00\n" },
      }),
    );
    expect(instance(err, TypeError).message).toBe(
      "allisall: the import's file is not valid Unicode (a lone surrogate)",
    );
    expect(sent).toHaveLength(0);
  });

  it("sends an import's string file holding a paired surrogate as UTF-8", async () => {
    const { fetch, sent } = recorder([() => json(200, { accepted: 1 })]);
    await request(config(fetch), "previewImport", {
      body: { mapping: { columns: {} }, file: "Name\n😀\n" },
    });
    const text = await parts(instance(only(sent).body, FormData));
    expect(text).toContain("Content-Type: text/csv\r\n\r\nName\n😀\n\r\n");
  });

  it("refuses one in a path parameter, naming it, as a TypeError rather than a URIError", async () => {
    const { fetch, sent } = recorder();
    const err = await rejection(
      request(config(fetch), "getClient", { path: { id: "c\uD800" } }),
    );
    expect(instance(err, TypeError).message).toBe(
      "allisall: the path parameter id is not valid Unicode (a lone surrogate)",
    );
    expect(sent).toHaveLength(0);
  });

  it("refuses one in a query value, which the URL would carry as U+FFFD", async () => {
    const { fetch, sent } = recorder();
    const err = await rejection(
      requestPage(config(fetch), "listClients", {
        query: { status: "\uDC00" },
      }),
    );
    expect(instance(err, TypeError).message).toBe(
      "allisall: the query parameter status is not valid Unicode (a lone surrogate)",
    );
    expect(sent).toHaveLength(0);
  });

  it("refuses one in a query parameter name", async () => {
    const { fetch, sent } = recorder();
    const err = await rejection(
      requestPage(config(fetch), "listClients", {
        query: { "s\uD800": "x" },
      }),
    );
    expect(instance(err, TypeError).message).toBe(
      "allisall: a query parameter name is not valid Unicode (a lone surrogate)",
    );
    expect(sent).toHaveLength(0);
  });

  it("sends a paired surrogate, such as an emoji, as UTF-8 in a body, a path and a query", async () => {
    const { fetch, sent } = recorder([
      () => json(201, { id: "c" }),
      () => json(200, { id: "c" }),
      () => json(200, { data: [], has_more: false, next_cursor: null }),
    ]);
    await request(config(fetch), "createClient", {
      body: { name: "A 😀", "k😀": 1 },
    });
    await request(config(fetch), "getClient", {
      path: { id: "😀" },
    });
    await requestPage(config(fetch), "listClients", {
      query: { status: "😀" },
    });
    expect(at(sent, 0).text).toBe('{"name":"A 😀","k😀":1}');
    expect(at(sent, 1).url).toBe(
      "https://api.example.test/v1/clients/%F0%9F%98%80",
    );
    expect(queryOf(at(sent, 2))).toEqual([["status", "😀"]]);
  });
});
