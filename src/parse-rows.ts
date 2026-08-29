import { parse } from "csv-parse/sync";
import { readFileSync } from "node:fs";

const parseRows = (csvPath: string) => {
    let rows: string[][];

    try {
        rows = parse(readFileSync(csvPath), {
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

    if (rows[0] && rows[0].some((header) => !header.trim())) {
        throw new Error(`CSV ${csvPath} cannot contain an empty header.`);
    }

    return rows;
};

export { parseRows };
