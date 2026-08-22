import { describe, expect, it } from "vitest";
import { NOUNS, countedNoun } from "./format";

describe("countedNoun — Arabic agrees the noun with the count", () => {
  const piece = (n: number) => countedNoun(n, NOUNS.piece);

  it("one and two are whole phrases, with no digit in them", () => {
    expect(piece(1)).toBe("قطعة واحدة");
    expect(piece(2)).toBe("قطعتان");
  });

  it("three to ten take the PLURAL noun after the digit", () => {
    expect(piece(3)).toBe("3 قطع");
    expect(piece(7)).toBe("7 قطع");
    expect(piece(10)).toBe("10 قطع");
  });

  it("eleven and up take the SINGULAR noun after the digit", () => {
    expect(piece(11)).toBe("11 قطعة");
    expect(piece(99)).toBe("99 قطعة");
    expect(piece(100)).toBe("100 قطعة");
    expect(piece(216)).toBe("216 قطعة");
  });

  it("zero reads as a plural, not as «0 قطعة»", () => {
    expect(piece(0)).toBe("0 قطع");
  });

  it("digits stay Western so one screen never mixes numeral systems", () => {
    expect(countedNoun(216, NOUNS.sale)).toBe("216 بيعة");
    expect(countedNoun(216, NOUNS.sale)).not.toMatch(/[٠-٩]/);
  });

  it("every shared noun set has all four forms and none of them repeats a digit", () => {
    for (const [name, forms] of Object.entries(NOUNS)) {
      for (const form of Object.values(forms)) {
        expect(form.length, name).toBeGreaterThan(0);
        expect(form, name).not.toMatch(/\d/);
      }
    }
  });

  it("the wrong forms — «1 قطعة» and «3 قطعة» — are never produced", () => {
    for (let n = 0; n <= 200; n += 1) {
      const out = piece(n);
      if (n === 1 || n === 2) expect(out).not.toMatch(/\d/);
      else expect(out.startsWith(String(n))).toBe(true);
      if (n >= 3 && n <= 10) expect(out.endsWith("قطع")).toBe(true);
    }
  });
});
