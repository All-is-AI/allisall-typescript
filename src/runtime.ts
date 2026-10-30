// What the SDK learns about the runtime it runs in: whether it is a
// browser, the environment, and the User-Agent. Globals are read through
// `globalThis` by name, so a runtime without them, such as a browser
// without `process`, is never touched.

import { VERSION } from "./version.js";

function globalValue(name: string): unknown {
  const value: unknown = Reflect.get(globalThis, name);
  return value;
}

function isObject(value: unknown): value is object {
  return typeof value === "object" && value !== null;
}

/**
 * Reports whether the SDK runs in a browser: a window, where `document`
 * is defined, or a Web Worker, where `globalThis` is an instance of
 * `WorkerGlobalScope`. Node, Deno, Bun and edge runtimes define neither.
 */
export function isBrowser(): boolean {
  if (globalValue("document") !== undefined) return true;
  const scope = globalValue("WorkerGlobalScope");
  return typeof scope === "function" && globalThis instanceof scope;
}

/**
 * Reads an environment variable from `globalThis.process.env`, where it
 * exists. Returns `undefined` for a variable that is unset or empty.
 */
export function readEnv(name: string): string | undefined {
  const process = globalValue("process");
  if (!isObject(process)) return undefined;
  const env: unknown = Reflect.get(process, "env");
  if (!isObject(env)) return undefined;
  const value: unknown = Reflect.get(env, name);
  return typeof value === "string" && value !== "" ? value : undefined;
}

function nodeVersion(): string | undefined {
  const process = globalValue("process");
  if (!isObject(process)) return undefined;
  const versions: unknown = Reflect.get(process, "versions");
  if (!isObject(versions)) return undefined;
  const node: unknown = Reflect.get(versions, "node");
  return typeof node === "string" && node !== "" ? node : undefined;
}

/**
 * The `User-Agent` to send: `allisall-ts/<version> node/<node version>`.
 * A server runtime that reports no Node version, such as an edge runtime,
 * sends `allisall-ts/<version>` alone. A browser sends none.
 */
export function userAgent(): string | undefined {
  if (isBrowser()) return undefined;
  const node = nodeVersion();
  return node === undefined
    ? `allisall-ts/${VERSION}`
    : `allisall-ts/${VERSION} node/${node}`;
}
