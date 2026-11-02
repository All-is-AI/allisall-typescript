// Exact money in JSON bodies. A `Money` value is a JSON number on the wire.
// The SDK never lets a binary float hold one: a response's money is decoded
// from the number's own text into a `Decimal`, and a request's `Decimal` is
// written as its own text.
//
// Both directions work from an operation's `Money` paths, from the operation
// table. A path, not a member's name, decides whether a number is money:
// `total` is money in one schema and a count in another.
//
// Two platform features make this possible, and TypeScript's own library
// files declare neither, so this module declares the shapes it reads:
//
// - The third argument a `JSON.parse` reviver receives, whose `source` is a
//   number's text as it appeared in the JSON.
// - `JSON.rawJSON(text)`, whose result `JSON.stringify` writes as `text`,
//   unquoted.
//
// Both arrived in Chrome 114, Firefox 135, Safari 18.4 and Node 21. Without
// them, money cannot be handled exactly, and the SDK refuses rather than
// fall back on a float.

import { type Decimal, isDecimalText } from "./decimal.js";
import { AllisallError } from "./errors.js";
import { ITEMS, type JsonPath } from "./generated/operations.js";
import { hasLoneSurrogate } from "./unicode.js";

/**
 * A request type with every `Decimal` in it widened to `Decimal | number`:
 * what a request accepts where the API takes money. Use it to type a body
 * you build before passing it to a method, such as
 * `MoneyInput<CostLineItemCreate>`.
 *
 * A `Decimal`, such as one read from an earlier response, is sent with its
 * own digits. A `number` is sent as its shortest round-trip text, so a
 * literal such as `12.5` is sent exactly; a computed float such as
 * `0.1 + 0.2` is sent as `0.30000000000000004`, which the API refuses as
 * too precise rather than storing it inexactly. Build a `Decimal` with
 * `decimal()` when the amount must be exact.
 */
export type MoneyInput<T> = T extends Decimal
  ? Decimal | number
  : T extends Date
    ? T
    : T extends (infer U)[]
      ? MoneyInput<U>[]
      : T extends object
        ? { [K in keyof T]: MoneyInput<T[K]> }
        : T;

/** The `Money` paths of one body, as a tree of member names. */
interface PathTree {
  money: boolean;
  readonly children: Map<string, PathTree>;
}

const trees = new WeakMap<readonly JsonPath[], PathTree>();

function treeOf(paths: readonly JsonPath[]): PathTree {
  const cached = trees.get(paths);
  if (cached !== undefined) return cached;
  const root: PathTree = { money: false, children: new Map() };
  for (const path of paths) {
    let node = root;
    for (const segment of path) {
      let child = node.children.get(segment);
      if (child === undefined) {
        child = { money: false, children: new Map() };
        node.children.set(segment, child);
      }
      node = child;
    }
    node.money = true;
  }
  trees.set(paths, root);
  return root;
}

function childOf(
  node: PathTree | undefined,
  segment: string,
): PathTree | undefined {
  return node?.children.get(segment);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) return false;
  const proto: unknown = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

// ---- Decoding a response ----

/**
 * A JSON number as the first pass of decoding leaves it: its value, and its
 * text when the runtime supplied it.
 */
class JsonNumber {
  constructor(
    readonly value: number,
    readonly source: string | undefined,
  ) {}
}

/** The text of the number a reviver was called with, when the runtime supplies it. */
function sourceText(context: unknown): string | undefined {
  if (typeof context !== "object" || context === null) return undefined;
  const source: unknown = Reflect.get(context, "source");
  return typeof source === "string" ? source : undefined;
}

function keepNumberText(
  _key: string,
  value: unknown,
  context?: unknown,
): unknown {
  return typeof value === "number"
    ? new JsonNumber(value, sourceText(context))
    : value;
}

/**
 * The largest exponent magnitude the decoder writes out in digits. Money is
 * far smaller; the bound keeps a hostile exponent from building a huge
 * string.
 */
export const MAX_EXPONENT = 400;

const JSON_NUMBER =
  /^(-?)(0|[1-9][0-9]*)(?:\.([0-9]+))?(?:[eE]([+-]?[0-9]+))?$/;

/**
 * The text of a `Decimal` equal to a JSON number's text. A number in
 * exponent form, such as `1e-7`, is written out in digits; the conversion
 * moves the decimal point and never rounds.
 *
 * @throws {AllisallError} when the exponent's magnitude exceeds
 * `MAX_EXPONENT`.
 */
