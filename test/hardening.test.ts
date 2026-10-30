// Edge cases at the client's boundaries: credentials with control characters,
// redirects, lenient problem documents, the request id, and row-error
// indexes outside their batch.

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  Allisall,
  AllisallError,
  ApiError,
  ConnectionError,
  IngestError,
} from "../src/index.js";
import {
  accepted,
  event,
  fakeFetch,
  instance,
  json,
  type Responder,
} from "./helpers.js";

afterEach(() => {
  vi.unstubAllEnvs();
});

/** The part of each bad credential that must never appear in an error. */
const SECRET = "SECRETVALUE";

function failure(promise: Promise<unknown>): Promise<unknown> {
  return promise.then(
    () => undefined,
    (err: unknown) => err,
  );
}

function thrown(fn: () => unknown): unknown {
  try {
    fn();
  } catch (err) {
    return err;
  }
  throw new Error("expected a throw");
}

/** Asserts that no part of the credential appears anywhere in the error. */
function expectNoSecret(err: unknown): void {
  const texts = [String(err)];
  let e: unknown = err;
  while (e instanceof Error) {
    texts.push(e.message, String(e));
    e = e.cause;
  }
  for (const text of texts) {
    expect(text).not.toContain(SECRET);
    expect(text).not.toContain("aia_");
  }
}

/**
 * Credentials holding a character outside U+0021 to U+007E. Each sits
 * inside the credential, so trimming the ends cannot remove it.
 */
const UNPRINTABLE: [string, string][] = [
  ["CR LF", `aia_${SECRET}\r\nX-Evil: 1`],
  ["NUL", `aia_${SECRET}\u0000x`],
  ["tab", `aia_${SECRET}\tx`],
  ["U+001F", `aia_${SECRET}\u001fx`],
  ["DEL", `aia_${SECRET}\u007fx`],
  ["an inner space", `aia_${SECRET} x`],
  ["é", `aia_${SECRET}éx`],
  ["an emoji", `aia_${SECRET}😀x`],
];

