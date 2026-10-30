import { describe, expect, it } from "vitest";
import {
  Allisall,
  type Decimal,
  decimal,
  type EventInput,
} from "../src/index.js";
import { event, fakeFetch } from "./helpers.js";

function client(fetch: ReturnType<typeof fakeFetch>["fetch"]): Allisall {
  return new Allisall({ apiKey: "aia_test", fetch, maxRetries: 0 });
}

/** Ingests one event and returns the body text sent. */
async function sent(e: EventInput): Promise<string> {
  const { fetch, calls } = fakeFetch();
  await client(fetch).events.ingest([e]);
  return calls[0]?.text ?? "";
}

/** Ingests events whose encoding must fail, and asserts nothing was sent. */
async function refused(e: EventInput): Promise<unknown> {
  const { fetch, calls } = fakeFetch();
  const err = await client(fetch)
    .events.ingest([event(0), e])
    .then(
      () => undefined,
      (x: unknown) => x,
    );
  expect(calls).toHaveLength(0);
  return err;
}

/**
 * An unbranded string where a `Decimal` belongs, as untyped JavaScript
 * would pass it. Reading it back through a `Record` keeps the test free of
 * a cast.
 */
function unbranded(text: string): Decimal {
  const holder: Record<string, Decimal> = JSON.parse(
    JSON.stringify({ value: text }),
  );
  const value = holder.value;
  if (value === undefined) throw new Error("unreachable");
  return value;
}

describe("encoding", () => {
  it('writes cost decimal("0.3683") as the number 0.3683', async () => {
    const text = await sent(event(0, { cost: decimal("0.3683") }));
    expect(text).toContain('"cost":0.3683');
  });

  it("writes a native number cost as its shortest round-trip text", async () => {
    const text = await sent(event(0, { cost: 12.5 }));
    expect(text).toContain('"cost":12.5');
  });

  it('refuses the cost string 1,"agent_key":"x" before sending', async () => {
    const err = await refused(
      event(1, { cost: unbranded('1,"agent_key":"x"') }),
    );
    expect(err).toBeInstanceOf(TypeError);
  });

  it.each(["quantity", "cost", "tokens_in", "tokens_out"] as const)(
    "refuses a non-finite %s before sending",
    async (name) => {
      expect(await refused(event(1, { [name]: Number.NaN }))).toBeInstanceOf(
        TypeError,
      );
      expect(
        await refused(event(1, { [name]: Number.POSITIVE_INFINITY })),
      ).toBeInstanceOf(TypeError);
    },
  );

  it("refuses an invalid Date before sending", async () => {
    const err = await refused(event(1, { timestamp: new Date("not a date") }));
    expect(err).toBeInstanceOf(TypeError);
  });

  it("refuses text that is not valid Unicode before sending", async () => {
    expect(
      await refused(event(1, { event_type: "lone \uD800 surrogate" })),
    ).toBeInstanceOf(TypeError);
    expect(
      await refused(event(1, { metadata: { "\uDC00key": 1 } })),
    ).toBeInstanceOf(TypeError);
  });

  it("writes a Date as toISOString(), in UTC with milliseconds", async () => {
    const at = new Date(Date.UTC(2026, 9, 1, 9, 30, 0, 5));
    const text = await sent(event(0, { timestamp: at }));
    expect(text).toContain('"timestamp":"2026-10-01T09:30:00.005Z"');
  });

  it("sends every member, omits undefined, and sends null as null", async () => {
    // `costs` is misspelt: it reaches the API, which refuses the row.
    const e = Object.assign(event(0, { event_id: "id-1", model: null }), {
      costs: 1,
      outcome_type: undefined,
    });
    const { fetch, calls } = fakeFetch();
    await client(fetch).events.ingest([e]);
    const body = calls[0]?.events[0];
    expect(body).toEqual({
      timestamp: "2026-10-01T00:00:00Z",
      agent_key: "agent-1",
      category: "task",
      event_type: "step-0",
      event_id: "id-1",
      model: null,
      costs: 1,
    });
    expect(calls[0]?.text).not.toContain("outcome_type");
  });

  it("writes a paired surrogate, such as an emoji, as UTF-8", async () => {
    const text = await sent(event(0, { event_type: "ok 😀" }));
    expect(text).toContain('"event_type":"ok 😀"');
  });

  it("writes a non-finite metadata number as null, as JSON.stringify does", async () => {
    const text = await sent(event(0, { metadata: { n: Number.NaN } }));
    expect(text).toContain('"metadata":{"n":null}');
  });
});

describe("decimal()", () => {
  it.each(["0", "-0", "12", "12.5", "-0.000001", "99999999.999999"])(
    "accepts %s",
    (text) => {
      expect(decimal(text)).toBe(text);
    },
  );

  it.each(["", "01", "1.", ".5", "+1", "1e3", " 1", "1,5", "NaN"])(
    "refuses %j",
    (text) => {
      expect(() => decimal(text)).toThrow(TypeError);
    },
  );
});
