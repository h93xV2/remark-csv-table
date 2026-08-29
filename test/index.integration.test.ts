import { unified } from "unified";
import { describe, expect, test } from "bun:test";
import remarkCsvTables from "../src";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import remarkDirective from "remark-directive";
import { read } from "to-vfile";
import remarkGfm from "remark-gfm";

describe("remark-csv-tables integration tests", () => {
    test("parses markdown with no directives", async () => {
        const input = "# Hello World"
        const expected = "# Hello World\n"

        const result = await unified()
            .use(remarkParse)
            .use(remarkCsvTables)
            .use(remarkStringify)
            .process(input);

        expect(result.toString()).toBe(expected);
    });

    test("parses markdown with CSV directive", async () => {
        const file = await read('test/data/test.md');
        const expected = "# Hello World\n\n| name | age |\n| ---- | --- |\n| John | 25  |\n| Jane | 30  |\n"

        const result = await unified()
            .use(remarkParse)
            .use(remarkDirective)
            .use(remarkGfm)
            .use(remarkCsvTables)
            .use(remarkStringify)
            .process(file);

        expect(result.toString()).toBe(expected);
    });
});
