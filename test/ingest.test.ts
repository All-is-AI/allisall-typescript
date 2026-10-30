import { describe, expect, it } from "vitest";
import { Allisall, type EventInput } from "../src/index.js";
import {
  byteLength,
  event,
  eventOfSize,
  fakeFetch,
  json,
  UUID_V4,
} from "./helpers.js";

function client(fetch: ReturnType<typeof fakeFetch>["fetch"]): Allisall {
  return new Allisall({ apiKey: "aia_test", fetch, maxRetries: 0 });
}

function events(n: number): EventInput[] {
  return Array.from({ length: n }, (_, i) => event(i));
}

describe("splitting", () => {
  it("sends 500 events as one batch", async () => {
    const { fetch, calls } = fakeFetch();
    const summary = await client(fetch).events.ingest(events(500));
    expect(calls.map((c) => c.events.length)).toEqual([500]);
    expect(summary.batches).toBe(1);
    expect(summary.accepted).toBe(500);
  });

  it("sends 501 events as 500, then 1, in input order", async () => {
    const { fetch, calls } = fakeFetch();
    const summary = await client(fetch).events.ingest(events(501));
    expect(calls.map((c) => c.events.length)).toEqual([500, 1]);
    expect(calls[1]?.events[0]?.event_type).toBe("step-500");
    expect(summary.batches).toBe(2);
    expect(summary.accepted).toBe(501);
  });

  // size = 13 + s1 + s2 + 1 comma. 13 + 2,499,993 × 2 + 1 = 5,000,000.
  it("sends a batch of exactly 5,000,000 bytes as one", async () => {
    const { fetch, calls } = fakeFetch();
    const list = [eventOfSize(2_499_993, "a"), eventOfSize(2_499_993, "b")];
    await client(fetch).events.ingest(list);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.body.length).toBe(5_000_000);
  });

  it("splits before the event that takes the body one byte over", async () => {
    const { fetch, calls } = fakeFetch();
    const list = [eventOfSize(2_499_993, "a"), eventOfSize(2_499_994, "b")];
    await client(fetch).events.ingest(list);
    expect(calls.map((c) => c.body.length)).toEqual([
      13 + 2_499_993,
      13 + 2_499_994,
    ]);
  });

  it("sends an event of 4,999,987 bytes alone", async () => {
    const { fetch, calls } = fakeFetch();
    const summary = await client(fetch).events.ingest([
      eventOfSize(4_999_987, "a"),
    ]);
    expect(calls.map((c) => c.body.length)).toEqual([5_000_000]);
    expect(summary).toMatchObject({ accepted: 1, rejected: 0, errors: [] });
  });

  it("does not send an event of 4,999,988 bytes, and reports it as too_large", async () => {
    const { fetch, calls } = fakeFetch();
    const summary = await client(fetch).events.ingest([
      eventOfSize(4_999_988, "a"),
    ]);
    expect(calls).toHaveLength(0);
    expect(summary).toMatchObject({
      accepted: 0,
      duplicates: 0,
      rejected: 1,
      batches: 0,
      errors: [{ index: 0, code: "too_large", pointer: "/events/0" }],
    });
    expect(summary.errors[0]?.detail).toContain("4999987");
  });

  it("measures an event in UTF-8 bytes, not characters", async () => {
    // "é" is 2 bytes and 1 UTF-16 unit; "😀" is 4 bytes and 2 units.
    // The two events total 4,999,987 bytes: one byte over the 4,999,986
    // that fit beside the envelope and the comma. Counted in UTF-16 units
    // they are 3 short of the limit, so counting characters would send one
    // batch.
    const second = eventOfSize(2_499_994, "b", "é😀");
    const text = JSON.stringify(second);
    expect(byteLength(text) - text.length).toBe(3);

    const { fetch, calls } = fakeFetch();
    await client(fetch).events.ingest([eventOfSize(2_499_993, "a"), second]);
    expect(calls).toHaveLength(2);
    expect(calls[1]?.body.length).toBe(13 + 2_499_994);
  });
});

