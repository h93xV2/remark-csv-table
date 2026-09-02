import { expect, it, mock } from "bun:test";
import { toCell, toTable } from "../src/table-utils";

mock.module("remark", () => ({
    remark: () => ({
        parse: (_value: string) => ({
            children: [{}],
        }),
    }),
}));

// TODO: Mock the output of remark().parse(value)
it("should create a cell from a string", () => {
    const cell = toCell("Test cell");
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

it("should create a table from CSV rows", () => {
    const rows = [
        ["Header 1", "Header 2"],
        ["Row 1 Col 1", "Row 1 Col 2"],
    ];
    const table = toTable(rows);

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
