import { readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import type { Root } from "mdast";
import type { LeafDirective } from "mdast-util-directive";
import { remark } from "remark";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";
import type { VFile } from "vfile";
import { getCsvPath } from "./get-csv-path.js";
import { parseRows } from "./parse-rows.js";
import { toTable } from "./table-utils.js";

export type RemarkCsvTablesOptions = {
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
                `Found CSV directive in ${file.path ?? "unknown Markdown file"}.`,
                { source: "remark-csv-table" },
            );

            if (!parent || index === undefined) {
                throw new Error("Unable to replace the csv directive.");
            }

            const csvPath = getCsvPath(node, file, contentDirectory);
            file.info(`Reading ${csvPath}.`, { source: "remark-csv-table" });

            const rows = parseRows(
                { readFile: readFileSync, parseCsv: parse },
                csvPath,
            );

            parent.children[index] = toTable({ remark }, rows);

            file.info(
                `Replaced directive with a ${rows.length - 1}-row table.`,
                { source: "remark-csv-table" },
            );
        });
    };
};

export default remarkCsvTables;
