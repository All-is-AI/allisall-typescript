// Holds the generated core to the API's OpenAPI document: the committed
// files are what the generator writes, the operation table and its Money
// paths match a walk of the document, the open sets of values stay open,
// and the public type names are the document's schemas less the stated
// exceptions.

import { readFileSync } from "node:fs";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { parse, stringify } from "yaml";
import type { Decimal } from "../src/decimal.js";
import type { components, operations } from "../src/generated/openapi.js";
import {
  ITEMS,
  type JsonPath,
  OPERATIONS,
  type Operation,
} from "../src/generated/operations.js";
import type {
  Agent,
  ApiKey,
  Calculation,
  Client,
  ClientEventList,
  ClientStatus,
  CostLineItem,
  ErrorCode,
  EventCategory,
  EventInput,
  FieldError,
  FieldErrorCode,
  Health,
  IngestRowError,
  Onboarding,
  OnboardingSkippedStepsSet,
  OnboardingStepProgress,
  PeriodInput,
  Problem,
  ValueResult,
} from "../src/index.js";
import type { MoneyInput } from "../src/money.js";
import { PINNED_ECHO } from "../src/request.js";
import { isRecord, type Json, readSpecText, resolveRef } from "./spec-file.js";

type Schemas = components["schemas"];
type ListClientEventsQuery = NonNullable<
  operations["listClientEvents"]["parameters"]["query"]
>;

const specText = readSpecText();
const spec: Json = specText === null ? null : parse(specText);

const PACKAGE = new URL("../", import.meta.url);

// ---- The generator, loaded as the plain module it is ----

type Generate = (specText: string) => Promise<Record<string, string>>;

async function loadGenerator(): Promise<Generate> {
  // A computed specifier: the script is JavaScript with no declarations, so
  // its export is narrowed here rather than typed by the compiler.
  const href = new URL("scripts/generate.mjs", PACKAGE).href;
  const module: unknown = await import(href);
  const generate: unknown = isRecord(module) ? module.generate : undefined;
  if (typeof generate !== "function") {
    throw new Error("scripts/generate.mjs exports no generate function");
  }
  return async (text) => {
    const out: unknown = await Reflect.apply(generate, undefined, [text]);
    if (!isRecord(out)) throw new Error("generate returned no files");
    const files: Record<string, string> = {};
    for (const [file, content] of Object.entries(out)) {
      if (typeof content !== "string") throw new Error(`${file} is not text`);
      files[file] = content;
    }
    return files;
  };
}

function committed(file: string): string {
  return readFileSync(new URL(file, PACKAGE), "utf8");
}

/** The files that differ from the committed ones. */
function stale(files: Record<string, string>): string[] {
  return Object.entries(files)
    .filter(([file, content]) => committed(file) !== content)
    .map(([file]) => file)
    .sort();
}

function schemas(doc: Json): Record<string, Json> {
  const out = isRecord(doc) && isRecord(doc.components) ? doc.components : {};
  if (!isRecord(out.schemas)) throw new Error("no components.schemas");
  return out.schemas;
}

function member(doc: Json, schema: string, name: string): Record<string, Json> {
  const s = schemas(doc)[schema];
  const properties = isRecord(s) ? s.properties : undefined;
  const value = isRecord(properties) ? properties[name] : undefined;
  if (!isRecord(value)) throw new Error(`no ${schema}.${name}`);
  return value;
}

