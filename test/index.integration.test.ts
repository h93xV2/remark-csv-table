import { expect, test } from "bun:test";
import remarkDirective from "remark-directive";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import { read } from "to-vfile";
import { unified } from "unified";
import remarkCsvTables from "../src";

const runRemarkCsvTables = async (filePath: string) => {
    const file = await read(filePath);
    const processor = unified()
        .use(remarkParse)
        .use(remarkDirective)
        .use(remarkGfm)
        .use(remarkCsvTables);
    const tree = processor.parse(file);

    await processor.run(tree, file);

    return tree;
};

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

test("preserves inline Markdown and block-looking single-line cell data", async () => {
    const tree = await runRemarkCsvTables("test/data/inline-cells.md");
    const table = tree.children.find((node) => node.type === "table");

    expect(table).toMatchObject({
        type: "table",
        children: [
            {
                children: [
                    { children: [{ type: "text", value: "label" }] },
                    { children: [{ type: "text", value: "link" }] },
                    { children: [{ type: "text", value: "heading" }] },
                    { children: [{ type: "text", value: "list" }] },
                    { children: [{ type: "text", value: "quote" }] },
                ],
            },
            {
                children: [
                    { children: [{ type: "text", value: "Example" }] },
                    {
                        children: [
                            {
                                type: "link",
                                url: "https://example.com",
                                children: [{ type: "text", value: "test" }],
                            },
                        ],
                    },
                    { children: [{ type: "text", value: "# Hello" }] },
                    { children: [{ type: "text", value: "- Item" }] },
                    { children: [{ type: "text", value: "> Note" }] },
                ],
            },
        ],
    });
});

test("rejects CSV cells containing line breaks", () => {
    expect(runRemarkCsvTables("test/data/multiline-cell.md")).rejects.toThrow(
        "CSV cells cannot contain line breaks.",
    );
});
