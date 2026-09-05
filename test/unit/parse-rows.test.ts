import { afterEach, expect, it, mock } from "bun:test";
import { type ParseRowsDependencies, parseRows } from "../../src/parse-rows";

const parseMock = mock();
const readFileMock = mock();
const deps: ParseRowsDependencies = {
    parseCsv: parseMock,
    readFile: readFileMock,
};

afterEach(() => {
    parseMock.mockReset();
    readFileMock.mockReset();
});

it("should parse CSV rows correctly", () => {
    const csv = "header1,header2\nvalue1,value2";
    readFileMock.mockReturnValue(csv);
    parseMock.mockReturnValue([
        ["header1", "header2"],
        ["value1", "value2"],
    ]);

    const rows = parseRows(deps, "foo.csv");

    expect(rows).toEqual([
        ["header1", "header2"],
        ["value1", "value2"],
    ]);
    expect(readFileMock).toHaveBeenCalledWith("foo.csv");
    expect(parseMock).toHaveBeenCalledWith(csv, {
        bom: true,
        relax_column_count: false,
        skip_empty_lines: true,
    });
});

it("should throw an error if the CSV has less than two rows", () => {
    parseMock.mockReturnValue([["header1", "header2"]]);

    expect(() => parseRows(deps, "foo.csv")).toThrow(
        "CSV foo.csv must contain a header and at least one row.",
    );
});

it("should throw an error if the header is empty", () => {
    parseMock.mockReturnValue([[""], ["value1", "value2"]]);

    expect(() => parseRows(deps, "foo.csv")).toThrow(
        "CSV foo.csv cannot contain an empty header.",
    );
});

it("should throw an error if the CSV cannot be parsed", () => {
    parseMock.mockImplementation(() => {
        throw new Error("Failed to parse CSV");
    });

    expect(() => parseRows(deps, "foo.csv")).toThrow(
        "Unable to parse CSV foo.csv: Failed to parse CSV",
    );
});
