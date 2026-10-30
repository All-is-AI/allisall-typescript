declare const decimalBrand: unique symbol;

/**
 * An exact decimal amount, such as a `cost`. It is a string at run time,
 * branded so that only `decimal()` produces one. The SDK writes its text
 * into the request unchanged, as a JSON number, so no binary float ever
 * rounds it.
 */
export type Decimal = string & { readonly [decimalBrand]: true };

/**
 * The syntax a `Decimal` accepts: an optional `-`, digits without a leading
 * zero (or a single `0`), and optional decimal places after a `.`. Every
 * string it accepts is a valid JSON number.
 */
const DECIMAL_SYNTAX = /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$/;

/** Reports whether `text` has the syntax of a `Decimal`. */
export function isDecimalText(text: string): boolean {
  return DECIMAL_SYNTAX.test(text);
}

/**
 * Makes a `Decimal` from its text, such as `decimal("0.3683")`.
 *
 * @throws {TypeError} when `text` is not an optional `-`, digits without a
 * leading zero (or a single `0`), and optional decimal places after a `.`.
 */
export function decimal(text: string): Decimal {
  if (typeof text !== "string" || !isDecimalText(text)) {
    throw new TypeError(
      `allisall: ${JSON.stringify(text)} is not a decimal; write it as digits with an optional "-" and decimal places, such as "12.5"`,
    );
  }
  // The syntax check above is the invariant the brand stands for.
  return text as Decimal;
}
