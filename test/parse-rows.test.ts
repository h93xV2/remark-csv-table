import { it, mock, expect } from "bun:test";
import { parseRows } from "../src/parse-rows";

mock.module("node:fs", () => ({
  readFileSync: () => "header1,header2\nvalue1,value2",
}));

const parseMock = mock();

mock.module("csv-parse/sync", () => ({
  parse: parseMock,
}));

it("should parse CSV rows correctly", () => {
    parseMock.mockReturnValue([["header1", "header2"], ["value1", "value2"]]);

    const rows = parseRows("foo.csv");

    expect(rows).toEqual([["header1", "header2"], ["value1", "value2"]]);
});

it("should throw an error if the CSV has less than two rows", () => {
    parseMock.mockReturnValue([["header1", "header2"]]);

    expect(() => parseRows("foo.csv")).toThrow("CSV foo.csv must contain a header and at least one row.");
});

it("should throw an error if the header is empty", () => {
    parseMock.mockReturnValue([[""], ["value1", "value2"]]);

    expect(() => parseRows("foo.csv")).toThrow("CSV foo.csv cannot contain an empty header.");
});

it("should throw an error if the CSV cannot be parsed", () => {
    parseMock.mockImplementation(() => {
        throw new Error("Failed to parse CSV");
    });

    expect(() => parseRows("foo.csv")).toThrow("Unable to parse CSV foo.csv: Failed to parse CSV");
});