describe.skipIf(spec === null)("the committed generated files", () => {
  it("are what the generator writes from the document, byte for byte", async () => {
    const generate = await loadGenerator();
    const files = await generate(specText ?? "");
    expect(Object.keys(files).sort()).toEqual([
      "src/generated/openapi.ts",
      "src/generated/operations.ts",
    ]);
    expect(
      stale(files),
      "stale generated files; run node scripts/generate.mjs",
    ).toEqual([]);
  });

  it("go stale when one description in the document changes", async () => {
    // The check above must be able to fail: change one description and
    // regenerate.
    const mutated = structuredClone(spec);
    member(mutated, "Client", "name").description = "A changed description.";
    const generate = await loadGenerator();
    expect(stale(await generate(stringify(mutated)))).toEqual([
      "src/generated/openapi.ts",
    ]);
  });

  it("list the repeatable parameters the document marks x-repeatable, and follow a new mark", async () => {
    const marked = (doc: Json): Record<string, string[]> => {
      const out: Record<string, string[]> = {};
      for (const { id, op } of sdkOperations(doc)) {
        const params = Array.isArray(op.parameters) ? op.parameters : [];
        out[id] = params
          .map((p) => deref(doc, p))
          .filter(
            (p) =>
              isRecord(p) && p.in === "query" && p["x-repeatable"] === true,
          )
          .map((p) => (isRecord(p) ? String(p.name) : ""));
      }
      return out;
    };
    const table = Object.fromEntries(
      Object.entries(OPERATIONS).map(([id, op]) => [id, [...op.repeatable]]),
    );
    expect(table).toEqual(marked(spec));
    expect(
      Object.entries(table).filter(([, names]) => names.length > 0),
    ).toEqual([["listRenewals", ["renewal_term"]]]);

    // Marking another parameter makes the generated table list it.
    const mutated = structuredClone(spec);
    const paths = isRecord(mutated) ? mutated.paths : undefined;
    const clients = isRecord(paths) ? paths["/v1/clients"] : undefined;
    const list = isRecord(clients) ? clients.get : undefined;
    const params =
      isRecord(list) && Array.isArray(list.parameters) ? list.parameters : [];
    const status = params.find((p) => isRecord(p) && p.name === "status");
    if (!isRecord(status)) throw new Error("listClients has no inline status");
    status["x-repeatable"] = true;
    const generate = await loadGenerator();
    const operations = (await generate(stringify(mutated)))[
      "src/generated/operations.ts"
    ];
    const entry = operations?.slice(operations.indexOf("  listClients: {"));
    expect(entry?.slice(0, entry.indexOf("},"))).toContain(
      'repeatable: ["status"]',
    );
  });

  it("pin only a member that is both a query parameter and a member of the list's body", () => {
    expect(PINNED_ECHO).toEqual({ listRenewals: "today" });
    for (const [id, name] of Object.entries(PINNED_ECHO)) {
      const found = sdkOperations(spec).find((o) => o.id === id);
      if (found === undefined) throw new Error(`${id} is not in the document`);
      const params = Array.isArray(found.op.parameters)
        ? found.op.parameters
        : [];
      expect(
        params.some((p) => {
          const r = deref(spec, p);
          return isRecord(r) && r.in === "query" && r.name === name;
        }),
        `${id} takes ${name}`,
      ).toBe(true);
      const responses = isRecord(found.op.responses) ? found.op.responses : {};
      const ok = deref(spec, responses["200"] ?? null);
      const content = isRecord(ok) && isRecord(ok.content) ? ok.content : {};
      const json = content["application/json"];
      const body = deref(spec, isRecord(json) ? (json.schema ?? null) : null);
      const required =
        isRecord(body) && Array.isArray(body.required) ? body.required : [];
      expect(required, `${id}'s body echoes ${name}`).toContain(name);
    }
  });

  it("go stale when a Money member becomes a plain number", async () => {
    const mutated = structuredClone(spec);
    const total = member(mutated, "ValueResult", "total");
    for (const key of Object.keys(total)) delete total[key];
    total.type = "number";
    const generate = await loadGenerator();
    expect(stale(await generate(stringify(mutated)))).toEqual([
      "src/generated/openapi.ts",
      "src/generated/operations.ts",
    ]);
  });
});

