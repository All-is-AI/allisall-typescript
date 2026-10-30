import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  Allisall,
  ApiError,
  ConnectionError,
  IngestError,
} from "../src/index.js";
import { backoffMs, parseRetryAfter } from "../src/retry.js";
import {
  event,
  fakeFetch,
  instance,
  json,
  problem,
  type Responder,
  reset,
  UUID_V4,
} from "./helpers.js";

function failure(status: number): Responder {
  return () =>
    status === 429 || status === 500
      ? problem(status, status === 429 ? "rate_limited" : "internal_error")
      : json(status, {});
}

/** Lets pending promises run without moving the fake clock. */
async function settle(): Promise<void> {
  await vi.advanceTimersByTimeAsync(0);
}

function causeOf(err: unknown): unknown {
  return instance(err, IngestError).cause;
}

describe("retries, on a fake clock", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
    vi.setSystemTime(new Date("2026-10-28T12:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it.each([408, 429, 500, 502, 503, 504])("retries %i", async (status) => {
    const { fetch, calls } = fakeFetch([failure(status)]);
    const done = new Allisall({ apiKey: "aia_k", fetch }).events.ingest([
      event(0),
    ]);
    await vi.runAllTimersAsync();
    await expect(done).resolves.toMatchObject({ accepted: 1 });
    expect(calls).toHaveLength(2);
  });

  it("retries a connection reset", async () => {
    const { fetch, calls } = fakeFetch([reset]);
    const done = new Allisall({ apiKey: "aia_k", fetch }).events.ingest([
      event(0),
    ]);
    await vi.runAllTimersAsync();
    await expect(done).resolves.toMatchObject({ accepted: 1 });
    expect(calls).toHaveLength(2);
  });

  it.each([400, 401, 403, 413, 415, 501])(
    "does not retry %i",
    async (status) => {
      const { fetch, calls } = fakeFetch([failure(status)]);
      const caught = new Allisall({ apiKey: "aia_k", fetch }).events
        .ingest([event(0)])
        .catch((err: unknown) => err);
      await vi.runAllTimersAsync();
      expect(instance(causeOf(await caught), ApiError).status).toBe(status);
      expect(calls).toHaveLength(1);
    },
  );

  it("gives up after two retries by default, ending with the last error", async () => {
    const { fetch, calls } = fakeFetch([], failure(503));
    const caught = new Allisall({ apiKey: "aia_k", fetch }).events
      .ingest([event(0)])
      .catch((err: unknown) => err);
    await vi.runAllTimersAsync();
    expect(instance(causeOf(await caught), ApiError).status).toBe(503);
    expect(calls).toHaveLength(3);
  });

  it("sends one attempt when maxRetries is 0", async () => {
    const { fetch, calls } = fakeFetch([], failure(503));
    const caught = new Allisall({
      apiKey: "aia_k",
      fetch,
      maxRetries: 0,
    }).events
      .ingest([event(0)])
      .catch((err: unknown) => err);
    await vi.runAllTimersAsync();
    expect(instance(causeOf(await caught), ApiError).status).toBe(503);
    expect(calls).toHaveLength(1);
  });

  it("waits the 2 seconds Retry-After: 2 asks for", async () => {
    const { fetch, calls } = fakeFetch([
      () => problem(429, "rate_limited", {}, { "Retry-After": "2" }),
    ]);
    const done = new Allisall({ apiKey: "aia_k", fetch }).events.ingest([
      event(0),
    ]);
    await settle();
    expect(calls).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1999);
    expect(calls).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(calls).toHaveLength(2);
    await expect(done).resolves.toMatchObject({ accepted: 1 });
  });

  it("waits until the HTTP-date Retry-After names", async () => {
    // 5 seconds after the fake clock's now.
    const at = "Wed, 28 Oct 2026 12:00:05 GMT";
    const { fetch, calls } = fakeFetch([
      () => json(503, {}, { "Retry-After": at }),
    ]);
    const done = new Allisall({ apiKey: "aia_k", fetch }).events.ingest([
      event(0),
    ]);
    await settle();
    await vi.advanceTimersByTimeAsync(4999);
    expect(calls).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(calls).toHaveLength(2);
    await expect(done).resolves.toMatchObject({ accepted: 1 });
  });

  it("does not retry when Retry-After asks for 61 seconds", async () => {
    const { fetch, calls } = fakeFetch([
      () => problem(429, "rate_limited", {}, { "Retry-After": "61" }),
    ]);
    const caught = new Allisall({ apiKey: "aia_k", fetch }).events
      .ingest([event(0)])
      .catch((err: unknown) => err);
    await vi.runAllTimersAsync();
    const cause = instance(causeOf(await caught), ApiError);
    expect(calls).toHaveLength(1);
    expect(cause.code).toBe("rate_limited");
    expect(cause.retryAfter).toBe(61_000);
  });

  it("retries when Retry-After asks for exactly 60 seconds", async () => {
    const { fetch, calls } = fakeFetch([
      () => problem(429, "rate_limited", {}, { "Retry-After": "60" }),
    ]);
    const done = new Allisall({ apiKey: "aia_k", fetch }).events.ingest([
      event(0),
    ]);
    await settle();
    await vi.advanceTimersByTimeAsync(59_999);
    expect(calls).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(calls).toHaveLength(2);
    await expect(done).resolves.toMatchObject({ accepted: 1 });
  });

  it.each([
    // Math.random() = 0 gives the factor 1; just under 1 gives just over 0.75.
    [0, 500, 1000],
    [0.999_999, 375, 750],
  ])(
    "without Retry-After, with Math.random() = %d, waits about %i ms then %i ms",
    async (random, first, second) => {
      vi.spyOn(Math, "random").mockReturnValue(random);
      const { fetch, calls } = fakeFetch([failure(503), failure(503)]);
      const done = new Allisall({ apiKey: "aia_k", fetch }).events.ingest([
        event(0),
      ]);
      await settle();
      // Retry 1: nothing 1 ms before the wait ends; the retry 1 ms after.
      await vi.advanceTimersByTimeAsync(first - 1);
      expect(calls).toHaveLength(1);
      await vi.advanceTimersByTimeAsync(2);
      expect(calls).toHaveLength(2);
      // Retry 2, timed from the second attempt, which the step above sent 1 ms late.
      await vi.advanceTimersByTimeAsync(second - 2);
      expect(calls).toHaveLength(2);
      await vi.advanceTimersByTimeAsync(2);
      expect(calls).toHaveLength(3);
      await expect(done).resolves.toMatchObject({ accepted: 1 });
    },
  );

  it("keeps every backoff within 0.375 to 0.5 s for retry 1, and 0.75 to 1 s for retry 2", () => {
    for (let i = 0; i < 1000; i++) {
      const one = backoffMs(1);
      const two = backoffMs(2);
      expect(one).toBeGreaterThan(375);
      expect(one).toBeLessThanOrEqual(500);
      expect(two).toBeGreaterThan(750);
      expect(two).toBeLessThanOrEqual(1000);
    }
  });

  it("ignores a Retry-After that does not parse, and backs off instead", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const { fetch, calls } = fakeFetch([
      () => json(503, {}, { "Retry-After": "soon" }),
    ]);
    const done = new Allisall({ apiKey: "aia_k", fetch }).events.ingest([
      event(0),
    ]);
    await settle();
    await vi.advanceTimersByTimeAsync(499);
    expect(calls).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(calls).toHaveLength(2);
    await done;
  });

  it("calls the token provider once per attempt, and sends a new X-Request-Id each time", async () => {
    let n = 0;
    const tokenProvider = vi.fn(() => `aia_token_${++n}`);
    const { fetch, calls } = fakeFetch([failure(503), failure(503)]);
    const done = new Allisall({ tokenProvider, fetch }).events.ingest([
      event(0),
    ]);
    await vi.runAllTimersAsync();
    await done;
    expect(tokenProvider).toHaveBeenCalledTimes(3);
    expect(calls.map((c) => c.headers.authorization)).toEqual([
      "Bearer aia_token_1",
      "Bearer aia_token_2",
      "Bearer aia_token_3",
    ]);
    const ids = calls.map((c) => c.headers["x-request-id"]);
    for (const id of ids) expect(id).toMatch(UUID_V4);
    expect(new Set(ids).size).toBe(3);
  });

  it("fails the batch on a token provider error, keeping the summary and the ids in remaining", async () => {
    // 503 events: batch 1 holds 0 to 499 and is stored; batch 2 holds 500
    // to 502. Its first attempt gets a 503, and the provider fails before
    // the retry, so the ids batch 2 was sent with can be compared.
    const boom = new Error("secret store unavailable");
    let n = 0;
    const tokenProvider = vi.fn(async (): Promise<string> => {
      n++;
      if (n === 3) throw boom;
      return "aia_k";
    });
    const { fetch, calls } = fakeFetch([
      (req) =>
        json(200, {
          accepted: req.events.length,
          duplicates: 0,
          rejected: 0,
          errors: [],
          errors_truncated: false,
        }),
      failure(503),
    ]);
    const list = Array.from({ length: 503 }, (_, i) => event(i));
    const caught = new Allisall({ tokenProvider, fetch }).events
      .ingest(list)
      .catch((err: unknown) => err);
    await vi.runAllTimersAsync();
    const err = instance(await caught, IngestError);

    expect(err.cause).toBe(boom);
    expect(tokenProvider).toHaveBeenCalledTimes(3);
    expect(calls).toHaveLength(2);
    expect(err.summary).toEqual({
      accepted: 500,
      duplicates: 0,
      rejected: 0,
      errors: [],
      errors_truncated: false,
      batches: 1,
    });
    expect(err.remainingFrom).toBe(500);
    expect(err.remaining.map((e) => e.event_type)).toEqual([
      "step-500",
      "step-501",
      "step-502",
    ]);
    const sentIds = calls[1]?.events.map((e) => e.event_id);
    expect(sentIds).toHaveLength(3);
    expect(err.remaining.map((e) => e.event_id)).toEqual(sentIds);
  });

  it("stops waiting when the caller cancels, and does not retry", async () => {
    const { fetch, calls } = fakeFetch([failure(503)]);
    const controller = new AbortController();
    const caught = new Allisall({ apiKey: "aia_k", fetch }).events
      .ingest([event(0)], { signal: controller.signal })
      .catch((err: unknown) => err);
    await settle();
    expect(calls).toHaveLength(1);
    const reason = new Error("caller stopped");
    controller.abort(reason);
    await vi.runAllTimersAsync();
    expect(causeOf(await caught)).toBe(reason);
    expect(calls).toHaveLength(1);
  });

  it("reports a connection failure on the last attempt as a ConnectionError with the request id sent", async () => {
    const { fetch, calls } = fakeFetch([], reset);
    const caught = new Allisall({
      apiKey: "aia_k",
      fetch,
      maxRetries: 1,
    }).events
      .ingest([event(0)])
      .catch((err: unknown) => err);
    await vi.runAllTimersAsync();
    const cause = instance(causeOf(await caught), ConnectionError);
    expect(calls).toHaveLength(2);
    expect(cause.requestId).toBe(calls[1]?.headers["x-request-id"]);
    expect(cause.cause).toBeInstanceOf(TypeError);
  });
});

