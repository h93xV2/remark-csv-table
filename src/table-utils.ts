import type { PhrasingContent, Table, TableCell } from "mdast";
import type { remark } from "remark";

export type TableUtilsDependencies = {
    remark: typeof remark;
};

const toCell = (deps: TableUtilsDependencies, value: string): TableCell => {
    if (value.split("\n").length > 1 || value.split("\r").length > 1) {
        throw new Error("CSV cells cannot contain line breaks.");
    }

    const root = deps.remark().parse(value);

    if (root.children.length === 0) {
        return {
            type: "tableCell",
            children: [],
        };
    }

    const [content] = root.children;

    if (root.children.length !== 1) {
        throw new Error(
            "CSV cells must contain plain text or single paragraph of inline Markdown",
        );
    }

    if (content?.type !== "paragraph") {
        return {
            type: "tableCell",
            children: [
                {
                    type: "text",
                    value,
                },
            ],
        };
    }

    const children: PhrasingContent[] = content.children;

    return {
        type: "tableCell",
        children,
    };
};

const toTable = (deps: TableUtilsDependencies, rows: string[][]): Table => {
    const align = rows[0]?.map(() => null) || [];

    return {
        type: "table",
        align: align,
        children: rows.map((row) => ({
            type: "tableRow",
            children: row.map((value) => toCell(deps, value)),
        })),
    };
};

export { toCell, toTable };
