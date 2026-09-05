# remark-csv-table

A Remark plugin that turns local CSV files referenced with Markdown directives into GFM tables at build time.

## Requirements

- Node >= 20
- ESM-only import
- A Remark pipeline using remark-directive and remark-gfm

## Installation

```shell
bun add remark-csv-table remark-directive remark-gfm
```

## Plugin Usage

```typescript
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
    .use(remarkCsvTables, { contentDirectory: "content" })
    .use(remarkStringify)
    .process({
        path: "content/posts/example.md",
        value: "::csv{src=\"./table.csv\"}",
    });
```

## Directive Syntax

```markdown
::csv{src="./table.csv"}
```

CSV files must be inside the Markdown file's directory and contentDirectory.

Cells support single-line inline Markdown. Multiline cells are rejected.