describe("a credential holding a character other than printable ASCII", () => {
  it.each(UNPRINTABLE)(
    "refuses an apiKey option holding %s at construction, without quoting it",
    (_, apiKey) => {
      const err = instance(
        thrown(() => new Allisall({ apiKey })),
        AllisallError,
      );
      expect(err.message).toContain("printable ASCII");
      expectNoSecret(err);
    },
  );

  // An environment variable cannot hold NUL: Node cuts the value there.
  it.each(UNPRINTABLE.filter(([name]) => name !== "NUL"))(
    "refuses AIA_API_KEY holding %s at construction, without quoting it",
    (_, value) => {
      vi.stubEnv("AIA_API_KEY", value);
      const err = instance(
        thrown(() => new Allisall()),
        AllisallError,
      );
      expectNoSecret(err);
    },
  );

  it("accepts every printable ASCII character", () => {
    let all = "";
    for (let c = 0x21; c <= 0x7e; c++) all += String.fromCharCode(c);
    expect(() => new Allisall({ apiKey: `aia_${all}` })).not.toThrow();
  });

  it("trims whitespace around an apiKey and AIA_API_KEY, and sends the trimmed key", async () => {
    const { fetch, calls } = fakeFetch();
    await new Allisall({ apiKey: " \taia_opt\r\n", fetch }).events.ingest([
      event(0),
    ]);
    vi.stubEnv("AIA_API_KEY", "\naia_env  ");
    await new Allisall({ fetch }).events.ingest([event(0)]);
    expect(calls.map((c) => c.headers.authorization)).toEqual([
      "Bearer aia_opt",
      "Bearer aia_env",
    ]);
  });

  it("treats an apiKey of white space alone as empty, and AIA_API_KEY of white space alone as unset", () => {
    expect(() => new Allisall({ apiKey: " \n " })).toThrow("empty");
    vi.stubEnv("AIA_API_KEY", " \t ");
    expect(() => new Allisall()).toThrow("no credential");
  });

  it.each(UNPRINTABLE)(
    "fails the batch when a provider's token holds %s, without quoting it",
    async (_, token) => {
      const { fetch, calls } = fakeFetch();
      const client = new Allisall({ tokenProvider: () => token, fetch });
      const err = instance(
        await failure(client.events.ingest([event(0)])),
        IngestError,
      );
      // The SDK's own refusal, not a ConnectionError from fetch's header check.
      const cause = instance(err.cause, AllisallError);
      expect(cause).not.toBeInstanceOf(ConnectionError);
      expect(cause.message).toContain("printable ASCII");
      expect(calls).toHaveLength(0);
      expect(err.remaining).toHaveLength(1);
      expectNoSecret(err);
    },
  );

  it.each([
    ["empty", ""],
    ["white space alone", "  \n"],
  ])(
    "fails the batch, unretried, when a provider's token is %s",
    async (_, token) => {
      const tokenProvider = vi.fn(() => token);
      const { fetch, calls } = fakeFetch();
      const err = instance(
        await failure(
          new Allisall({ tokenProvider, fetch }).events.ingest([event(0)]),
        ),
        IngestError,
      );
      const cause = instance(err.cause, AllisallError);
      expect(cause).not.toBeInstanceOf(ConnectionError);
      expect(cause.message).toBe(
        "allisall: the token provider returned an empty token",
      );
      expect(tokenProvider).toHaveBeenCalledTimes(1);
      expect(calls).toHaveLength(0);
      expect(err.remaining).toHaveLength(1);
    },
  );

  it("trims whitespace around a provider's token, and sends the trimmed token", async () => {
    const { fetch, calls } = fakeFetch();
    await new Allisall({
      tokenProvider: () => "  eyJ.session.jwt\n",
      fetch,
    }).events.ingest([event(0)]);
    expect(calls[0]?.headers.authorization).toBe("Bearer eyJ.session.jwt");
  });

  it("checks the provider's token before every attempt, retries included", async () => {
    let n = 0;
    const tokenProvider = (): string =>
      ++n === 1 ? "aia_good" : `aia_${SECRET}\u0000`;
    const { fetch, calls } = fakeFetch([() => json(503, {})]);
    const err = instance(
      await failure(
        new Allisall({ tokenProvider, fetch, maxRetries: 1 }).events.ingest([
          event(0),
        ]),
      ),
      IngestError,
    );
    expect(n).toBe(2);
    expect(calls).toHaveLength(1);
    instance(err.cause, AllisallError);
    expectNoSecret(err);
  });
});

describe("redirects", () => {
  it("sends every request with redirect: manual", async () => {
    const { fetch, calls } = fakeFetch();
    await new Allisall({ apiKey: "aia_k", fetch }).events.ingest([event(0)]);
    expect(calls[0]?.redirect).toBe("manual");
  });

  /**
   * Answers as fetch does at a redirecting server: with `redirect: "manual"`
   * it hands back `manual()`; otherwise fetch follows the redirect, sending
   * the request and its Authorization header on, and the target accepts it.
   */
  function redirecting(manual: () => Response): Responder {
    return (req) => (req.redirect === "manual" ? manual() : accepted(req));
  }

  it.each([301, 302, 303, 307, 308])(
    "refuses a %i as an ApiError, without following or retrying",
    async (status) => {
      const { fetch, calls } = fakeFetch([
        redirecting(
          () =>
            new Response(null, {
              status,
              headers: { Location: "https://elsewhere.test/v1/events" },
            }),
        ),
      ]);
      const err = instance(
        await failure(
          new Allisall({ apiKey: "aia_k", fetch }).events.ingest([event(0)]),
        ),
        IngestError,
      );
      const api = instance(err.cause, ApiError);
      expect(api.status).toBe(status);
      expect(api.code).toBeUndefined();
      expect(api.message).toContain("redirect");
      expect(calls).toHaveLength(1);
    },
  );

  it("refuses a browser's opaque redirect, status 0, without following or retrying", async () => {
    const { fetch, calls } = fakeFetch([
      redirecting(() => {
        // fetch with redirect: "manual" in a browser gives this shape, which
        // the Response constructor cannot build.
        const r = new Response(null, { status: 200 });
        Object.defineProperty(r, "status", { value: 0 });
        Object.defineProperty(r, "type", { value: "opaqueredirect" });
        return r;
      }),
    ]);
    const err = instance(
      await failure(
        new Allisall({ apiKey: "aia_k", fetch }).events.ingest([event(0)]),
      ),
      IngestError,
    );
    const api = instance(err.cause, ApiError);
    expect(api.status).toBe(0);
    expect(api.message).toContain("redirect");
    expect(calls).toHaveLength(1);
  });
});