describe.skipIf(spec === null)("members with a default", () => {
  it("are only ImportMapping's two, which no response reaches", () => {
    const found: string[] = [];
    for (const [name, schema] of Object.entries(schemas(spec))) {
      const properties = isRecord(schema) ? schema.properties : undefined;
      if (!isRecord(properties)) continue;
      for (const [member, value] of Object.entries(properties)) {
        if (isRecord(value) && "default" in value)
          found.push(`${name}.${member}`);
      }
    }
    expect(found.sort()).toEqual([
      "ImportMapping.delimiter",
      "ImportMapping.timezone",
    ]);
  });

  it("refuse the document when a response member has one", async () => {
    // A response member with a default would be generated optional.
    const mutated = structuredClone(spec);
    member(mutated, "Client", "notes").default = "";
    const generate = await loadGenerator();
    await expect(generate(stringify(mutated))).rejects.toThrow(
      /a response member has a default.*#\/components\/schemas\/Client: notes/,
    );
  });

  it("refuse the document when a member reached through a reference and an array has one", async () => {
    // ValueModel.line_items holds ValueLineItem, so a getValueModel response reaches it.
    const mutated = structuredClone(spec);
    member(mutated, "ValueLineItem", "label").default = "Unnamed";
    const generate = await loadGenerator();
    await expect(generate(stringify(mutated))).rejects.toThrow(
      /#\/components\/schemas\/ValueLineItem: label/,
    );
  });
});

// ---- The operation table against the document ----

interface SpecOperation {
  id: string;
  method: string;
  path: string;
  op: Record<string, Json>;
}

/** The access policies whose operations no SDK exposes. */
const LEFT_OUT_POLICIES = new Set(["InviteToken", "InviteeSession"]);

/**
 * Every operation of the document's SDK tags that the SDK calls: all but
 * `Problem types`, no HEAD, and none under a policy no SDK exposes.
 */
function sdkOperations(doc: Json): SpecOperation[] {
  const paths = isRecord(doc) ? doc.paths : undefined;
  if (!isRecord(paths)) throw new Error("no paths");
  const out: SpecOperation[] = [];
  for (const [path, item] of Object.entries(paths)) {
    if (!isRecord(item)) continue;
    for (const [method, op] of Object.entries(item)) {
      if (!isRecord(op) || typeof op.operationId !== "string") continue;
      if (method === "head") continue;
      const tags = Array.isArray(op.tags) ? op.tags : [];
      if (tags.includes("Problem types")) continue;
      const access = isRecord(op["x-access"]) ? op["x-access"] : {};
      if (
        typeof access.policy === "string" &&
        LEFT_OUT_POLICIES.has(access.policy)
      ) {
        continue;
      }
      out.push({ id: op.operationId, method, path, op });
    }
  }
  return out;
}

function deref(doc: Json, value: Json): Json {
  return isRecord(value) && typeof value.$ref === "string"
    ? resolveRef(doc, value.$ref)
    : value;
}

/** Every Money path under a schema, written as text such as `data/[]/cost`. */
function walkMoney(
  doc: Json,
  schema: Json,
  at: string,
  out: Set<string>,
): void {
  if (!isRecord(schema)) return;
  if (schema.$ref === "#/components/schemas/Money") {
    out.add(at);
    return;
  }
  if (typeof schema.$ref === "string") {
    walkMoney(doc, resolveRef(doc, schema.$ref), at, out);
    return;
  }
  for (const key of ["anyOf", "oneOf", "allOf"]) {
    const branches = schema[key];
    if (Array.isArray(branches)) {
      for (const b of branches) walkMoney(doc, b, at, out);
    }
  }
  if (schema.items !== undefined) {
    walkMoney(doc, schema.items, `${at}/[]`, out);
  }
  if (isRecord(schema.properties)) {
    for (const [name, value] of Object.entries(schema.properties)) {
      walkMoney(doc, value, `${at}/${name}`, out);
    }
  }
}

