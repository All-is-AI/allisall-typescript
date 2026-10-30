import { describe, expect, it } from "vitest";
import {
  Allisall,
  AllisallError,
  ApiError,
  ConnectionError,
  type EventInput,
  IngestError,
} from "../src/index.js";
import { event, fakeFetch, instance, json, problem } from "./helpers.js";

function client(fetch: ReturnType<typeof fakeFetch>["fetch"]): Allisall {
  return new Allisall({ apiKey: "aia_test", fetch, maxRetries: 0 });
}

async function failure(promise: Promise<unknown>): Promise<IngestError> {
  return instance(
    await promise.then(
      () => undefined,
      (err: unknown) => err,
    ),
    IngestError,
  );
}

describe("a failed batch", () => {
  it("stops at the failed batch and carries the summary so far and the remaining events", async () => {
    // 1,100 events: batches of 500, 500 and 100. The second answers 401.
    const list: EventInput[] = Array.from({ length: 1100 }, (_, i) =>
      event(i, i === 700 ? { event_id: "caller-700" } : {}),
    );
    const { fetch, calls } = fakeFetch([
      (req) =>
        json(200, {
          accepted: req.events.length - 1,
          duplicates: 1,
          rejected: 0,
          errors: [],
          errors_truncated: false,
        }),
      () => problem(401, "unauthenticated"),
    ]);
    const err = await failure(client(fetch).events.ingest(list));

    expect(calls).toHaveLength(2);
    expect(instance(err.cause, ApiError).code).toBe("unauthenticated");
    expect(err.summary).toEqual({
      accepted: 499,
      duplicates: 1,
      rejected: 0,
      errors: [],
      errors_truncated: false,
      batches: 1,
    });
    expect(err.remainingFrom).toBe(500);
    expect(err.remaining).toHaveLength(600);
    // The second batch's events are remaining's first 500, with the ids they were sent with.
    const sentIds = calls[1]?.events.map((e) => e.event_id);
    expect(err.remaining.slice(0, 500).map((e) => e.event_id)).toEqual(sentIds);
    expect(err.remaining[200]?.event_id).toBe("caller-700");
    expect(err.remaining.every((e) => typeof e.event_id === "string")).toBe(
      true,
    );
    expect(err.remaining[0]?.event_type).toBe("step-500");
    // The caller's own objects were not given ids.
    expect("event_id" in (list[500] ?? {})).toBe(false);
  });

  it("reports an event too large to send in the summary, never in remaining", async () => {
    const big: EventInput = event(2, {
      metadata: { pad: "x".repeat(5_000_000) },
    });
    const { fetch } = fakeFetch([() => problem(403, "insufficient_scope")]);
    const err = await failure(
      client(fetch).events.ingest([event(0), event(1), big, event(3)]),
    );
    expect(err.summary.rejected).toBe(1);
    expect(err.summary.errors).toMatchObject([{ index: 2, code: "too_large" }]);
    expect(err.remainingFrom).toBe(0);
    expect(err.remaining.map((e) => e.event_type)).toEqual([
      "step-0",
      "step-1",
      "step-3",
    ]);
  });

  it("is an AllisallError whose cause is the failure", async () => {
    const { fetch } = fakeFetch([() => problem(400, "invalid_json")]);
    const err = await failure(client(fetch).events.ingest([event(0)]));
    expect(err).toBeInstanceOf(AllisallError);
    expect(err.cause).toBeInstanceOf(ApiError);
    expect(err.cause).toBeInstanceOf(AllisallError);
  });
});

describe("errors", () => {
  it("builds an ApiError from a problem document, with its code, request_id and errors", async () => {
    const { fetch } = fakeFetch([
      () =>
        problem(400, "validation_failed", {
          request_id: "req-42",
          errors: [
            { code: "required", pointer: "/events", detail: "Required." },
            { code: "a_new_field_code", header: "X-Thing", detail: "New." },
          ],
          a_member_added_later: true,
        }),
    ]);
    const err = await failure(client(fetch).events.ingest([event(0)]));
    const api = instance(err.cause, ApiError);
    expect(api.status).toBe(400);
    expect(api.code).toBe("validation_failed");
    expect(api.requestId).toBe("req-42");
    expect(api.problem?.errors).toEqual([
      { code: "required", pointer: "/events", detail: "Required." },
      { code: "a_new_field_code", header: "X-Thing", detail: "New." },
    ]);
    expect(api.headers.get("content-type")).toBe("application/problem+json");
  });

  it("keeps a code it does not know as a string", async () => {
    const { fetch } = fakeFetch([() => problem(409, "a_code_added_later")]);
    const err = await failure(client(fetch).events.ingest([event(0)]));
    const api = instance(err.cause, ApiError);
    expect(api.code).toBe("a_code_added_later");
    expect(api.status).toBe(409);
  });

  it("gives a non-problem body an ApiError with a status and no code", async () => {
    const { fetch } = fakeFetch([
      () =>
        new Response("<html>Bad gateway</html>", {
          status: 502,
          headers: { "Content-Type": "text/html", "X-Request-Id": "proxy-1" },
        }),
    ]);
    const err = await failure(client(fetch).events.ingest([event(0)]));
    const api = instance(err.cause, ApiError);
    expect(api.status).toBe(502);
    expect(api.code).toBeUndefined();
    expect(api.problem).toBeUndefined();
    expect(api.requestId).toBe("proxy-1");
  });

  it("reports a 2xx body of the wrong shape as an ApiError, without retrying", async () => {
    const { fetch, calls } = fakeFetch([() => json(200, { ok: true })]);
    const c = new Allisall({ apiKey: "aia_test", fetch });
    const err = await failure(c.events.ingest([event(0)]));
    const api = instance(err.cause, ApiError);
    expect(api.status).toBe(200);
    expect(api.problem).toBeUndefined();
    expect(calls).toHaveLength(1);
  });

  it("makes ConnectionError an AllisallError", () => {
    const err = new ConnectionError("id-1", new TypeError("fetch failed"));
    expect(err).toBeInstanceOf(AllisallError);
    expect(err.requestId).toBe("id-1");
    expect(err.cause).toBeInstanceOf(TypeError);
  });
});