export function decimalOfJsonNumber(text: string): Decimal | undefined {
  if (isDecimalText(text)) {
    // The syntax check is the invariant the brand stands for.
    return text as Decimal;
  }
  const match = JSON_NUMBER.exec(text);
  if (match === null) return undefined;
  const [, sign = "", whole = "", fraction = "", exponent = "0"] = match;
  const digits = whole + fraction;
  const shift = Number(exponent);
  if (!(Math.abs(shift) <= MAX_EXPONENT)) {
    throw new AllisallError(
      `allisall: the API sent money as ${JSON.stringify(text)}, whose exponent is beyond ±${MAX_EXPONENT}`,
    );
  }
  const point = whole.length + shift;
  let out: string;
  if (point <= 0) out = `0.${"0".repeat(-point)}${digits}`;
  else if (point >= digits.length)
    out = digits + "0".repeat(point - digits.length);
  else out = `${digits.slice(0, point)}.${digits.slice(point)}`;
  // Moving the point can leave leading zeros in the whole part, as `0.5e1`
  // becomes `05`.
  out = out.replace(/^0+(?=[0-9])/, "");
  const result = sign + out;
  // Every branch above writes decimal text; the check keeps the brand honest.
  return isDecimalText(result) ? (result as Decimal) : undefined;
}

function place(value: unknown, node: PathTree | undefined): unknown {
  if (value instanceof JsonNumber) {
    if (node?.money !== true) return value.value;
    if (value.source === undefined) {
      throw new AllisallError(
        "allisall: this runtime does not give a JSON.parse reviver the source text of a number (the reviver's context argument), so the money in this response cannot be read exactly; use Node 21 or later, Chrome 114, Firefox 135 or Safari 18.4 or later",
      );
    }
    const amount = decimalOfJsonNumber(value.source);
    if (amount === undefined) {
      throw new AllisallError(
        `allisall: the API sent money as ${JSON.stringify(value.source)}, which is not a decimal number`,
      );
    }
    return amount;
  }
  if (Array.isArray(value)) {
    const items = childOf(node, ITEMS);
    for (let i = 0; i < value.length; i++) value[i] = place(value[i], items);
    return value;
  }
  if (typeof value === "object" && value !== null) {
    for (const key of Object.keys(value)) {
      Reflect.set(
        value,
        key,
        place(Reflect.get(value, key), childOf(node, key)),
      );
    }
  }
  return value;
}

/**
 * Parses a response body. Every number at one of `moneyPaths` becomes a
 * `Decimal` of the number's text; every other number becomes the `number`
 * `JSON.parse` would give. A `null` stays `null`.
 *
 * @throws {SyntaxError} when `text` is not JSON.
 * @throws {AllisallError} when the body holds money and the runtime does not
 * give a reviver a number's text.
 */
export function decodeJson(
  text: string,
  moneyPaths: readonly JsonPath[],
): unknown {
  const parsed: unknown = JSON.parse(text, keepNumberText);
  return place(parsed, treeOf(moneyPaths));
}

// ---- Encoding a request ----

/** `JSON.rawJSON`, when the runtime has it. */
function rawJson(): ((text: string) => unknown) | undefined {
  const fn: unknown = Reflect.get(JSON, "rawJSON");
  if (typeof fn !== "function") return undefined;
  return (text: string): unknown => Reflect.apply(fn, JSON, [text]);
}

function kindOf(value: unknown): string {
  if (Array.isArray(value)) return "an array";
  return typeof value === "object" ? "an object" : `a ${typeof value}`;
}

function encodeMoney(value: unknown, path: readonly string[]): unknown {
  const where = path.length === 0 ? "the body" : `/${path.join("/")}`;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new TypeError(
        `allisall: the money at ${where} is ${value}; it must be a finite number`,
      );
    }
    return value;
  }
  // A money member may be nullable; an absent or undefined one is not sent.
  if (value === null || value === undefined) return value;
  if (typeof value !== "string") {
    throw new TypeError(
      `allisall: the money at ${where} is ${kindOf(value)}; it must be a Decimal, a finite number or null`,
    );
  }
  if (!isDecimalText(value)) {
    throw new TypeError(
      `allisall: the money at ${where} is ${JSON.stringify(value)}, which is not a decimal; build it with decimal()`,
    );
  }
  const raw = rawJson();
  if (raw === undefined) {
    throw new AllisallError(
      "allisall: this runtime has no JSON.rawJSON, so a Decimal cannot be sent exactly; use Node 21 or later, Chrome 114, Firefox 135 or Safari 18.4 or later",
    );
  }
  return raw(value);
}

