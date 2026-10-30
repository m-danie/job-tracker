# Documentation

> Last updated 2026-10-30 · reflects commit [`a894636`](https://github.com/m-danie/job-tracker/commit/a894636)

- [Architecture](architecture.md): how a request flows, the two layers of auth, environments
- [Data model](data-model.md): tables, relations and delete behaviour
- [Development](development.md): local setup, env vars, migrations, deploys, roadmap
- [Decision records](adr/README.md): one short file per important decision

## About these docs

This folder is plain Markdown, so it reads the same on GitHub and in
[Obsidian](https://obsidian.md) (open `docs/` as a vault). The shared Obsidian settings in
`.obsidian/` make it write standard Markdown links with relative paths instead of
`[[wikilinks]]`, because GitHub doesn't render wikilinks. Diagrams are
[Mermaid](https://mermaid.js.org), which both render.

### "Last updated" notes

The docs are not updated on every commit. Each file starts with the date it was last
reviewed and the commit it describes:

```markdown
> Last updated 2026-10-30 · reflects commit [`a894636`](https://github.com/m-danie/job-tracker/commit/a894636)
```

The commit is the code the page was checked against, not the commit that changed the
page. Anything newer than that commit may not be covered. To see what changed since:

```bash
git log --oneline a894636..main
```

When you update a page, set both the date and the commit (`git rev-parse --short HEAD`).
