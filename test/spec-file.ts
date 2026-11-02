// Locates the API's OpenAPI document for the tests that read it.
//
// The document exists only in the monorepo. Outside it, for example in the
// public mirror, those tests skip. Inside it, marked by pnpm-workspace.yaml at
// the repository root, a missing document fails them, so a moved document
// cannot switch the checks off in silence.

import { existsSync, readFileSync } from "node:fs";

const SPEC = new URL("../../openapi/openapi.yaml", import.meta.url);
const MONOREPO_MARKER = new URL(
  "../../../pnpm-workspace.yaml",
  import.meta.url,
);

/** The document's text, or null outside the monorepo. */
export function readSpecText(): string | null {
  if (existsSync(SPEC)) return readFileSync(SPEC, "utf8");
  if (existsSync(MONOREPO_MARKER)) {
    throw new Error(
      `${SPEC.pathname} is missing, but ${MONOREPO_MARKER.pathname} marks this as the monorepo, where it must exist`,
    );
  }
  return null;
}

export type Json = unknown;

export function isRecord(value: Json): value is Record<string, Json> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Resolves a local `$ref`, such as `#/components/schemas/Money`. */
export function resolveRef(spec: Json, ref: string): Json {
  if (!ref.startsWith("#/")) throw new Error(`${ref} is not a local reference`);
  let node = spec;
  for (const raw of ref.slice(2).split("/")) {
    const key = raw.replaceAll("~1", "/").replaceAll("~0", "~");
    if (!isRecord(node) || !(key in node)) {
      throw new Error(`${ref} does not resolve`);
    }
    node = node[key];
  }
  return node;
}
