import type { PhrasingContent, Table, TableCell } from "mdast";
import { remark } from "remark";

const toCell = (value: string): TableCell => {
    const root = remark().parse(value);

    if (root.children.length === 0) {
        return {
            type: "tableCell",
            children: [],
        };
    }

    const [content] = root.children;

    if (root.children.length !== 1 || content?.type !== "paragraph") {
        throw new Error(
            "CSV cells must contain plain text or single paragraph of inline Markdown",
        );
    }

    const children: PhrasingContent[] = content.children;

    return {
        type: "tableCell",
        children,
    };
};

const toTable = (rows: string[][]): Table => {
    const align = rows[0]?.map(() => null) || [];

    return {
        type: "table",
        align: align,
        children: rows.map((row) => ({
            type: "tableRow",
            children: row.map(toCell),
        })),
    };
};

export { toCell, toTable };
