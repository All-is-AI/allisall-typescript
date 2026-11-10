// Generates the SDK's core from the API's OpenAPI document:
//
// - src/generated/openapi.ts, the wire types, written by openapi-typescript
//   with a transform hook that makes three changes: `Money` becomes the SDK's
//   `Decimal`; an open set of values, the `anyOf` of a closed set and a bare
//   string, becomes `Enum | (string & {})`; and `InstantInput` becomes
//   `string | Date`.
// - src/generated/operations.ts, the operation table: the per-operation facts
//   the types do not carry, with each operation's `Money` paths in its
//   request and in its responses.
//
// Usage, from the package directory:
//   node scripts/generate.mjs             writes both files
//   node scripts/generate.mjs --check     exits 1 when either file is stale
//
// Both files are committed and reviewed as a diff at every regeneration.
// The document exists only in the monorepo, so this script runs there.

import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import openapiTS, { astToString } from "openapi-typescript";
import ts from "typescript";
import { parse } from "yaml";

const packageDir = join(dirname(fileURLToPath(import.meta.url)), "..");

/** The API's OpenAPI document, beside this package in the monorepo. */
export const SPEC_PATH = join(packageDir, "..", "openapi", "openapi.yaml");

/** The files this script writes, relative to the package directory. */
export const OUTPUTS = {
  openapi: "src/generated/openapi.ts",
  operations: "src/generated/operations.ts",
};

/** The path segment that stands for every item of an array. */
export const ITEMS = "*";

const MONEY_REF = "#/components/schemas/Money";

const HEADER = `// Generated from the API's OpenAPI document by scripts/generate.mjs.
// Never edit this file by hand: change the document or the script, and
// regenerate.
`;

/** Resolves a local `$ref`, such as `#/components/schemas/Money`. */
function resolveRef(spec, ref) {
  if (!ref.startsWith("#/")) throw new Error(`${ref} is not a local reference`);
  let node = spec;
  for (const raw of ref.slice(2).split("/")) {
    const key = raw.replaceAll("~1", "/").replaceAll("~0", "~");
    if (node === null || typeof node !== "object" || !(key in node)) {
      throw new Error(`${ref} does not resolve`);
    }
    node = node[key];
  }
  return node;
}

function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Whether a schema is a closed set of strings: an `enum`, or a `oneOf` of `const`s. */
function isClosedSet(spec, schema) {
  const resolved =
    typeof schema.$ref === "string" ? resolveRef(spec, schema.$ref) : schema;
  if (!isObject(resolved)) return false;
  if (Array.isArray(resolved.enum)) return true;
  return (
    Array.isArray(resolved.oneOf) &&
    resolved.oneOf.length > 0 &&
    resolved.oneOf.every((b) => isObject(b) && b.const !== undefined)
  );
}

/** Whether a schema is a bare string: any string, with no `enum` or `const`. */
function isBareString(schema) {
  return (
    isObject(schema) &&
    schema.type === "string" &&
    schema.enum === undefined &&
    schema.const === undefined &&
    schema.$ref === undefined
  );
}

/**
 * Every open set of values in the document: the bare-string branch of each
 * `anyOf` of exactly a closed set and a bare string. The transform hook
 * recognises a branch by identity, because openapi-typescript passes the
 * document's own schema objects to it.
 */
export function openSites(spec) {
  const sites = new Set();
  const visit = (node) => {
    if (Array.isArray(node)) {
      for (const item of node) visit(item);
      return;
    }
    if (!isObject(node)) return;
    const branches = node.anyOf;
    if (Array.isArray(branches) && branches.length === 2) {
      const [a, b] = branches;
      if (isObject(a) && isObject(b)) {
        if (isClosedSet(spec, a) && isBareString(b)) sites.add(b);
        else if (isClosedSet(spec, b) && isBareString(a)) sites.add(a);
      }
    }
    for (const value of Object.values(node)) visit(value);
  };
  visit(spec);
  return sites;
}

/**
 * Walks one schema and records, in `out`, the path of every `Money` value and
 * of every plain number. A path is a list of member names, with `ITEMS` for
 * every item of an array. `$ref`, `anyOf`, `oneOf` and `allOf` are followed;
 * the branches of a union share their parent's path.
 */
