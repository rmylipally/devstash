---
name: list-components
description: List React component files in a project and summarize each component. Use when the user asks to list, inventory, audit, or summarize components under a components directory, optionally scoped to a subdirectory.
---

# List Components

List React component files and provide a concise inventory.

## Workflow

1. Determine the component root.
   - Default to `src/components` when it exists.
   - If the user provides a subdirectory or path, scope the search to that path under the component root when possible.
   - If the repo uses a different obvious components directory, use that and mention it.
2. Find component files with `rg --files`, limited to `.tsx`, `.ts`, `.jsx`, and `.js`.
3. Exclude generated, build, dependency, and test-only paths unless the user explicitly asks for them:
   - `node_modules`
   - `.next`
   - `dist`
   - `build`
   - `coverage`
   - files matching `*.test.*`, `*.spec.*`, or `*.stories.*`
4. Read only enough of each file to infer what it does. Prefer component names, exported symbols, props, surrounding folder names, and visible JSX structure.
5. If no components are found, say `No components found.`

## Output Format

Return:

- A numbered list of relative file paths.
- A brief one-line description for each file.
- A summary count at the end.

Keep descriptions practical and avoid over-explaining implementation details.
