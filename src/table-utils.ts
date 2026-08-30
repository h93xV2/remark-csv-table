import type { TableCell, PhrasingContent, Table } from "mdast";
import { remark } from "remark";

const toCell = (value: string): TableCell => {
    const paragraph = remark().parse(value).children[0];
    const children: PhrasingContent[] =
        paragraph?.type === "paragraph"
            ? paragraph.children
            : value
              ? [{ type: "text", value }]
              : [];

    return {
        type: "tableCell",
        children: children,
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