describe("the per-attempt timeout, on the real clock", () => {
  it("ends an attempt that outlasts the timeout as a ConnectionError", async () => {
    const hang: Responder = (_req, signal) =>
      new Promise((_resolve, reject) => {
        signal?.addEventListener("abort", () => reject(signal.reason));
      });
    const { fetch, calls } = fakeFetch([hang]);
    const err = await new Allisall({
      apiKey: "aia_k",
      fetch,
      timeout: 20,
      maxRetries: 0,
    }).events
      .ingest([event(0)])
      .catch((e: unknown) => e);
    expect(calls).toHaveLength(1);
    const cause = instance(causeOf(err), ConnectionError);
    expect(instance(cause.cause, Error).name).toBe("TimeoutError");
  });
});

describe("parseRetryAfter", () => {
  const now = Date.UTC(2026, 9, 28, 12, 0, 0);
  it.each([
    ["2", 2000],
    ["0", 0],
    ["Wed, 28 Oct 2026 12:00:05 GMT", 5000],
    ["Wednesday, 28-Oct-26 12:00:05 GMT", 5000],
    ["Wed Oct 28 12:00:05 2026", 5000],
    ["Wed, 28 Oct 2026 11:59:59 GMT", undefined],
    ["soon", undefined],
    ["1.5", undefined],
    ["-1", undefined],
    [null, undefined],
  ])("reads %j as %s ms", (value, expected) => {
    expect(parseRetryAfter(value, now)).toBe(expected);
  });

  it("reads a two-digit year at most 50 years ahead as this century (RFC 9110 §5.6.7)", () => {
    // 76 is 2076, 50 years after the fixed clock's 2026: in the future.
    expect(parseRetryAfter("Wednesday, 28-Oct-76 12:00:05 GMT", now)).toBe(
      Date.UTC(2076, 9, 28, 12, 0, 5) - now,
    );
    // 77 would be 51 years ahead, so it is 1977: in the past, and ignored.
    expect(
      parseRetryAfter("Thursday, 28-Oct-77 12:00:05 GMT", now),
    ).toBeUndefined();
  });
});
