// Holds the hand-written wire types in src/types.ts to the API's OpenAPI
// document, until types generated from it replace them. The lists are
// compared at run time; the compile-time checks below tie each TypeScript
// type to its list, so neither can drift from the document alone.
//
// The spec exists only in the monorepo. Outside it, for example in the public
// mirror, the comparisons skip. Inside it, marked by pnpm-workspace.yaml at the
// repository root, a missing spec fails the file, so a moved spec cannot switch
// the check off in silence.

import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it, onTestFinished } from "vitest";
import { parse } from "yaml";
import type {
  ErrorCode,
  EventCategory,
  EventInput,
  FieldError,
  FieldErrorCode,
  IngestRowError,
  IngestSummary,
  Problem,
} from "../src/index.js";
import {
  ERROR_CODES,
  EVENT_CATEGORIES,
  EVENT_INPUT_MEMBERS,
  FIELD_ERROR_CODES,
  type IngestResult,
} from "../src/types.js";

const SPEC_PATH = new URL("../../openapi/openapi.yaml", import.meta.url);
const MONOREPO_MARKER = new URL(
  "../../../pnpm-workspace.yaml",
  import.meta.url,
);

/** The spec's path, or null outside the monorepo. Inside it, a missing spec throws. */
function findSpec(spec: URL, marker: URL): URL | null {
  if (existsSync(spec)) return spec;
  if (existsSync(marker)) {
    throw new Error(
      `${spec.pathname} is missing, but ${marker.pathname} marks this as the monorepo, where it must exist`,
    );
  }
  return null;
}

type Json = unknown;

function isRecord(value: Json): value is Record<string, Json> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function at(value: Json, ...path: string[]): Json {
  let current = value;
  for (const key of path) {
    if (!isRecord(current)) throw new Error(`no ${path.join(".")} in the spec`);
    current = current[key];
  }
  return current;
}

function schemas(spec: Json): Record<string, Json> {
  const out = at(spec, "components", "schemas");
  if (!isRecord(out)) throw new Error("no components.schemas in the spec");
  return out;
}

function strings(value: Json): string[] {
  if (!Array.isArray(value)) throw new Error("expected an array");
  return value.map((v) => {
    if (typeof v !== "string")
      throw new Error(`expected a string, got ${String(v)}`);
    return v;
  });
}

/** The `const` value of every `oneOf` branch of a catalogue schema. */
function catalogue(spec: Json, name: string): string[] {
  const branches = at(schemas(spec), name, "oneOf");
  if (!Array.isArray(branches)) throw new Error(`${name} is not a oneOf`);
  return strings(branches.map((b) => at(b, "const")));
}

function members(spec: Json, name: string): string[] {
  const properties = at(schemas(spec), name, "properties");
  if (!isRecord(properties)) throw new Error(`${name} has no properties`);
  return Object.keys(properties);
}

function required(spec: Json, name: string): string[] {
  return strings(at(schemas(spec), name, "required"));
}

const sorted = (values: readonly string[]): string[] => [...values].sort();

describe("finding the spec", () => {
  const dir = (): URL => {
    const path = mkdtempSync(join(tmpdir(), "allisall-spec-"));
    onTestFinished(() => rmSync(path, { recursive: true, force: true }));
    return pathToFileURL(`${path}/`);
  };

  it("reads the spec when present", () => {
    const root = dir();
    const spec = new URL("openapi.yaml", root);
    writeFileSync(spec, "openapi: 3.1.0\n");
    expect(findSpec(spec, new URL("pnpm-workspace.yaml", root))).toEqual(spec);
  });

  it("skips outside the monorepo", () => {
    const root = dir();
    expect(
      findSpec(
        new URL("openapi.yaml", root),
        new URL("pnpm-workspace.yaml", root),
      ),
    ).toBeNull();
  });

  it("fails inside the monorepo when the spec is missing", () => {
    const root = dir();
    const marker = new URL("pnpm-workspace.yaml", root);
    writeFileSync(marker, "packages: []\n");
    expect(() => findSpec(new URL("openapi.yaml", root), marker)).toThrow(
      /monorepo/,
    );
  });
});

const specPath = findSpec(SPEC_PATH, MONOREPO_MARKER);
const spec: Json =
  specPath === null ? null : parse(readFileSync(specPath, "utf8"));