function walkSchema(spec, schema, path, out, stack) {
  if (!isObject(schema)) return;
  if (typeof schema.$ref === "string") {
    if (schema.$ref === MONEY_REF) {
      out.money.add(JSON.stringify(path));
      return;
    }
    if (stack.includes(schema.$ref)) return;
    walkSchema(spec, resolveRef(spec, schema.$ref), path, out, [
      ...stack,
      schema.$ref,
    ]);
    return;
  }
  const types = Array.isArray(schema.type) ? schema.type : [schema.type];
  if (types.includes("number") || types.includes("integer")) {
    out.numbers.add(JSON.stringify(path));
  }
  for (const key of ["anyOf", "oneOf", "allOf"]) {
    for (const branch of schema[key] ?? []) {
      walkSchema(spec, branch, path, out, stack);
    }
  }
  if (schema.items !== undefined) {
    walkSchema(spec, schema.items, [...path, ITEMS], out, stack);
  }
  for (const [name, member] of Object.entries(schema.properties ?? {})) {
    if (name === ITEMS) {
      throw new Error(
        `a member named ${JSON.stringify(ITEMS)} would be read as every item of an array`,
      );
    }
    walkSchema(spec, member, [...path, name], out, stack);
  }
  if (isObject(schema.additionalProperties)) {
    const inner = { money: new Set(), numbers: new Set() };
    walkSchema(spec, schema.additionalProperties, [], inner, stack);
    if (inner.money.size > 0) {
      throw new Error(
        `a Money value under a map, at ${JSON.stringify(path)}, cannot be named by a path`,
      );
    }
  }
}

/** The `Money` paths of a list of schemas, sorted, after checking none is also a plain number. */
function moneyPaths(spec, schemas, where) {
  const out = { money: new Set(), numbers: new Set() };
  for (const schema of schemas) walkSchema(spec, schema, [], out, []);
  for (const path of out.money) {
    if (out.numbers.has(path)) {
      throw new Error(
        `${where}: ${path} is Money in one branch and a plain number in another, so a path cannot tell them apart`,
      );
    }
  }
  return [...out.money].sort().map((p) => JSON.parse(p));
}

function deref(spec, value) {
  return isObject(value) && typeof value.$ref === "string"
    ? resolveRef(spec, value.$ref)
    : value;
}

const BODY_KINDS = [
  ["multipart/form-data", "multipart"],
  ["application/merge-patch+json", "merge-patch"],
  ["application/json", "json"],
];

/** The access policies of the operations the SDK calls. */
export const SDK_POLICIES = [
  "KeyOnly",
  "KeyOrSession",
  "SessionOnly",
  "Public",
  "ShareToken",
];

/**
 * The access policies the SDK leaves out: no credential a client holds can
 * call an operation under either. An invite token travels under its own
 * scheme, and an invitee's session is admitted only until its workspace
 * exists.
 */
export const EXCLUDED_POLICIES = ["InviteToken", "InviteeSession"];

/**
 * The operation table. It holds every operation the SDK can call: each one
 * with a `2xx` response, so not a `HEAD`, which the SDK never sends, and not
 * an operation answering only a redirect, which the SDK never follows; and
 * none under a policy in EXCLUDED_POLICIES. An operation under a policy in
 * neither list is refused, so a new policy is decided before the SDK
 * exposes or drops its operations.
 */
