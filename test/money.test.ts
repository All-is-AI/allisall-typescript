// Exact money in JSON bodies: the response decoder and the request encoder,
// driven by the operation table's Money paths.

import { afterEach, describe, expect, it, onTestFinished, vi } from "vitest";
import { type Decimal, decimal } from "../src/decimal.js";
import { AllisallError } from "../src/errors.js";
import { ITEMS, OPERATIONS } from "../src/generated/operations.js";
import {
  decimalOfJsonNumber,
  decodeJson,
  encodeJson,
  MAX_EXPONENT,
} from "../src/money.js";

// More significant digits than a binary float holds: any float on the way
// changes the text.
const EXACT = "0.1234567890123456789";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("decoding a response", () => {
  it("gives a Decimal of the number's own text at a Money path, and a number beside it", () => {
    // The fixture must be one a float cannot carry.
    expect(String(Number(EXACT))).not.toBe(EXACT);
    const body = decodeJson(`{"total":${EXACT},"count":3}`, [["total"]]);
    expect(body).toEqual({ total: EXACT, count: 3 });
    expect(typeof Reflect.get(Object(body), "count")).toBe("number");
  });

  it("decodes total as a Decimal in a value result and as a number in an event list", () => {
    const value = decodeJson(
      `{"currency":"JPY","minor_units":0,"lines":[{"unit_value":1.5000,"total":12}],"total":12}`,
      OPERATIONS.getClientValue.responseMoney,
    );
    expect(value).toMatchObject({
      lines: [{ unit_value: "1.5000", total: "12" }],
      total: "12",
      minor_units: 0,
    });
    const events = decodeJson(
      `{"data":[{"cost":0.3683},{"cost":null}],"total":12,"has_more":false,"next_cursor":null}`,
      OPERATIONS.listClientEvents.responseMoney,
    );
    expect(events).toEqual({
      data: [{ cost: "0.3683" }, { cost: null }],
      total: 12,
      has_more: false,
      next_cursor: null,
    });
  });

  it("follows every item of an array, at any depth", () => {
    const body = decodeJson(
      `{"a":[{"b":[1.10,2.20]},{"b":[3.30]}],"c":[1.10]}`,
      [["a", ITEMS, "b", ITEMS]],
    );
    expect(body).toEqual({
      a: [{ b: ["1.10", "2.20"] }, { b: ["3.30"] }],
      c: [1.1],
    });
  });

  it("keeps null, a missing member and a non-number at a Money path as they are", () => {
    expect(
      decodeJson(`{"x":null,"y":"12","z":[]}`, [["x"], ["y"], ["w"], ["z"]]),
    ).toEqual({ x: null, y: "12", z: [] });
  });

  it("writes a number in exponent form out in digits, without rounding", () => {
    const body = decodeJson(`{"rate":1e-7,"big":1.5E+3,"neg":-2.50e1}`, [
      ["rate"],
      ["big"],
      ["neg"],
    ]);
    expect(body).toEqual({ rate: "0.0000001", big: "1500", neg: "-25.0" });
  });

  it("passes on a top-level array or scalar", () => {
    expect(decodeJson("[1,2.5]", [])).toEqual([1, 2.5]);
    expect(decodeJson("7", [])).toBe(7);
    expect(decodeJson("7.70", [[]])).toBe("7.70");
  });

  it("throws on text that is not JSON", () => {
    expect(() => decodeJson("<html>", [])).toThrow(SyntaxError);
  });

  describe("on a runtime whose reviver gets no source text", () => {
    function withoutSourceText(): void {
      const parse = JSON.parse;
      vi.spyOn(JSON, "parse").mockImplementation(
        (text: string, reviver?: (key: string, value: unknown) => unknown) =>
          reviver === undefined
            ? parse(text)
            : // The reviver is called as an older engine calls it: with no context.
              parse(text, (key: string, value: unknown) => reviver(key, value)),
      );
    }

    it("refuses a response holding money, naming the missing feature", () => {
      withoutSourceText();
      const decode = (): unknown =>
        decodeJson(`{"total":${EXACT}}`, [["total"]]);
      expect(decode).toThrow(AllisallError);
      expect(decode).toThrow(/source text of a number/);
      expect(decode).toThrow(/Safari 18\.4/);
    });

    it("still decodes a response holding no money", () => {
      withoutSourceText();
      expect(decodeJson(`{"total":null,"count":2.5}`, [["total"]])).toEqual({
        total: null,
        count: 2.5,
      });
    });
  });
});