function requestMoney(doc: Json, op: Record<string, Json>): Set<string> {
  const out = new Set<string>();
  const body = deref(doc, op.requestBody);
  const content = isRecord(body) && isRecord(body.content) ? body.content : {};
  for (const [type, media] of Object.entries(content)) {
    if (type.endsWith("json") && isRecord(media)) {
      walkMoney(doc, media.schema, "", out);
    }
  }
  return out;
}

function responseMoney(doc: Json, op: Record<string, Json>): Set<string> {
  const out = new Set<string>();
  const responses = isRecord(op.responses) ? op.responses : {};
  for (const [status, value] of Object.entries(responses)) {
    if (!status.startsWith("2")) continue;
    const response = deref(doc, value);
    const content =
      isRecord(response) && isRecord(response.content) ? response.content : {};
    const media = content["application/json"];
    if (isRecord(media)) walkMoney(doc, media.schema, "", out);
  }
  return out;
}

/** A table path in the walk's text form. */
function asText(path: JsonPath): string {
  return path.map((s) => `/${s === ITEMS ? "[]" : s}`).join("");
}

function tablePaths(paths: readonly JsonPath[]): Set<string> {
  return new Set(paths.map(asText));
}

function entry(id: string): Operation {
  const op: Operation | undefined = Reflect.get(OPERATIONS, id);
  if (op === undefined) throw new Error(`${id} is not in the table`);
  return op;
}

function bodyKind(doc: Json, op: Record<string, Json>): Operation["body"] {
  const body = deref(doc, op.requestBody);
  const types =
    isRecord(body) && isRecord(body.content) ? Object.keys(body.content) : [];
  if (types.length === 0) return "none";
  if (types.includes("multipart/form-data")) return "multipart";
  if (types.includes("application/merge-patch+json")) return "merge-patch";
  return "json";
}

