import fs, { existsSync } from "node:fs";
import path from "node:path";
import type { LeafDirective } from "mdast-util-directive";
import type { VFile } from "vfile";

const getRealPath = (file: VFile, path: string) => {
    try {
        return fs.realpathSync(path);
    } catch (error) {
        file.message(`Unable to resolve path: ${path}`, {
            cause: error as Error,
        });
        throw new Error(`Unable to resolve path: ${path}`);
    }
};

const isOutsideDirectory = (relativePath: string) =>
    relativePath === ".." ||
    relativePath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativePath);

const getCsvPath = (
    node: LeafDirective,
    file: VFile,
    contentDirectory: string,
) => {
    const source = node.attributes?.src;

    if (!source || typeof source !== "string") {
        throw new Error("The csv directive requires a src attribute.");
    }

    if (!source.endsWith(".csv")) {
        throw new Error(`CSV source must end in .csv: ${source}`);
    }

    if (!file.path) {
        throw new Error(
            "Unable to resolve a CSV source without a Markdown file path.",
        );
    }

    const fileDirectory = path.dirname(file.path);
    const csvPath = path.resolve(fileDirectory, source);

    if (!existsSync(csvPath)) {
        throw new Error(`CSV file not found: ${csvPath}`);
    }

    const fileRelativePath = path.relative(fileDirectory, csvPath);
    const contentRelativePath = path.relative(contentDirectory, csvPath);
    const realCsvPath = getRealPath(file, csvPath);
    const realFileDirectory = getRealPath(file, fileDirectory);
    const realContentDirectory = getRealPath(file, contentDirectory);

    if (
        isOutsideDirectory(fileRelativePath) ||
        isOutsideDirectory(contentRelativePath) ||
        isOutsideDirectory(path.relative(realFileDirectory, realCsvPath)) ||
        isOutsideDirectory(path.relative(realContentDirectory, realCsvPath))
    ) {
        throw new Error(
            `CSV source must be inside the current file directory: ${source}`,
        );
    }

    return csvPath;
};

export { getCsvPath };
