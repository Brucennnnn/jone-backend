# Domain Docs

This repo uses a single-context domain-doc layout.

Expected locations:

- Root project context: `CONTEXT.md`
- Architecture decisions: `docs/adr/`

If `CONTEXT.md` does not exist, infer domain language from the issue, source code, tests, and README-level docs. If `docs/adr/` does not exist, do not assume prior architecture decisions.

For future ADRs, prefer short markdown files under `docs/adr/` with the decision, context, consequences, and status.
