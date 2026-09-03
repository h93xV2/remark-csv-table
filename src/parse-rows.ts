import type { readFileSync } from "node:fs";
import type { parse } from "csv-parse/sync";

export type ParseRowsDependencies = {
    readFile: typeof readFileSync;
    parseCsv: typeof parse;
};

const parseRows = (deps: ParseRowsDependencies, csvPath: string) => {
    let rows: string[][];

    try {
        rows = deps.parseCsv(deps.readFile(csvPath), {
            bom: true,
            relax_column_count: false,
            skip_empty_lines: true,
        });
    } catch (error) {
        throw new Error(
            `Unable to parse CSV ${csvPath}: ${(error as Error).message}`,
        );
    }

    if (rows.length < 2) {
        throw new Error(
            `CSV ${csvPath} must contain a header and at least one row.`,
        );
    }

    if (rows[0]?.some((header) => !header.trim())) {
        throw new Error(`CSV ${csvPath} cannot contain an empty header.`);
    }

    return rows;
};

export { parseRows };