function copyAlong(
  value: unknown,
  node: PathTree,
  path: readonly string[],
): unknown {
  if (node.money) return encodeMoney(value, path);
  if (Array.isArray(value)) {
    const items = node.children.get(ITEMS);
    if (items === undefined) return value;
    return value.map((item: unknown, i) =>
      copyAlong(item, items, [...path, String(i)]),
    );
  }
  if (isPlainObject(value)) {
    const copy: Record<string, unknown> = {};
    for (const [key, member] of Object.entries(value)) {
      const child = node.children.get(key);
      const written =
        child === undefined ? member : copyAlong(member, child, [...path, key]);
      Object.defineProperty(copy, key, {
        value: written,
        enumerable: true,
        writable: true,
        configurable: true,
      });
    }
    return copy;
  }
  return value;
}

/**
 * A `JSON.stringify` replacer refusing the values it would write as `null`
 * in silence: an invalid `Date`, and a non-finite number. On a merge patch,
 * `null` clears a member, so either would change data the caller never
 * meant to touch. It also refuses text holding a lone surrogate, in a
 * string or a member name, which the API would store as U+FFFD.
 *
 * A replacer sees a member's key and its holder, not its path, so each
 * object's path is recorded as it is reached, before its members are.
 */
function refuseLostValues(): (
  this: unknown,
  key: string,
  value: unknown,
) => unknown {
  const paths = new WeakMap<object, string>();
  return function (this: unknown, key: string, value: unknown): unknown {
    const holder = typeof this === "object" && this !== null ? this : undefined;
    const parent = holder === undefined ? undefined : paths.get(holder);
    // The root's holder is the wrapper JSON.stringify makes, never recorded.
    // A name is checked before it joins a path, so no message carries it.
    if (parent !== undefined && hasLoneSurrogate(key)) {
      throw new TypeError(
        `allisall: a member name in the object at ${parent === "" ? "the body" : parent} is not valid Unicode (a lone surrogate)`,
      );
    }
    const path = parent === undefined ? "" : `${parent}/${key}`;
    const where = path === "" ? "the body" : path;
    // The value has been through toJSON already; the holder keeps the Date.
    const original: unknown =
      holder === undefined ? value : Reflect.get(holder, key);
    if (original instanceof Date && Number.isNaN(original.getTime())) {
      throw new TypeError(`allisall: the value at ${where} is an invalid Date`);
    }
    if (typeof value === "number" && !Number.isFinite(value)) {
      throw new TypeError(
        `allisall: the value at ${where} is ${value}; it must be a finite number`,
      );
    }
    if (typeof value === "string" && hasLoneSurrogate(value)) {
      throw new TypeError(
        `allisall: the value at ${where} is not valid Unicode (a lone surrogate)`,
      );
    }
    if (typeof value === "object" && value !== null) paths.set(value, path);
    return value;
  };
}

/**
 * Serialises a request body. At each of `moneyPaths`, a `Decimal` is
 * written as its own digits and a `number` as its shortest round-trip text.
 * The caller's object is not changed. Every member it holds is written, as
 * `JSON.stringify` writes it.
 *
 * @throws {TypeError} when a value at a money path is not a `Decimal`, a
 * finite number or `null`; when any value is an invalid `Date`, a
 * non-finite number, or text holding a lone surrogate, naming its path; or
 * when the body has no JSON text, such as `undefined`.
 * @throws {AllisallError} when the body holds a `Decimal` and the runtime has
 * no `JSON.rawJSON`.
 */
export function encodeJson(
  body: unknown,
  moneyPaths: readonly JsonPath[],
): string {
  const copy = copyAlong(body, treeOf(moneyPaths), []);
  // JSON.stringify gives undefined, despite its declared type, for a body
  // with no JSON text: undefined, a function or a symbol.
  const text: string | undefined = JSON.stringify(copy, refuseLostValues());
  if (typeof text !== "string") {
    throw new TypeError(
      `allisall: a request body of type ${typeof body} has no JSON text`,
    );
  }
  return text;
}
