import path from "node:path";
import type { VFile } from "vfile";
import type { LeafDirective } from "mdast-util-directive";

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

  const postDirectory = path.dirname(file.path);
  const csvPath = path.resolve(postDirectory, source);
  const postRelativePath = path.relative(postDirectory, csvPath);
  const contentRelativePath = path.relative(contentDirectory, csvPath);

  if (
    postRelativePath.startsWith("..") ||
    path.isAbsolute(postRelativePath) ||
    contentRelativePath.startsWith("..") ||
    path.isAbsolute(contentRelativePath)
  ) {
    throw new Error(
      `CSV source must be inside the current post directory: ${source}`,
    );
  }

  return csvPath;
};

export { getCsvPath };