describe.skipIf(spec === null)(
  "the operation table against the document",
  () => {
    it("holds the 68 operations of the SDK tags, and no other", () => {
      const ids = sdkOperations(spec).map((o) => o.id);
      expect(ids).toHaveLength(68);
      expect(Object.keys(OPERATIONS).sort()).toEqual([...ids].sort());
      expect(ids).toEqual(
        expect.arrayContaining([
          "getWorkspace",
          "getOnboarding",
          "setOnboardingSkippedSteps",
          "listCalculations",
          "listReports",
          "listImports",
          "getImport",
          "listEvents",
          "getEventSummary",
          "listEventArrivals",
        ]),
      );
      // The three operations under InviteToken and InviteeSession are left
      // out.
      expect(Object.keys(OPERATIONS)).not.toContain("redeemInvite");
      expect(Object.keys(OPERATIONS)).not.toContain("createWorkspace");
      expect(Object.keys(OPERATIONS)).not.toContain("getInvite");
    });

    it("names exactly the policies it calls and the two it leaves out", async () => {
      const href = new URL("scripts/generate.mjs", PACKAGE).href;
      const module: unknown = await import(href);
      if (!isRecord(module)) throw new Error("the generator is not a module");
      expect(module.SDK_POLICIES).toEqual([
        "KeyOnly",
        "KeyOrSession",
        "SessionOnly",
        "Public",
        "ShareToken",
      ]);
      expect(module.EXCLUDED_POLICIES).toEqual([
        "InviteToken",
        "InviteeSession",
      ]);
    });

    it("refuses an operation under an access policy the script does not know, naming both", async () => {
      // A new policy is decided before the SDK exposes or drops it: skipping
      // the operation would fail this test as surely as taking it in.
      const mutated = structuredClone(spec);
      const paths = isRecord(mutated) ? mutated.paths : undefined;
      const item = isRecord(paths) ? paths["/v1/agents"] : undefined;
      const get = isRecord(item) ? item.get : undefined;
      if (!isRecord(paths) || !isRecord(get)) throw new Error("no listAgents");
      paths["/v1/widgets"] = {
        get: {
          ...structuredClone(get),
          operationId: "listWidgets",
          "x-access": { policy: "PartnerToken" },
        },
      };
      const generate = await loadGenerator();
      await expect(generate(stringify(mutated))).rejects.toThrow(
        /listWidgets has the x-access policy PartnerToken/,
      );
    });

    it("states each operation's method, path, access, idempotency, list kind, body and status", () => {
      for (const { id, method, path, op } of sdkOperations(spec)) {
        const access = isRecord(op["x-access"]) ? op["x-access"] : {};
        const responses = isRecord(op.responses) ? op.responses : {};
        const success = Object.keys(responses).filter((s) => s.startsWith("2"));
        expect(entry(id), id).toMatchObject({
          method: method.toUpperCase(),
          path,
          access: access.policy,
          scope: access.scope ?? null,
          idempotent: op["x-idempotent"],
          list: op["x-list"] ?? null,
          body: bodyKind(spec, op),
          status: Number(success[0]),
        });
        expect(success, id).toHaveLength(1);
      }
    });

    it("lists every Money path of each request and response, 195 and 6 in all", () => {
      let requests = 0;
      let responses = 0;
      let withResponseMoney = 0;
      for (const { id, op } of sdkOperations(spec)) {
        const walkedRequest = requestMoney(spec, op);
        const walkedResponse = responseMoney(spec, op);
        expect(tablePaths(entry(id).requestMoney), `${id} request`).toEqual(
          walkedRequest,
        );
        expect(tablePaths(entry(id).responseMoney), `${id} response`).toEqual(
          walkedResponse,
        );
        requests += walkedRequest.size;
        responses += walkedResponse.size;
        if (walkedResponse.size > 0) withResponseMoney++;
      }
      expect({ requests, responses, withResponseMoney }).toEqual({
        requests: 6,
        responses: 195,
        withResponseMoney: 31,
      });
    });

    it("disagrees with a document in which a Money member became a plain number", () => {
      // The comparison above must be able to fail.
      const mutated = structuredClone(spec);
      const total = member(mutated, "ValueResult", "total");
      for (const key of Object.keys(total)) delete total[key];
      total.type = "number";
      const op = sdkOperations(mutated).find((o) => o.id === "getClientValue");
      if (op === undefined) throw new Error("no getClientValue");
      expect(responseMoney(mutated, op.op)).not.toEqual(
        tablePaths(entry("getClientValue").responseMoney),
      );
    });

    it("names a member's path, not its name: total is money in one body and a count in another", () => {
      expect(entry("getClientValue").responseMoney).toContainEqual(["total"]);
      expect(entry("listClientEvents").responseMoney).toEqual([
        ["data", ITEMS, "cost"],
      ]);
    });
  },
);

// ---- Open sets of values ----

/** Every anyOf of a closed set and a bare string in the document. */
function countOpenSites(doc: Json): number {
  const closed = (s: Json): boolean => {
    const r = deref(doc, s);
    if (!isRecord(r)) return false;
    if (Array.isArray(r.enum)) return true;
    return (
      Array.isArray(r.oneOf) &&
      r.oneOf.every((b) => isRecord(b) && b.const !== undefined)
    );
  };
  const bare = (s: Json): boolean =>
    isRecord(s) &&
    s.type === "string" &&
    s.enum === undefined &&
    s.const === undefined;
  let count = 0;
  const visit = (node: Json): void => {
    if (Array.isArray(node)) {
      for (const n of node) visit(n);
      return;
    }
    if (!isRecord(node)) return;
    const branches = node.anyOf;
    if (Array.isArray(branches) && branches.length === 2) {
      const [a, b] = branches;
      if ((closed(a) && bare(b)) || (closed(b) && bare(a))) count++;
    }
    for (const value of Object.values(node)) visit(value);
  };
  visit(doc);
  return count;
}

