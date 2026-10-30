import { afterEach, describe, expect, it, vi } from "vitest";
import { Allisall, AllisallError, IngestError } from "../src/index.js";
import { VERSION } from "../src/version.js";
import { event, fakeFetch, instance, UUID_V4 } from "./helpers.js";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function noEnv(): void {
  vi.stubEnv("AIA_API_KEY", "");
  vi.stubEnv("AIA_BASE_URL", "");
}

async function firstRequest(
  options: ConstructorParameters<typeof Allisall>[0] = {},
): Promise<{ url: string; headers: Record<string, string> }> {
  const { fetch, calls } = fakeFetch();
  await new Allisall({ ...options, fetch }).events.ingest([event(0)]);
  const call = calls[0];
  if (call === undefined) throw new Error("no request was sent");
  return call;
}

describe("the credential", () => {
  it("prefers the apiKey option over AIA_API_KEY", async () => {
    vi.stubEnv("AIA_API_KEY", "aia_from_env");
    const req = await firstRequest({ apiKey: "aia_from_option" });
    expect(req.headers.authorization).toBe("Bearer aia_from_option");
  });

  it("falls back on AIA_API_KEY", async () => {
    vi.stubEnv("AIA_API_KEY", "aia_from_env");
    const req = await firstRequest();
    expect(req.headers.authorization).toBe("Bearer aia_from_env");
  });

  it("refuses both an API key and a token provider", () => {
    expect(
      () => new Allisall({ apiKey: "aia_k", tokenProvider: () => "aia_t" }),
    ).toThrow(AllisallError);
  });

  it("refuses construction with no credential, and an empty AIA_API_KEY counts as none", () => {
    noEnv();
    expect(() => new Allisall()).toThrow(AllisallError);
    expect(() => new Allisall({ apiKey: "" })).toThrow(AllisallError);
  });
});

describe("the base URL", () => {
  it("defaults to https://api.allisai.ai", async () => {
    noEnv();
    const req = await firstRequest({ apiKey: "aia_k" });
    expect(req.url).toBe("https://api.allisai.ai/v1/events");
  });

  it("falls back on AIA_BASE_URL, and the option wins over it", async () => {
    vi.stubEnv("AIA_BASE_URL", "http://localhost:8081");
    expect((await firstRequest({ apiKey: "aia_k" })).url).toBe(
      "http://localhost:8081/v1/events",
    );
    expect(
      (
        await firstRequest({
          apiKey: "aia_k",
          baseURL: "https://example.test",
        })
      ).url,
    ).toBe("https://example.test/v1/events");
  });

  it.each([
    ["https://example.test/api", "https://example.test/api/v1/events"],
    ["https://example.test/api/", "https://example.test/api/v1/events"],
    ["https://example.test/", "https://example.test/v1/events"],
  ])("joins %s and the path with exactly one /", async (baseURL, url) => {
    expect((await firstRequest({ apiKey: "aia_k", baseURL })).url).toBe(url);
  });

  it.each(["/api", "api.allisai.ai", "ftp://example.test"])(
    "refuses %j",
    (baseURL) => {
      expect(() => new Allisall({ apiKey: "aia_k", baseURL })).toThrow(
        AllisallError,
      );
    },
  );
});

describe("the other options", () => {
  it.each([-1, 1.5, Number.NaN])("refuses maxRetries %d", (maxRetries) => {
    expect(() => new Allisall({ apiKey: "aia_k", maxRetries })).toThrow(
      AllisallError,
    );
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    "refuses timeout %d",
    (timeout) => {
      expect(() => new Allisall({ apiKey: "aia_k", timeout })).toThrow(
        AllisallError,
      );
    },
  );
});

describe("headers", () => {
  it("sends Content-Type without charset and a User-Agent outside a browser", async () => {
    const req = await firstRequest({ apiKey: "aia_k" });
    expect(req.headers["content-type"]).toBe("application/json");
    expect(req.headers["user-agent"]).toBe(
      `allisall-ts/${VERSION} node/${process.versions.node}`,
    );
  });
});

describe("browser use", () => {
  it("refuses an API key under a fake document without the opt-in", () => {
    vi.stubGlobal("document", {});
    const err = instance(
      (() => {
        try {
          new Allisall({ apiKey: "aia_k" });
        } catch (e) {
          return e;
        }
      })(),
      AllisallError,
    );
    expect(err.message).toContain("readable by anyone who loads the page");
  });

  it("refuses an API key from AIA_API_KEY in a browser too", () => {
    vi.stubGlobal("document", {});
    vi.stubEnv("AIA_API_KEY", "aia_from_env");
    expect(() => new Allisall()).toThrow(AllisallError);
  });

  it("constructs with the opt-in, and sends no User-Agent", async () => {
    vi.stubGlobal("document", {});
    const req = await firstRequest({
      apiKey: "aia_k",
      dangerouslyAllowBrowser: true,
    });
    expect(req.headers.authorization).toBe("Bearer aia_k");
    expect(req.headers["user-agent"]).toBeUndefined();
  });

  it("accepts a token provider without the opt-in, and sends its session token", async () => {
    vi.stubGlobal("document", {});
    const req = await firstRequest({ tokenProvider: () => "eyJ.session.jwt" });
    expect(req.headers.authorization).toBe("Bearer eyJ.session.jwt");
  });

  it("refuses a provider's token that is an API key, before sending it", async () => {
    vi.stubGlobal("document", {});
    const { fetch, calls } = fakeFetch();
    const err = await new Allisall({
      tokenProvider: async () => "aia_k",
      fetch,
    }).events
      .ingest([event(0)])
      .then(
        () => undefined,
        (e: unknown) => e,
      );
    expect(err).toBeInstanceOf(AllisallError);
    expect(calls).toHaveLength(0);
  });

  it("wraps the refusal of a provider's API key in an IngestError, keeping remaining", async () => {
    vi.stubGlobal("document", {});
    const { fetch, calls } = fakeFetch();
    const err = instance(
      await new Allisall({ tokenProvider: async () => "aia_k", fetch }).events
        .ingest([event(0), event(1, { event_id: "caller-1" })])
        .then(
          () => undefined,
          (e: unknown) => e,
        ),
      IngestError,
    );
    const cause = instance(err.cause, AllisallError);
    expect(cause).not.toBeInstanceOf(IngestError);
    expect(cause.message).toContain("readable by anyone who loads the page");
    expect(calls).toHaveLength(0);
    expect(err.summary).toMatchObject({ accepted: 0, batches: 0 });
    expect(err.remainingFrom).toBe(0);
    expect(err.remaining[0]?.event_id).toMatch(UUID_V4);
    expect(err.remaining[1]?.event_id).toBe("caller-1");
  });

  it("treats a Web Worker as a browser", () => {
    // Without the global scope class, Node is a server.
    expect(() => new Allisall({ apiKey: "aia_k" })).not.toThrow();
    class WorkerGlobalScope {}
    vi.stubGlobal("WorkerGlobalScope", WorkerGlobalScope);
    // Defined but not the global's class, as in a window: still a server here.
    expect(() => new Allisall({ apiKey: "aia_k" })).not.toThrow();
    const original: object | null = Object.getPrototypeOf(globalThis);
    Object.setPrototypeOf(globalThis, WorkerGlobalScope.prototype);
    try {
      expect(() => new Allisall({ apiKey: "aia_k" })).toThrow(AllisallError);
    } finally {
      Object.setPrototypeOf(globalThis, original);
    }
  });
});