function problemResponse(
  body: Record<string, unknown>,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status: 400,
    headers: { "Content-Type": "application/problem+json", ...headers },
  });
}

async function apiErrorFor(responder: Responder): Promise<ApiError> {
  const { fetch } = fakeFetch([responder]);
  const err = instance(
    await failure(
      new Allisall({ apiKey: "aia_k", fetch, maxRetries: 0 }).events.ingest([
        event(0),
      ]),
    ),
    IngestError,
  );
  return instance(err.cause, ApiError);
}

describe("problem documents", () => {
  it("drops a malformed errors entry and keeps the rest of the problem", async () => {
    const good = { code: "required", pointer: "/events", detail: "Required." };
    const api = await apiErrorFor(() =>
      problemResponse({
        type: "https://api.allisai.ai/errors/validation_failed",
        title: "The request is invalid",
        status: 400,
        detail: "One field is wrong.",
        code: "validation_failed",
        request_id: "req-7",
        errors: [{ code: 5, detail: "a bad entry" }, good],
      }),
    );
    expect(api.code).toBe("validation_failed");
    expect(api.problem?.detail).toBe("One field is wrong.");
    expect(api.requestId).toBe("req-7");
    expect(api.problem?.errors).toEqual([good]);
  });

  it("leaves out a member of the wrong type on its own", async () => {
    const api = await apiErrorFor(() =>
      problemResponse({
        status: "four hundred",
        title: 7,
        detail: "Kept.",
        code: "invalid_json",
        request_id: "req-8",
      }),
    );
    expect(api.problem).toEqual({
      detail: "Kept.",
      code: "invalid_json",
      request_id: "req-8",
    });
    expect(api.code).toBe("invalid_json");
  });

  it("uses X-Request-Id when the problem's request_id is empty", async () => {
    const api = await apiErrorFor(() =>
      problemResponse(
        { code: "invalid_json", detail: "d", request_id: "" },
        { "X-Request-Id": "from-header" },
      ),
    );
    expect(api.requestId).toBe("from-header");
  });

  it("prefers a non-empty request_id over X-Request-Id", async () => {
    const api = await apiErrorFor(() =>
      problemResponse(
        { code: "invalid_json", detail: "d", request_id: "from-problem" },
        { "X-Request-Id": "from-header" },
      ),
    );
    expect(api.requestId).toBe("from-problem");
  });
});

describe("a row error whose index is outside its batch", () => {
  it.each([2, -1, 0.5])(
    "refuses index %d in a batch of 2 as an ApiError with the 2xx status",
    async (index) => {
      const { fetch, calls } = fakeFetch([
        () =>
          json(200, {
            accepted: 1,
            duplicates: 0,
            rejected: 1,
            errors: [
              { index, code: "required", pointer: "/events/0", detail: "d" },
            ],
            errors_truncated: false,
          }),
      ]);
      const err = instance(
        await failure(
          new Allisall({ apiKey: "aia_k", fetch }).events.ingest([
            event(0),
            event(1),
          ]),
        ),
        IngestError,
      );
      const api = instance(err.cause, ApiError);
      expect(api.status).toBe(200);
      expect(api.problem).toBeUndefined();
      expect(calls).toHaveLength(1);
      expect(err.remainingFrom).toBe(0);
    },
  );

  it("accepts the last index in the batch", async () => {
    const { fetch } = fakeFetch([
      () =>
        json(200, {
          accepted: 1,
          duplicates: 0,
          rejected: 1,
          errors: [
            { index: 1, code: "required", pointer: "/events/1", detail: "d" },
          ],
          errors_truncated: false,
        }),
    ]);
    const summary = await new Allisall({
      apiKey: "aia_k",
      fetch,
    }).events.ingest([event(0), event(1)]);
    expect(summary.errors).toMatchObject([{ index: 1 }]);
  });
});