describe.skipIf(spec === null)("the open sets of values", () => {
  it("are 35 in the document, the seven error-code sites among them, and each is generated open", () => {
    expect(countOpenSites(spec)).toBe(35);
    const generated = committed("src/generated/openapi.ts");
    expect(generated.match(/\| \(string & \{\}\)/g)).toHaveLength(35);
    // The guided setup's two: a step's step, and the current step.
    const onboardingSites = generated.match(
      /\["OnboardingStep"\] \| \(string & \{\}\)/g,
    );
    expect(onboardingSites).toHaveLength(2);
    const codeSites = generated.match(
      /\["(?:Field)?ErrorCode"\] \| \(string & \{\}\)/g,
    );
    expect(codeSites).toHaveLength(7);
  });
});

// Each open site accepts an unlisted value, and keeps its listed ones.
const unlisted = "a_value_added_later";
const openClient: Client["status"] = unlisted;
const openAgent: Agent["status"] = unlisted;
const openCalculation: Calculation["state"] = unlisted;
const openScope: ApiKey["scopes"][number] = unlisted;
const openHealth: Health["status"] = unlisted;
const openProblemCode: Schemas["Problem"]["code"] = unlisted;
const openRowCode: Schemas["IngestRowError"]["code"] = unlisted;
const openStep: OnboardingStepProgress["step"] = unlisted;
const openCurrentStep: Onboarding["current_step"] = unlisted;
void [
  openStep,
  openCurrentStep,
  openClient,
  openAgent,
  openCalculation,
  openScope,
  openHealth,
  openProblemCode,
  openRowCode,
];
// @ts-expect-error The enum itself stays closed: only a site that reads it is open.
const closedStatus: ClientStatus = unlisted;
void closedStatus;
// @ts-expect-error A request names only the listed steps.
const closedSkip: OnboardingSkippedStepsSet["steps"][number] = unlisted;
void closedSkip;

// ---- The transform hook's three changes, at compile time ----

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
function assertType<T extends true>(): T | undefined {
  return undefined;
}

assertType<Equal<Schemas["Money"], Decimal>>();
assertType<Equal<CostLineItem["monthly_amount"], Decimal>>();
assertType<Equal<ValueResult["total"], Decimal | null>>();
assertType<Equal<ClientEventList["total"], number>>();
assertType<Equal<Schemas["InstantInput"], string | Date>>();
assertType<Equal<PeriodInput["from"], string | Date>>();
assertType<Equal<Schemas["DateInput"], string>>();
assertType<Equal<Schemas["Instant"], string>>();
assertType<Equal<ListClientEventsQuery["from"], string | Date>>();
assertType<Equal<Closed<Client["status"]>, ClientStatus>>();
// A request member with a default is optional: the API applies the default.
assertType<Equal<Schemas["ImportMapping"]["timezone"], string | undefined>>();
assertType<
  Equal<Schemas["ImportMapping"]["delimiter"], "," | ";" | "\t" | undefined>
>();
const defaultsLeftOut: Schemas["ImportMapping"] = {};
void defaultsLeftOut;

// ---- The seven kept names against the generated types ----

// The code lists are the catalogues, and the open types read the same.
type Closed<T> = T extends string ? (string extends T ? never : T) : never;
assertType<Equal<Closed<ErrorCode>, Schemas["ErrorCode"]>>();
assertType<Equal<Closed<FieldErrorCode>, Schemas["FieldErrorCode"]>>();
assertType<Equal<ErrorCode, Schemas["Problem"]["code"]>>();
assertType<Equal<FieldErrorCode, Schemas["IngestRowError"]["code"]>>();
assertType<Equal<EventCategory, Schemas["EventCategory"]>>();
// EventInput is the generated one with its money widened.
assertType<Equal<EventInput, MoneyInput<Schemas["EventInput"]>>>();
assertType<Equal<IngestRowError, Schemas["IngestRowError"]>>();
// Problem and FieldError stay lenient: whatever the API sends fits them.
assertType<Schemas["Problem"] extends Problem ? true : false>();
assertType<Schemas["FieldError"] extends FieldError ? true : false>();

