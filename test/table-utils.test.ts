import { afterEach, expect, it, mock } from "bun:test";
import type { remark } from "remark";
import {
    type TableUtilsDependencies,
    toCell,
    toTable,
} from "../src/table-utils";

const mockParse = mock();
const remarkMock = () => ({
    parse: mockParse,
});
const deps: TableUtilsDependencies = {
    remark: remarkMock as unknown as typeof remark,
};

afterEach(() => {
    mockParse.mockReset();
});

it("should handle empty cells", () => {
    mockParse.mockReturnValue({
        children: [],
    });

    const cell = toCell(deps, "");
    expect(cell).toEqual({
        type: "tableCell",
        children: [],
    });
});

it("should create a cell from a string", () => {
    mockParse.mockReturnValue({
        children: [
            {
                type: "paragraph",
                children: [{ type: "text", value: "Test cell" }],
            },
        ],
    });

    const cell = toCell(deps, "Test cell");

    expect(cell).toEqual({
        type: "tableCell",
        children: [
            {
                type: "text",
                value: "Test cell",
            },
        ],
    });
});

it("should create a literal text cell from block-looking data", () => {
    mockParse.mockReturnValue({
        children: [
            {
                type: "heading",
                depth: 1,
                children: [{ type: "text", value: "Hello" }],
            },
        ],
    });

    expect(toCell(deps, "# Hello")).toEqual({
        type: "tableCell",
        children: [{ type: "text", value: "# Hello" }],
    });
});

it("should reject cells containing line breaks before parsing Markdown", () => {
    expect(() => toCell(deps, "First line\nSecond line")).toThrow(
        "CSV cells cannot contain line breaks.",
    );
    expect(mockParse).not.toHaveBeenCalled();
});

it("should create a table from CSV rows", () => {
    mockParse.mockImplementation((value: string) => ({
        children: [{ type: "paragraph", children: [{ type: "text", value }] }],
    }));

    const rows = [
        ["Header 1", "Header 2"],
        ["Row 1 Col 1", "Row 1 Col 2"],
    ];
    const table = toTable(deps, rows);

    expect(table).toEqual({
        type: "table",
        align: [null, null],
        children: [
            {
                type: "tableRow",
                children: [
                    {
                        type: "tableCell",
                        children: [{ type: "text", value: "Header 1" }],
                    },
                    {
                        type: "tableCell",
                        children: [{ type: "text", value: "Header 2" }],
                    },
                ],
            },
            {
                type: "tableRow",
                children: [
                    {
                        type: "tableCell",
                        children: [{ type: "text", value: "Row 1 Col 1" }],
                    },
                    {
                        type: "tableCell",
                        children: [{ type: "text", value: "Row 1 Col 2" }],
                    },
                ],
            },
        ],
    });
});