// Skipped outside the monorepo, where the spec is absent.
describe.skipIf(specPath === null)(
  "the hand-written types against the spec",
  () => {
    it("lists every ErrorCode and no other", () => {
      expect(sorted(ERROR_CODES)).toEqual(sorted(catalogue(spec, "ErrorCode")));
    });

    it("lists every FieldErrorCode and no other", () => {
      expect(sorted(FIELD_ERROR_CODES)).toEqual(
        sorted(catalogue(spec, "FieldErrorCode")),
      );
    });

    it("fails when the spec loses a code", () => {
      // The comparison above must be able to fail: drop one const and recheck.
      const mutated: Json = structuredClone(spec);
      const branches = at(schemas(mutated), "ErrorCode", "oneOf");
      if (!Array.isArray(branches)) throw new Error("ErrorCode is not a oneOf");
      branches.splice(branches.length - 1, 1);
      expect(sorted(ERROR_CODES)).not.toEqual(
        sorted(catalogue(mutated, "ErrorCode")),
      );
    });

    it("lists every EventCategory value", () => {
      expect(sorted(EVENT_CATEGORIES)).toEqual(
        sorted(strings(at(schemas(spec), "EventCategory", "enum"))),
      );
    });

    it("names every EventInput member, and requires the ones the spec requires", () => {
      expect(sorted(EVENT_INPUT_MEMBERS)).toEqual(
        sorted(members(spec, "EventInput")),
      );
      expect(sorted(required(spec, "EventInput"))).toEqual(
        sorted(REQUIRED_EVENT_INPUT_MEMBERS),
      );
    });

    it("names every IngestResult and IngestRowError member", () => {
      expect(sorted(INGEST_RESULT_MEMBERS)).toEqual(
        sorted(members(spec, "IngestResult")),
      );
      expect(sorted(INGEST_ROW_ERROR_MEMBERS)).toEqual(
        sorted(members(spec, "IngestRowError")),
      );
    });

    it("names every Problem member", () => {
      expect(sorted(PROBLEM_MEMBERS)).toEqual(sorted(members(spec, "Problem")));
    });

    it("finds the codes open in the spec, as the SDK's types are", () => {
      // Each place a code appears is anyOf [the catalogue, any string].
      const open = (schema: Json, catalogueName: string): void => {
        expect(at(schema, "anyOf")).toEqual([
          { $ref: `#/components/schemas/${catalogueName}` },
          { type: "string" },
        ]);
      };
      open(at(schemas(spec), "Problem", "properties", "code"), "ErrorCode");
      open(
        at(schemas(spec), "IngestRowError", "properties", "code"),
        "FieldErrorCode",
      );
      const variants = at(schemas(spec), "FieldError", "oneOf");
      if (!Array.isArray(variants))
        throw new Error("FieldError is not a oneOf");
      for (const v of variants)
        open(at(v, "properties", "code"), "FieldErrorCode");
    });
  },
);

// ---- Compile-time ties between each type and the lists above ----

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
function assertType<T extends true>(): T | undefined {
  return undefined;
}

type RequiredKeys<T> = {
  [K in keyof T]-?: Record<string, never> extends Pick<T, K> ? never : K;
}[keyof T];

const REQUIRED_EVENT_INPUT_MEMBERS = [
  "timestamp",
  "agent_key",
  "category",
  "event_type",
] as const;
const INGEST_RESULT_MEMBERS = [
  "accepted",
  "duplicates",
  "rejected",
  "errors",
  "errors_truncated",
] as const;
const INGEST_ROW_ERROR_MEMBERS = [
  "index",
  "code",
  "pointer",
  "detail",
] as const;
const PROBLEM_MEMBERS = [
  "type",
  "title",
  "status",
  "detail",
  "code",
  "request_id",
  "errors",
] as const;

assertType<Equal<keyof EventInput, (typeof EVENT_INPUT_MEMBERS)[number]>>();
assertType<
  Equal<RequiredKeys<EventInput>, (typeof REQUIRED_EVENT_INPUT_MEMBERS)[number]>
>();
assertType<Equal<keyof IngestResult, (typeof INGEST_RESULT_MEMBERS)[number]>>();
assertType<
  Equal<keyof IngestSummary, (typeof INGEST_RESULT_MEMBERS)[number] | "batches">
>();
assertType<
  Equal<keyof IngestRowError, (typeof INGEST_ROW_ERROR_MEMBERS)[number]>
>();
assertType<Equal<keyof Problem, (typeof PROBLEM_MEMBERS)[number]>>();
assertType<Equal<EventCategory, (typeof EVENT_CATEGORIES)[number]>>();

// Every catalogued code is a code, and so is any other string: the types are open.
const known: ErrorCode = "rate_limited";
const unknownCode: ErrorCode = "a_code_added_later";
const knownField: FieldErrorCode = "too_large";
const unknownField: FieldErrorCode = "a_field_code_added_later";
const fieldError: FieldError["code"] = unknownField;
const rowError: IngestRowError["code"] = unknownField;
const problemCode: Problem["code"] = unknownCode;
void [known, knownField, fieldError, rowError, problemCode];
// The known codes come from the lists, so a code the lists lack is not in the union.
assertType<Equal<Extract<ErrorCode, "rate_limited">, "rate_limited">>();
assertType<
  Equal<(typeof ERROR_CODES)[number] extends ErrorCode ? true : false, true>
>();
assertType<
  Equal<
    (typeof FIELD_ERROR_CODES)[number] extends FieldErrorCode ? true : false,
    true
  >
>();
