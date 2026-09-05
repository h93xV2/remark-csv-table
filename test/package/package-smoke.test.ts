import { expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectDirectory = fileURLToPath(new URL("../../", import.meta.url));
const npm = process.platform === "win32" ? "npm.cmd" : "npm";

const run = (command: string, args: string[], cwd: string) => {
    const result = spawnSync(command, args, { cwd, encoding: "utf8" });

    if (result.status !== 0) {
        throw new Error(
            `${command} ${args.join(" ")} failed:\n${result.stdout}\n${result.stderr}`,
        );
    }

    return result.stdout;
};

test("imports and runs the packed package with Node", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "remark-csv-table-"));

    try {
        const packDirectory = path.join(directory, "pack");
        const consumerDirectory = path.join(directory, "consumer");

        mkdirSync(packDirectory);
        mkdirSync(consumerDirectory);

        const packResult = run(
            npm,
            [
                "pack",
                "--ignore-scripts",
                "--json",
                "--pack-destination",
                packDirectory,
            ],
            projectDirectory,
        );
        const [{ filename }] = JSON.parse(packResult) as [{ filename: string }];
        const tarball = path.join(packDirectory, filename);

        writeFileSync(
            path.join(consumerDirectory, "package.json"),
            JSON.stringify({ private: true, type: "module" }),
        );
        writeFileSync(
            path.join(consumerDirectory, "table.csv"),
            "name,age\nJohn,25\n",
        );

        run(
            npm,
            [
                "install",
                "--ignore-scripts",
                "--no-package-lock",
                tarball,
                "remark-directive@4.0.0",
                "remark-gfm@4.0.1",
                "remark-parse@11.0.0",
                "remark-stringify@11.0.0",
            ],
            consumerDirectory,
        );

        const output = run(
            "node",
            [
                "--input-type=module",
                "--eval",
                `
                    import assert from "node:assert/strict";
                    import { unified } from "unified";
                    import remarkDirective from "remark-directive";
                    import remarkGfm from "remark-gfm";
                    import remarkParse from "remark-parse";
                    import remarkStringify from "remark-stringify";
                    import remarkCsvTables from "remark-csv-table";

                    const result = await unified()
                        .use(remarkParse)
                        .use(remarkDirective)
                        .use(remarkGfm)
                        .use(remarkCsvTables)
                        .use(remarkStringify)
                        .process({
                            path: "post.md",
                            value: '::csv{src="./table.csv"}',
                        });

                    assert.equal(
                        result.toString(),
                        "| name | age |\\n| ---- | --- |\\n| John | 25  |\\n",
                    );
                `,
            ],
            consumerDirectory,
        );

        expect(output).toBe("");
    } finally {
        rmSync(directory, { force: true, recursive: true });
    }
});