export function operationTable(spec) {
  const table = [];
  for (const [path, item] of Object.entries(spec.paths)) {
    for (const [method, operation] of Object.entries(item)) {
      if (!isObject(operation) || typeof operation.operationId !== "string") {
        continue;
      }
      const id = operation.operationId;
      if (method === "head") continue;
      const success = Object.keys(operation.responses ?? {}).filter((s) =>
        /^2\d\d$/.test(s),
      );
      if (success.length === 0) continue;
      if (success.length > 1) {
        throw new Error(`${id} has more than one 2xx response`);
      }
      const access = operation["x-access"];
      if (!isObject(access) || typeof access.policy !== "string") {
        throw new Error(`${id} has no x-access policy`);
      }
      if (EXCLUDED_POLICIES.includes(access.policy)) continue;
      if (!SDK_POLICIES.includes(access.policy)) {
        throw new Error(
          `${id} has the x-access policy ${access.policy}, which the SDK neither calls nor leaves out`,
        );
      }
      if (typeof operation["x-idempotent"] !== "boolean") {
        throw new Error(`${id} has no boolean x-idempotent`);
      }

      const requestBody = deref(spec, operation.requestBody);
      const content = isObject(requestBody) ? (requestBody.content ?? {}) : {};
      const types = Object.keys(content);
      let body = "none";
      if (types.length > 0) {
        const kind = BODY_KINDS.find(([type]) => types.includes(type));
        if (kind === undefined) {
          throw new Error(`${id} takes no body type the SDK sends`);
        }
        body = kind[1];
      }
      const requestSchemas =
        body === "json" || body === "merge-patch"
          ? types
              .filter((t) => t.endsWith("json"))
              .map((t) => content[t].schema)
          : [];

      const response = deref(spec, operation.responses[success[0]]);
      const responseSchema = response?.content?.["application/json"]?.schema;

      table.push({
        id,
        method: method.toUpperCase(),
        path,
        access: access.policy,
        scope: typeof access.scope === "string" ? access.scope : null,
        idempotent: operation["x-idempotent"],
        list:
          typeof operation["x-list"] === "string" ? operation["x-list"] : null,
        repeatable: (operation.parameters ?? [])
          .map((p) => deref(spec, p))
          .filter((p) => p.in === "query" && p["x-repeatable"] === true)
          .map((p) => p.name),
        body,
        status: Number(success[0]),
        requestMoney: moneyPaths(spec, requestSchemas, `${id} request`),
        responseMoney: moneyPaths(
          spec,
          responseSchema === undefined ? [] : [responseSchema],
          `${id} response`,
        ),
      });
    }
  }
  return table.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

/**
 * Every member with a `default` in a schema reachable from a response, as
 * `<where>: <path>`. The types are generated with `defaultNonNullable: false`
 * so that a request member with a default stays optional; a response member
 * with one would become optional too, so the spec is refused instead.
 */
export function responseDefaults(spec) {
  const found = new Set();
  const seen = new Set();
  const visit = (schema, where) => {
    if (!isObject(schema)) return;
    if (typeof schema.$ref === "string") {
      if (seen.has(schema.$ref)) return;
      seen.add(schema.$ref);
      visit(resolveRef(spec, schema.$ref), schema.$ref);
      return;
    }
    for (const key of ["anyOf", "oneOf", "allOf"]) {
      for (const branch of schema[key] ?? []) visit(branch, where);
    }
    visit(schema.items, `${where}/items`);
    visit(schema.additionalProperties, `${where}/additionalProperties`);
    for (const [name, member] of Object.entries(schema.properties ?? {})) {
      // openapi-typescript reads the member's own default only, not one
      // behind a $ref or inside a union.
      if (isObject(member) && "default" in member) {
        found.add(`${where}: ${name}`);
      }
      visit(member, `${where}/${name}`);
    }
  };
  for (const item of Object.values(spec.paths ?? {})) {
    if (!isObject(item)) continue;
    for (const operation of Object.values(item)) {
      if (!isObject(operation) || !isObject(operation.responses)) continue;
      for (const [status, raw] of Object.entries(operation.responses)) {
        const response = deref(spec, raw);
        for (const media of Object.values(response?.content ?? {})) {
          visit(media?.schema, `${operation.operationId} ${status}`);
        }
      }
    }
  }
  return [...found].sort();
}

function renderOperations(spec) {
  const table = operationTable(spec);
  const entries = table
    .map(({ id, ...op }) => `  ${id}: ${JSON.stringify(op)},`)
    .join("\n");
  const ids = table.map(({ id }) => `  | ${JSON.stringify(id)}`).join("\n");
  return `${HEADER}
import type { operations } from "./openapi.js";

/** The path segment that stands for every item of an array. */
export const ITEMS = ${JSON.stringify(ITEMS)};

/** A path to a value in a JSON body: member names, with ITEMS for every item of an array. */
export type JsonPath = readonly string[];

/** What the SDK needs to know about one operation, beyond its types. */
export interface Operation {
  /** The HTTP method. */
  readonly method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** The path template, such as "/v1/clients/{id}". */
  readonly path: string;
  /** Who may call it, from the operation's access policy. */
  readonly access:
    | "KeyOnly"
    | "KeyOrSession"
    | "SessionOnly"
    | "Public"
    | "ShareToken";
  /** The scope an API key needs, or null when the policy names none. */
  readonly scope: "ingest" | "read" | "write" | null;
  /** Whether it takes an Idempotency-Key. */
  readonly idempotent: boolean;
  /** The list kind, or null when it is not a list. */
  readonly list: "keyset" | "offset" | null;
  /**
   * The query parameters the spec marks x-repeatable: each takes an array,
   * written as one parameter per item.
   */
  readonly repeatable: readonly string[];
  /** The request body it takes. */
  readonly body: "none" | "json" | "merge-patch" | "multipart";
  /** The status of its success response. */
  readonly status: number;
  /** The path of every Money value in its request body. */
  readonly requestMoney: readonly JsonPath[];
  /** The path of every Money value in its success response. */
  readonly responseMoney: readonly JsonPath[];
}

/**
 * The operations the SDK can call, by operationId. Each must be an operation
 * of the generated types, or the table below fails to compile.
 */
export type OperationId = Extract<
  keyof operations,
${ids}
>;

/** The operation table, one entry per operation the SDK can call. */
export const OPERATIONS: { readonly [K in OperationId]: Operation } = {
${entries}
};
`;
}

/** Runs openapi-typescript with the SDK's transform hook. */
async function renderTypes(spec) {
  const defaults = responseDefaults(spec);
  if (defaults.length > 0) {
    throw new Error(
      `a response member has a default, which the generated types would make optional: ${defaults.join(", ")}`,
    );
  }
  const money = spec.components.schemas.Money;
  const instantInput = spec.components.schemas.InstantInput;
  const open = openSites(spec);
  const f = ts.factory;
  const decimal = f.createTypeReferenceNode("Decimal");
  const openString = f.createParenthesizedType(
    f.createIntersectionTypeNode([
      f.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
      f.createTypeLiteralNode([]),
    ]),
  );
  const stringOrDate = f.createUnionTypeNode([
    f.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
    f.createTypeReferenceNode("Date"),
  ]);
  const ast = await openapiTS(spec, {
    silent: true,
    // An object schema that names no members admits any member, as JSON
    // Schema reads it, so it is generated as a record of unknown values.
    emptyObjectsUnknown: true,
    // A member with a default stays optional unless the schema requires it:
    // a request may leave it out and let the API apply the default. No
    // response member has a default; the check above refuses one.
    defaultNonNullable: false,
    inject: 'import type { Decimal } from "../decimal.js";',
    transform(schema) {
      if (schema === money) return decimal;
      if (schema === instantInput) return stringOrDate;
      if (open.has(schema)) return openString;
      return undefined;
    },
  });
  return `${HEADER}\n${astToString(ast)}`;
}

/** Formats TypeScript source with the package's Biome, as `biome check` expects it. */
function format(source, file) {
  const result = spawnSync(
    process.execPath,
    [
      join(packageDir, "node_modules", "@biomejs", "biome", "bin", "biome"),
      "format",
      `--stdin-file-path=${file}`,
    ],
    { cwd: packageDir, input: source, encoding: "utf8", maxBuffer: 1 << 26 },
  );
  if (result.status !== 0) {
    throw new Error(`biome format failed for ${file}: ${result.stderr}`);
  }
  return result.stdout;
}

/**
 * Generates both files from the document's text. Returns each file's
 * content by its path relative to the package directory.
 */
export async function generate(specText) {
  // Each output reads its own parse of the document: openapi-typescript may
  // change the objects it is handed, and the transform hook recognises the
  // schemas it rewrites by identity, so they must be that parse's own.
  const operations = renderOperations(parse(specText));
  const types = await renderTypes(parse(specText));
  return {
    [OUTPUTS.openapi]: format(types, OUTPUTS.openapi),
    [OUTPUTS.operations]: format(operations, OUTPUTS.operations),
  };
}

async function main() {
  const check = process.argv.includes("--check");
  const files = await generate(readFileSync(SPEC_PATH, "utf8"));
  let stale = false;
  for (const [file, content] of Object.entries(files)) {
    const target = join(packageDir, file);
    if (check) {
      let current = "";
      try {
        current = readFileSync(target, "utf8");
      } catch {
        current = "";
      }
      if (current !== content) {
        console.error(`${file} is stale; run node scripts/generate.mjs`);
        stale = true;
      }
    } else {
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, content);
    }
  }
  if (stale) process.exit(1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
