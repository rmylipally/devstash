# DevStash
A developer knowledge hub for snippets, commands, prompts, notes, files, images, links and custom types.

## Context Files
Read the following to get the full context of the project:
- @context/project-overview.md
- @context/coding-standards.md
- @context/ai-interaction.md
- @context/current-feature.md

## Neon MCP Defaults and Safety

When using the Neon MCP for this project, always use the DevStash Neon project and development branch by default.

- Neon project name: `devstash`
- Neon project ID: `cool-wind-23490836`
- Default database: `neondb`
- Default branch: `development`
- Development branch ID: `br-noisy-cherry-aml49bt3`

Always pass the development `branchId` explicitly when running Neon MCP tools that accept a branch ID.

Never use, query, migrate, compare, reset, or otherwise touch the production branch unless I explicitly ask for production in that specific request.

Production branch details:

- Production branch name: `production`
- Production branch ID: `br-floral-brook-am7qe25i`
- Production is the primary/default Neon branch.

If my request mentions "database" without specifying a branch, assume the development branch. Do not infer production from words like "current", "main", "default", or "live" unless I explicitly say production.

Before running any Neon MCP action against production, stop and ask for confirmation, clearly stating:

- The Neon project ID
- The production branch ID
- The database name
- The exact action or SQL that would run
