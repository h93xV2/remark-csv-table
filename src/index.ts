import path from "node:path";
import type { LeafDirective } from "mdast-util-directive";
import type { Root } from "mdast";
import { visit } from "unist-util-visit";
import type { Plugin } from "unified";
import type { VFile } from "vfile";
import { toTable } from "./table-utils";
import { getCsvPath } from "./get-csv-path";
import { parseRows } from "./parse-rows";

type RemarkCsvTablesOptions = {
    contentDirectory: string;
};

const remarkCsvTables: Plugin<[RemarkCsvTablesOptions?], Root> = (options) => {
    const contentDirectory = path.resolve(
        options?.contentDirectory || process.cwd(),
    );

    return (tree: Root, file: VFile) => {
        visit(tree, "leafDirective", (node: LeafDirective, index, parent) => {
            if (node.name !== "csv") {
                return;
            }

            file.info(
                `[remark-csv-tables] Found CSV directive in ${file.path ?? "unknown Markdown file"}.`,
            );

            if (!parent || index === undefined) {
                throw new Error("Unable to replace the csv directive.");
            }

            const csvPath = getCsvPath(node, file, contentDirectory);
            file.info(`[remark-csv-tables] Reading ${csvPath}.`);

            const rows = parseRows(csvPath);

            parent.children[index] = toTable(rows);

            file.info(
                `[remark-csv-tables] Replaced directive with a ${rows.length - 1}-row table.`,
            );
        });
    };
};

export default remarkCsvTables;