describe("combining", () => {
  it("rewrites row errors by their batch's offset and sums the counts", async () => {
    // 503 events: batch 1 holds 0 to 499, batch 2 holds 500 to 502.
    const { fetch } = fakeFetch([
      () =>
        json(200, {
          accepted: 497,
          duplicates: 2,
          rejected: 1,
          errors: [
            {
              index: 3,
              code: "invalid_format",
              pointer: "/events/3/timestamp",
              detail: "d1",
            },
          ],
          errors_truncated: false,
        }),
      () =>
        json(200, {
          accepted: 1,
          duplicates: 0,
          rejected: 2,
          errors: [
            {
              index: 1,
              code: "required",
              pointer: "/events/1/agent_key",
              detail: "d2",
            },
            {
              index: 2,
              code: "a_code_added_later",
              pointer: "/events/2",
              detail: "d3",
            },
          ],
          errors_truncated: true,
          a_member_added_later: 1,
        }),
    ]);
    const summary = await client(fetch).events.ingest(events(503));
    expect(summary).toEqual({
      accepted: 498,
      duplicates: 2,
      rejected: 3,
      errors: [
        {
          index: 3,
          code: "invalid_format",
          pointer: "/events/3/timestamp",
          detail: "d1",
        },
        {
          index: 501,
          code: "required",
          pointer: "/events/501/agent_key",
          detail: "d2",
        },
        {
          index: 502,
          code: "a_code_added_later",
          pointer: "/events/502",
          detail: "d3",
        },
      ],
      errors_truncated: true,
      batches: 2,
    });
    expect(summary.accepted + summary.duplicates + summary.rejected).toBe(503);
  });

  it("leaves errors_truncated false when no batch truncated", async () => {
    const { fetch } = fakeFetch();
    const summary = await client(fetch).events.ingest(events(501));
    expect(summary.errors_truncated).toBe(false);
  });

  it("maps row errors past an event too large to send, and orders errors by index", async () => {
    // Index 1 is too large, so the one batch holds indexes 0, 2 and 3.
    const list = [event(0), eventOfSize(4_999_988, "big"), event(2), event(3)];
    const { fetch, calls } = fakeFetch([
      () =>
        json(200, {
          accepted: 2,
          duplicates: 0,
          rejected: 1,
          errors: [
            {
              index: 1,
              code: "required",
              pointer: "/events/1/model",
              detail: "d",
            },
          ],
          errors_truncated: false,
        }),
    ]);
    const summary = await client(fetch).events.ingest(list);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.events.map((e) => e.event_type)).toEqual([
      "step-0",
      "step-2",
      "step-3",
    ]);
    expect(summary.rejected).toBe(2);
    expect(summary.errors.map((e) => [e.index, e.code, e.pointer])).toEqual([
      [1, "too_large", "/events/1"],
      [2, "required", "/events/2/model"],
    ]);
  });

  it("sends no request for an empty list and returns zeros", async () => {
    const { fetch, calls } = fakeFetch();
    const summary = await client(fetch).events.ingest([]);
    expect(calls).toHaveLength(0);
    expect(summary).toEqual({
      accepted: 0,
      duplicates: 0,
      rejected: 0,
      errors: [],
      errors_truncated: false,
      batches: 0,
    });
  });
});

describe("event_id", () => {
  it("replaces an absent, null or empty id with a UUID version 4", async () => {
    const { fetch, calls } = fakeFetch();
    await client(fetch).events.ingest([
      event(0),
      event(1, { event_id: null }),
      event(2, { event_id: "" }),
    ]);
    const ids = calls[0]?.events.map((e) => e.event_id);
    expect(ids).toHaveLength(3);
    for (const id of ids ?? []) expect(id).toMatch(UUID_V4);
    expect(new Set(ids).size).toBe(3);
  });

  it("sends a caller's id unchanged and leaves the caller's objects unchanged", async () => {
    const list = [event(0, { event_id: "caller-id" }), event(1)];
    const before = structuredClone(list);
    const { fetch, calls } = fakeFetch();
    await client(fetch).events.ingest(list);
    expect(calls[0]?.events[0]?.event_id).toBe("caller-id");
    expect(list).toEqual(before);
    expect("event_id" in (list[1] ?? {})).toBe(false);
  });

  it("sends identical body bytes on every attempt of one batch", async () => {
    const { fetch, calls } = fakeFetch([() => json(503, {})]);
    const c = new Allisall({ apiKey: "aia_test", fetch, maxRetries: 1 });
    const list = events(3);
    // Retry-After absent, so the backoff applies; keep it short and real.
    await c.events.ingest(list);
    expect(calls).toHaveLength(2);
    expect(calls[1]?.body).toEqual(calls[0]?.body);
    expect(calls[0]?.events.every((e) => typeof e.event_id === "string")).toBe(
      true,
    );
  });
});
