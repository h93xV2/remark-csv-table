# remark-csv-table

A Remark plugin that turns local CSV files referenced with Markdown directives into GFM tables at build time.

## Plugin Usage

```typescript
const result = await unified()
    .use(remarkParse)
    .use(remarkDirective)
    .use(remarkGfm)
    .use(remarkCsvTables)
    .use(remarkStringify)
    .process(file);
```