describe("decimalOfJsonNumber", () => {
  it.each([
    ["0", "0"],
    ["-0", "-0"],
    ["12.50", "12.50"],
    ["1e0", "1"],
    ["1E2", "100"],
    ["0.5e1", "5"],
    ["0.05e1", "0.5"],
    ["123.456e-2", "1.23456"],
    ["123.456e+5", "12345600"],
    ["9e-9", "0.000000009"],
    ["-1.25e-3", "-0.00125"],
  ])("%s is %s", (text, expected) => {
    expect(decimalOfJsonNumber(text)).toBe(expected);
  });

  it("refuses text that is not a JSON number", () => {
    expect(decimalOfJsonNumber("1,2")).toBeUndefined();
    expect(decimalOfJsonNumber("Infinity")).toBeUndefined();
  });

  it(`writes out an exponent of magnitude ${MAX_EXPONENT}, and refuses one beyond it`, () => {
    expect(MAX_EXPONENT).toBe(400);
    expect(decimalOfJsonNumber("1e400")).toBe(`1${"0".repeat(400)}`);
    expect(decimalOfJsonNumber("1e-400")).toBe(`0.${"0".repeat(399)}1`);
    for (const text of ["1e401", "1e-401", "1e999999999", "1e100000000"]) {
      expect(() => decimalOfJsonNumber(text), text).toThrow(AllisallError);
      expect(() => decimalOfJsonNumber(text), text).toThrow(/beyond ±400/);
    }
  });

  it("refuses such an exponent in a response only at a Money path", () => {
    expect(() => decodeJson('{"total":1e401}', [["total"]])).toThrow(
      AllisallError,
    );
    // Elsewhere it is the number JSON.parse gives.
    expect(decodeJson('{"count":1e401}', [["total"]])).toEqual({
      count: Number.POSITIVE_INFINITY,
    });
  });
});

