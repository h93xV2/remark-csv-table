import { expect, test } from "bun:test";
import remarkDirective from "remark-directive";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import { read } from "to-vfile";
import { unified } from "unified";
import remarkCsvTables from "../src";

test("parses markdown with no directives", async () => {
    const input = "# Hello World";
    const expected = "# Hello World\n";

    const result = await unified()
        .use(remarkParse)
        .use(remarkCsvTables)
        .use(remarkStringify)
        .process(input);

    expect(result.toString()).toBe(expected);
});

test("parses markdown with CSV directive", async () => {
    const file = await read("test/data/test.md");
    const expected =
        "# Hello World\n\n| name | age |\n| ---- | --- |\n| John | 25  |\n| Jane | 30  |\n";

    const result = await unified()
        .use(remarkParse)
        .use(remarkDirective)
        .use(remarkGfm)
        .use(remarkCsvTables)
        .use(remarkStringify)
        .process(file);

    expect(result.toString()).toBe(expected);
});
