import { describe, expect, it } from "vitest";
import { toCsv } from "./export-service";

describe("toCsv", () => {
  it("serializes columns and rows", () => {
    const csv = toCsv({
      title: "T",
      columns: ["A", "B"],
      rows: [
        [1, 2],
        ["x", "y"],
      ],
    });
    expect(csv).toBe("A,B\n1,2\nx,y");
  });

  it("escapes values containing commas, quotes and newlines", () => {
    const csv = toCsv({
      title: "T",
      columns: ["Name"],
      rows: [["a,b"], ['he said "hi"'], ["line\nbreak"]],
    });
    const lines = csv.split("\n");
    expect(lines[1]).toBe('"a,b"');
    expect(lines[2]).toBe('"he said ""hi"""');
  });
});