// ---- The public type names ----

const SCALARS = [
  "Uuid",
  "UuidInput",
  "Instant",
  "InstantInput",
  "Date",
  "DateInput",
  "Month",
  "Currency",
  "SearchText",
  "MinorUnits",
  "Money",
  "Ratio",
];
const KEPT = [
  "ErrorCode",
  "FieldErrorCode",
  "EventCategory",
  "EventInput",
  "FieldError",
  "Problem",
  "IngestRowError",
];
const INTERNAL = ["EventBatch", "IngestResult"];
/** Reached only by operations no SDK exposes, so never exported. */
const NOT_EXPOSED = ["InviteRedemption", "WorkspaceCreate", "OpenInvite"];
/** Exported under the schema's name, but the SDK's own shape, never the schema's alias. */
const OWN = ["ImportUpload"];

interface PublicNames {
  exports: Set<string>;
  /** The type each alias in src/types.ts reads, by name. */
  aliases: Map<string, string>;
  /** The file declaring each exported name, relative to src. */
  declaredIn: Map<string, string>;
}

/** The names src/index.ts exports, the type each alias in src/types.ts reads, and where each is declared. */
function publicNames(): PublicNames {
  const index = new URL("src/index.ts", PACKAGE).pathname;
  const program = ts.createProgram([index], {
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    target: ts.ScriptTarget.ES2022,
    strict: true,
    noEmit: true,
  });
  const checker = program.getTypeChecker();
  const source = program.getSourceFile(index);
  const symbol = source && checker.getSymbolAtLocation(source);
  if (symbol === undefined)
    throw new Error("src/index.ts has no module symbol");
  const exported = checker.getExportsOfModule(symbol);
  const exports = new Set(exported.map((s) => s.getName()));
  const srcDir = new URL("src/", PACKAGE).pathname;
  const declaredIn = new Map<string, string>();
  for (const s of exported) {
    const target =
      s.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(s) : s;
    const file = target.declarations?.[0]?.getSourceFile().fileName ?? "";
    declaredIn.set(s.getName(), file.replace(srcDir, ""));
  }
  const aliases = new Map<string, string>();
  const types = program.getSourceFile(
    new URL("src/types.ts", PACKAGE).pathname,
  );
  if (types === undefined)
    throw new Error("src/types.ts is not in the program");
  for (const statement of types.statements) {
    if (ts.isTypeAliasDeclaration(statement)) {
      aliases.set(statement.name.text, statement.type.getText(types));
    }
  }
  return { exports, aliases, declaredIn };
}

