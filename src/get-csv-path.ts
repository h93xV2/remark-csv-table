import path from "node:path";
import type { LeafDirective } from "mdast-util-directive";
import type { VFile } from "vfile";

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
    const fileRelativePath = path.relative(fileDirectory, csvPath);
    const contentRelativePath = path.relative(contentDirectory, csvPath);
    const isOutsideDirectory = (relativePath: string) =>
        relativePath === ".." ||
        relativePath.startsWith(`..${path.sep}`) ||
        path.isAbsolute(relativePath);

    if (
        isOutsideDirectory(fileRelativePath) ||
        isOutsideDirectory(contentRelativePath)
    ) {
        throw new Error(
            `CSV source must be inside the current file directory: ${source}`,
        );
    }

    return csvPath;
};

export { getCsvPath };