describe("encoding a request", () => {
  it("writes a Decimal unquoted, with its own digits", () => {
    const amount = decimal("1234.5678901234567890123");
    const text = encodeJson(
      { name: "Hosting", monthly_amount: amount },
      OPERATIONS.createCostLineItem.requestMoney,
    );
    expect(text).toBe(
      '{"name":"Hosting","monthly_amount":1234.5678901234567890123}',
    );
    // A float would have rounded it.
    expect(JSON.stringify({ monthly_amount: Number(amount) })).not.toContain(
      amount,
    );
  });

  it("writes a number as its shortest round-trip text", () => {
    expect(encodeJson({ monthly_amount: 12.5 }, [["monthly_amount"]])).toBe(
      '{"monthly_amount":12.5}',
    );
  });

  it("follows every item of an array", () => {
    const text = encodeJson(
      {
        models: [
          {
            model: "a",
            input_per_1k: decimal("0.000000001"),
            output_per_1k: 2,
          },
          { model: "b", input_per_1k: decimal("0.1"), output_per_1k: null },
        ],
      },
      OPERATIONS.setPriceTable.requestMoney,
    );
    expect(text).toBe(
      '{"models":[{"model":"a","input_per_1k":0.000000001,"output_per_1k":2},{"model":"b","input_per_1k":0.1,"output_per_1k":null}]}',
    );
  });

  it("sends back what a response decoded, with the same digits", () => {
    const read = decodeJson(
      `{"models":[{"model":"a","input_per_1k":1e-7,"output_per_1k":0.30}]}`,
      OPERATIONS.getPriceTable.responseMoney,
    );
    expect(encodeJson(read, OPERATIONS.setPriceTable.requestMoney)).toBe(
      '{"models":[{"model":"a","input_per_1k":0.0000001,"output_per_1k":0.30}]}',
    );
  });

  it("refuses a string that is not decimal text before anything is written", () => {
    // Cast to test the run-time check: the type refuses an unbranded string.
    const injected = '1,"x":1' as Decimal;
    expect(() =>
      encodeJson({ monthly_amount: injected }, [["monthly_amount"]]),
    ).toThrow(TypeError);
    expect(() =>
      encodeJson({ monthly_amount: injected }, [["monthly_amount"]]),
    ).toThrow(/\/monthly_amount/);
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    "refuses the non-finite number %s, which JSON would write as null",
    (n) => {
      expect(() =>
        encodeJson({ monthly_amount: n }, [["monthly_amount"]]),
      ).toThrow(TypeError);
    },
  );

  it("writes a string elsewhere as a quoted string, untouched", () => {
    expect(
      encodeJson({ notes: '1,"x":1', monthly_amount: 1 }, [["monthly_amount"]]),
    ).toBe('{"notes":"1,\\"x\\":1","monthly_amount":1}');
  });

  it("leaves the caller's object unchanged, and writes every member it holds", () => {
    const amount = decimal("3.14");
    const line = { label: "x", unit_value: amount, extra: [1] };
    const body = { line_items: [line] };
    const text = encodeJson(
      body,
      OPERATIONS.setValueModelLineItems.requestMoney,
    );
    expect(text).toBe(
      '{"line_items":[{"label":"x","unit_value":3.14,"extra":[1]}]}',
    );
    expect(body.line_items[0]).toBe(line);
    expect(line.unit_value).toBe("3.14");
  });

  it.each([
    [true, /is a boolean/],
    [{}, /is an object/],
    [[], /is an array/],
  ])("refuses %j at a money path, naming the path", (value, kind) => {
    const encode = (): string =>
      encodeJson({ line: { monthly_amount: value } }, [
        ["line", "monthly_amount"],
      ]);
    expect(encode).toThrow(TypeError);
    expect(encode).toThrow(/\/line\/monthly_amount/);
    expect(encode).toThrow(kind);
  });

  it("sends null at a money path as null", () => {
    expect(encodeJson({ monthly_amount: null }, [["monthly_amount"]])).toBe(
      '{"monthly_amount":null}',
    );
  });

  it("refuses a body with no JSON text rather than return undefined", () => {
    expect(() => encodeJson(undefined, [])).toThrow(TypeError);
    expect(() => encodeJson(undefined, [])).toThrow(/no JSON text/);
  });

  it("omits an undefined member, as JSON.stringify does", () => {
    expect(
      encodeJson({ monthly_amount: undefined, name: "n" }, [
        ["monthly_amount"],
      ]),
    ).toBe('{"name":"n"}');
  });

  it("keeps a member named __proto__ as a member", () => {
    const body: unknown = JSON.parse('{"__proto__":{"monthly_amount":1}}');
    expect(encodeJson(body, [["__proto__", "monthly_amount"]])).toBe(
      '{"__proto__":{"monthly_amount":1}}',
    );
  });

  describe("on a runtime without JSON.rawJSON", () => {
    function withoutRawJson(): void {
      const raw: unknown = Reflect.get(JSON, "rawJSON");
      Reflect.deleteProperty(JSON, "rawJSON");
      onTestFinished(() => {
        Reflect.set(JSON, "rawJSON", raw);
      });
    }

    it("refuses a Decimal rather than write a float", () => {
      withoutRawJson();
      const encode = (): string =>
        encodeJson({ monthly_amount: decimal("1.5") }, [["monthly_amount"]]);
      expect(encode).toThrow(AllisallError);
      expect(encode).toThrow(/JSON\.rawJSON/);
    });

    it("still writes a number", () => {
      withoutRawJson();
      expect(encodeJson({ monthly_amount: 1.5 }, [["monthly_amount"]])).toBe(
        '{"monthly_amount":1.5}',
      );
    });
  });
});