describe.skipIf(spec === null)("the public type names", () => {
  it("are every schema less the scalars, the internal three and the three no SDK exposes, each an alias of its own schema but the kept seven and ImportUpload", () => {
    const all = Object.keys(schemas(spec));
    expect(all).toHaveLength(145);
    const excluded = new Set([...SCALARS, ...INTERNAL, ...OWN, ...NOT_EXPOSED]);
    const aliased = all.filter((n) => !excluded.has(n) && !KEPT.includes(n));
    expect(aliased).toHaveLength(120);
    expect(aliased).toEqual(
      expect.arrayContaining([
        "Workspace",
        "Onboarding",
        "OnboardingStepProgress",
        "OnboardingStep",
        "OnboardingSkippedStepsSet",
      ]),
    );

    const { exports, aliases, declaredIn } = publicNames();
    const exportedSchemas = all.filter((n) => exports.has(n)).sort();
    expect(exportedSchemas).toEqual([...aliased, ...KEPT, ...OWN].sort());
    for (const name of aliased) {
      expect(aliases.get(name), name).toBe(`Schemas["${name}"]`);
    }
    for (const name of NOT_EXPOSED) {
      expect(exports.has(name), name).toBe(false);
      expect(aliases.has(name), name).toBe(false);
    }
    for (const name of KEPT) {
      expect(aliases.get(name) ?? "", name).not.toMatch(/^Schemas\[/);
    }
    // The import methods' own input, whose file is a Blob, a Uint8Array or
    // a string; the spec's ImportUpload, whose file is a string, is never
    // aliased.
    for (const name of OWN) {
      expect(aliases.has(name), name).toBe(false);
      expect(declaredIn.get(name), name).toBe("multipart.ts");
    }
  });
});

/** Each operation's query parameters, read from the document's paths. */
function queriesOf(doc: Json): Map<string, string[]> {
  const out = new Map<string, string[]>();
  const paths = isRecord(doc) && isRecord(doc.paths) ? doc.paths : {};
  for (const item of Object.values(paths)) {
    if (!isRecord(item)) continue;
    const shared = Array.isArray(item.parameters) ? item.parameters : [];
    for (const operation of Object.values(item)) {
      if (!isRecord(operation)) continue;
      const id = operation.operationId;
      if (typeof id !== "string") continue;
      const own = Array.isArray(operation.parameters)
        ? operation.parameters
        : [];
      const names: string[] = [];
      for (const raw of [...shared, ...own]) {
        const p =
          isRecord(raw) && typeof raw.$ref === "string"
            ? resolveRef(doc, raw.$ref)
            : raw;
        if (isRecord(p) && p.in === "query" && typeof p.name === "string") {
          names.push(p.name);
        }
      }
      if (names.length > 0) out.set(id, names);
    }
  }
  return out;
}

/** The public name of an operation's query: its operationId in PascalCase, then Query. */
function queryName(operationId: string): string {
  return `${operationId.charAt(0).toUpperCase()}${operationId.slice(1)}Query`;
}

describe.skipIf(spec === null)("the query types", () => {
  it("are one per operation the SDK calls that takes a query, each the generated query", () => {
    const withQuery = [...queriesOf(spec).keys()].filter((id) =>
      Object.hasOwn(OPERATIONS, id),
    );
    expect(withQuery).toHaveLength(24);
    const { exports, aliases } = publicNames();
    const exportedQueries = [...exports]
      .filter((n) => n.endsWith("Query"))
      .sort();
    expect(exportedQueries).toEqual(withQuery.map(queryName).sort());
    for (const id of withQuery) {
      expect(aliases.get(queryName(id)), id).toBe(`QueryOf<"${id}">`);
    }
  });
});

describe.skipIf(spec === null)("the public names that are not schemas", () => {
  it("are exactly the SDK's own, with Page and PagePromise as types only", async () => {
    const { exports } = publicNames();
    const schemaNames = new Set(Object.keys(schemas(spec)));
    const own = [...exports]
      .filter((n) => !schemaNames.has(n) && !n.endsWith("Query"))
      .sort();
    expect(own).toEqual(
      [
        "Allisall",
        "AllisallError",
        "ApiError",
        "ClientOptions",
        "ConnectionError",
        "Decimal",
        "FetchLike",
        "IdempotentRequestOptions",
        "IngestError",
        "IngestSummary",
        "MoneyInput",
        "Page",
        "PagePromise",
        "RequestOptions",
        "SharedReportOptions",
        "TokenProvider",
        "decimal",
        "getSharedReport",
        "toImportMapping",
      ].sort(),
    );
    // A type-only export has no value at run time, so it cannot be constructed.
    const runtime = await import("../src/index.js");
    expect(Object.keys(runtime).sort()).toEqual(
      [
        "Allisall",
        "AllisallError",
        "ApiError",
        "ConnectionError",
        "IngestError",
        "decimal",
        "getSharedReport",
        "toImportMapping",
      ].sort(),
    );
  });
});
