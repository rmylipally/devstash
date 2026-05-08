---
name: research
description: 'Run a named research prompt from context/research to produce source-backed documentation. Use when: research, investigate, document findings, write docs from code.'
argument-hint: '<prompt-name>'
---

# Research

Run the requested research prompt and write documentation from verified project sources.

## Task

Execute research task from the argument.

## Workflow

1. If no argument is provided, stop with: `Usage: /research <prompt-name>`.
2. Treat the argument as a prompt name relative to `context/research/`.
   - Reject absolute paths, `..` segments, and shell metacharacters.
   - Resolve the prompt at `context/research/{argument}.md`.
3. If the prompt file does not exist, stop with: `Prompt file not found at context/research/{argument}.md`.
4. Read the prompt file. It should define:
   - `Output`: documentation path to write
   - `Research`: what to investigate
   - `Include`: details to capture
   - `Sources`: files, directories, tools, or database areas to inspect
5. Gather evidence using the prompt's sources:
   - Search the codebase first.
   - Read relevant source, schema, config, tests, and docs files.
   - Query the database only if the prompt requires it.
6. Write the findings to the requested output path.
7. Summarize what was discovered and list the output file.

## Rules

- Produce documentation only. Do not modify source code, migrations, tests, env files, branches, commits, or generated app behavior.
- Default output should live under `docs/` unless the research prompt explicitly specifies another documentation path.
- If database access is needed, follow the repository AGENTS.md Neon rules: use project `cool-wind-23490836`, database `neondb`, development branch `br-noisy-cherry-aml49bt3`, and never touch production without explicit confirmation.
- Base conclusions on inspected sources. Note assumptions and gaps instead of guessing.
- Include enough source references in the documentation for a future reader to verify the findings.
