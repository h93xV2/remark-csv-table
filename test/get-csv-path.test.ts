import { afterEach, describe, expect, it, spyOn } from "bun:test";
import {
    mkdirSync,
    mkdtempSync,
    rmSync,
    symlinkSync,
    writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type { LeafDirective } from "mdast-util-directive";
import { VFile } from "vfile";
import { getCsvPath } from "../src/get-csv-path";

const temporaryDirectories: string[] = [];

const createFixture = () => {
    const directory = mkdtempSync(path.join(tmpdir(), "remark-csv-table-"));
    const contentDirectory = path.join(directory, "content");
    const postDirectory = path.join(contentDirectory, "post");
    const markdownPath = path.join(postDirectory, "post.md");

    mkdirSync(postDirectory, { recursive: true });
    writeFileSync(markdownPath, "# Post\n");
    temporaryDirectories.push(directory);

    return { contentDirectory, directory, markdownPath, postDirectory };
};

const csvDirective = (src?: unknown) =>
    ({
        type: "leafDirective",
        name: "csv",
        attributes: src === undefined ? {} : { src },
        children: [],
    }) as LeafDirective;

afterEach(() => {
    for (const directory of temporaryDirectories.splice(0)) {
        rmSync(directory, { force: true, recursive: true });
    }
});

describe("getCsvPath", () => {
    it("requires a CSV src attribute", () => {
        const { contentDirectory, markdownPath } = createFixture();

        expect(() =>
            getCsvPath(
                csvDirective(),
                new VFile({ path: markdownPath }),
                contentDirectory,
            ),
        ).toThrow("The csv directive requires a src attribute.");
    });

    it("requires CSV sources", () => {
        const { contentDirectory, markdownPath } = createFixture();

        expect(() =>
            getCsvPath(
                csvDirective("./table.txt"),
                new VFile({ path: markdownPath }),
                contentDirectory,
            ),
        ).toThrow("CSV source must end in .csv: ./table.txt");
    });

    it("requires a Markdown file path", () => {
        const { contentDirectory } = createFixture();

        expect(() =>
            getCsvPath(
                csvDirective("./table.csv"),
                new VFile(),
                contentDirectory,
            ),
        ).toThrow(
            "Unable to resolve a CSV source without a Markdown file path.",
        );
    });

    it("rejects CSV files outside the post directory", () => {
        const { contentDirectory, markdownPath } = createFixture();

        writeFileSync(
            path.join(contentDirectory, "table.csv"),
            "header\nvalue\n",
        );

        expect(() =>
            getCsvPath(
                csvDirective("../table.csv"),
                new VFile({ path: markdownPath }),
                contentDirectory,
            ),
        ).toThrow(
            "CSV source must be inside the current file directory: ../table.csv",
        );
    });

    it("rejects posts outside the content directory", () => {
        const { contentDirectory, directory } = createFixture();
        const postDirectory = path.join(directory, "outside-post");
        const markdownPath = path.join(postDirectory, "post.md");

        mkdirSync(postDirectory);
        writeFileSync(markdownPath, "# Post\n");
        writeFileSync(path.join(postDirectory, "table.csv"), "header\nvalue\n");

        expect(() =>
            getCsvPath(
                csvDirective("./table.csv"),
                new VFile({ path: markdownPath }),
                contentDirectory,
            ),
        ).toThrow(
            "CSV source must be inside the current file directory: ./table.csv",
        );
    });

    it("allows nested CSV files in the file directory", () => {
        const { contentDirectory, markdownPath, postDirectory } =
            createFixture();
        const csvPath = path.join(postDirectory, "data", "table.csv");

        mkdirSync(path.dirname(csvPath));
        writeFileSync(csvPath, "header\nvalue\n");

        expect(
            getCsvPath(
                csvDirective("./data/table.csv"),
                new VFile({ path: markdownPath }),
                contentDirectory,
            ),
        ).toBe(csvPath);
    });

    it("allows in-directory filenames beginning with two dots", () => {
        const { contentDirectory, markdownPath, postDirectory } =
            createFixture();
        const csvPath = path.join(postDirectory, "..report.csv");

        writeFileSync(csvPath, "header\nvalue\n");

        expect(
            getCsvPath(
                csvDirective("./..report.csv"),
                new VFile({ path: markdownPath }),
                contentDirectory,
            ),
        ).toBe(csvPath);
    });

    it("rejects CSV symlinks that escape the post directory", () => {
        const { contentDirectory, directory, markdownPath, postDirectory } =
            createFixture();
        const externalCsvPath = path.join(directory, "external.csv");

        writeFileSync(externalCsvPath, "header\nvalue\n");
        symlinkSync(externalCsvPath, path.join(postDirectory, "table.csv"));

        expect(() =>
            getCsvPath(
                csvDirective("./table.csv"),
                new VFile({ path: markdownPath }),
                contentDirectory,
            ),
        ).toThrow(
            "CSV source must be inside the current file directory: ./table.csv",
        );
    });

    it("rejects CSV files beneath symlinked directories", () => {
        const { contentDirectory, directory, markdownPath, postDirectory } =
            createFixture();
        const externalDirectory = path.join(directory, "external");

        mkdirSync(externalDirectory);
        writeFileSync(
            path.join(externalDirectory, "table.csv"),
            "header\nvalue\n",
        );
        symlinkSync(externalDirectory, path.join(postDirectory, "data"), "dir");

        expect(() =>
            getCsvPath(
                csvDirective("./data/table.csv"),
                new VFile({ path: markdownPath }),
                contentDirectory,
            ),
        ).toThrow(
            "CSV source must be inside the current file directory: ./data/table.csv",
        );
    });

    it("rejects broken CSV symlinks", () => {
        const { contentDirectory, directory, markdownPath, postDirectory } =
            createFixture();

        symlinkSync(
            path.join(directory, "missing.csv"),
            path.join(postDirectory, "table.csv"),
        );

        expect(() =>
            getCsvPath(
                csvDirective("./table.csv"),
                new VFile({ path: markdownPath }),
                contentDirectory,
            ),
        ).toThrow(
            `CSV file not found: ${path.join(postDirectory, "table.csv")}`,
        );
    });

    it("rejects missing CSV files without writing to stderr", () => {
        const { contentDirectory, markdownPath } = createFixture();
        const consoleError = spyOn(console, "error").mockImplementation(
            () => {},
        );

        try {
            expect(() =>
                getCsvPath(
                    csvDirective("./missing.csv"),
                    new VFile({ path: markdownPath }),
                    contentDirectory,
                ),
            ).toThrow();
            expect(consoleError).not.toHaveBeenCalled();
        } finally {
            consoleError.mockRestore();
        }
    });
});
