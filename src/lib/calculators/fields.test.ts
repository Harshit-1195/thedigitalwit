import { describe, expect, it } from "vitest";
import { getCalculator } from "./data";
import { editField, evaluate, initFields, loadExample, pickTarget, type FieldState } from "./fields";
import { formatResult, formatWithUnit, parseNumber } from "./format";

const cpm = getCalculator("buy", "cpm")!; // 0 spend, 1 impressions, 2 cpm
const ltv = getCalculator("buy", "ltv")!;

const type = (calc: typeof cpm, s: FieldState, i: number, text: string) => editField(calc, s, i, text);

describe("touch order", () => {
  it("targets the named metric on a fresh page", () => {
    expect(pickTarget([0, 0, 0])).toBe(2);
    expect(evaluate(cpm, initFields(cpm)).target).toBe(2);
  });

  it("targets the lowest touch, ties to the last-declared var", () => {
    expect(pickTarget([3, 1, 2])).toBe(1);
    expect(pickTarget([0, 2, 0])).toBe(2);
    expect(pickTarget([0, 0, 5, 0])).toBe(3);
  });

  it("follows the spec example: Spend, Impressions, then CPM", () => {
    let s = initFields(cpm);
    s = type(cpm, s, 0, "5000");
    s = type(cpm, s, 1, "1,200,000");
    let r = evaluate(cpm, s);
    expect(r.target).toBe(2);
    expect(r.result).toBeCloseTo(4.1667, 4);

    s = type(cpm, s, 2, "5");
    r = evaluate(cpm, s);
    expect(r.target).toBe(0); // Spend was touched before Impressions
    expect(r.result).toBeCloseTo(6000);
    expect(s.raw[1]).toBe("1,200,000"); // Impressions untouched by the solve
  });

  it("increments on every edit, so a re-edited field moves to the back of the queue", () => {
    let s = initFields(cpm);
    s = type(cpm, s, 0, "5000");
    s = type(cpm, s, 1, "1000000");
    s = type(cpm, s, 2, "5"); // target -> spend
    s = type(cpm, s, 0, "6000"); // re-edit spend -> impressions is now oldest
    const r = evaluate(cpm, s);
    expect(r.target).toBe(1);
    expect(r.result).toBeCloseTo(1_200_000);
  });

  it("clearing a field resets it to untouched", () => {
    let s = initFields(cpm);
    s = type(cpm, s, 0, "5000");
    s = type(cpm, s, 1, "1000000");
    s = type(cpm, s, 2, "5"); // spend solved
    s = type(cpm, s, 1, ""); // impressions cleared -> untouched -> becomes target
    expect(s.touch[1]).toBe(0);
    const r = evaluate(cpm, s);
    expect(r.target).toBe(1);
    expect(r.result).toBeCloseTo(1_000_000); // from spend (kept as shown) and CPM
  });

  it("keeps the last solved value when the target moves", () => {
    let s = initFields(cpm);
    s = type(cpm, s, 0, "5000");
    s = type(cpm, s, 1, "1000000");
    s = type(cpm, s, 2, "5"); // spend becomes the target, solved = 5000
    s = type(cpm, s, 1, "2000000"); // spend re-solves to 10,000
    s = type(cpm, s, 2, ""); // clear CPM: tie at 0 goes to CPM, so spend turns back into an input
    expect(s.raw[0]).toBe("10000"); // ...showing the 10,000 the user last saw, not the 5000 they typed
    expect(evaluate(cpm, s).result).toBeCloseTo(5);
  });

  it("PRODUCT3 shows nothing until three of four are known", () => {
    let s = initFields(ltv);
    s = type(ltv, s, 0, "65");
    s = type(ltv, s, 1, "4");
    expect(evaluate(ltv, s).result).toBeNull();
    s = type(ltv, s, 2, "3");
    expect(evaluate(ltv, s).result).toBeCloseTo(780);
  });

  it("Load example fills every var except the last", () => {
    const s = loadExample(cpm);
    expect(s.raw).toEqual(["5000", "1200000", ""]);
    const r = evaluate(cpm, s);
    expect(r.target).toBe(2);
    expect(formatResult(r.result!)).toBe("4.17");
  });
});

describe("number input and formatting", () => {
  it("accepts pasted numbers with commas and symbols", () => {
    expect(parseNumber("1,200,000")).toBe(1_200_000);
    expect(parseNumber("$5,000.50")).toBe(5000.5);
    expect(parseNumber("12.5%")).toBe(12.5);
    expect(parseNumber("2.5x")).toBe(2.5);
    expect(parseNumber(" .5 ")).toBe(0.5);
    expect(parseNumber("-25")).toBe(-25);
  });
  it("treats junk and partials as blank", () => {
    for (const t of ["", "-", ".", "abc", "1.2.3", "12abc"]) expect(parseNumber(t)).toBeNull();
  });
  it("formats results with separators, 2 decimals and unit affixes", () => {
    expect(formatWithUnit(4.16666, "$")).toBe("$4.17");
    expect(formatWithUnit(1234567.891, "#")).toBe("1,234,567.89");
    expect(formatWithUnit(12, "%")).toBe("12.00%");
    expect(formatWithUnit(2.5, "x")).toBe("2.50x");
    expect(formatWithUnit(-25, "%")).toBe("−25.00%");
  });
});
