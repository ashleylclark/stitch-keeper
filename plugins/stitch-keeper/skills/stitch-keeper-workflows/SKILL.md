---
name: stitch-keeper-workflows
description: Explore a user's self-hosted Stitch Keeper collection by listing or searching yarn, projects, and patterns. Use when answering collection questions, finding materials or patterns, checking project status, or suggesting possibilities from the data already stored in Stitch Keeper. This integration is read-only; do not use it for generic fiber-arts questions that do not need the user's collection.
---

# Stitch Keeper Workflows

Use the Stitch Keeper MCP tools to answer from the user's actual collection. State clearly when an answer is an inference or suggestion rather than stored data.

## Choose the smallest useful tool call

- Use `list-yarn` for inventory summaries, counts, or broad questions about the stash.
- Use `search-yarn` when the request contains a yarn name, brand, color, material, or weight. Pass one concise search term at a time; search is case-insensitive substring matching across those fields.
- Use `list-projects` for project names, statuses, dates, notes, linked pattern IDs, or yarn IDs.
- Use `search-patterns` when the request contains a pattern name, category, difficulty, source, or phrase from notes. Pass one concise search term at a time.

Do not fetch every collection when one targeted tool answers the question. Combine tools when the relationship matters—for example, list projects and yarn when the user asks what yarn a project uses, or search patterns and yarn when exploring whether stored materials appear suitable for a pattern.

## Interpret results carefully

- Treat IDs as relationships: a project's `patternId` refers to a pattern, and its `stashItemIds` refer to yarn entries. Resolve them when doing so helps the user.
- When comparing yarn with pattern requirements, distinguish exact stored matches from likely matches. Consider weight and required quantity when available; do not claim compatibility from color or material alone.
- Mention missing quantities, weights, links, or notes when they prevent a firm answer.
- If a search returns no results, say which term was searched and offer a broader or alternate term. Do not describe an empty result as proof that an item cannot exist under another spelling or field.
- Summarize long results around the user's question. Preserve names and useful distinguishing fields rather than dumping raw JSON unless requested.

## Respect the read-only boundary

The available tools cannot add, edit, delete, reserve, or mark anything complete. If the user asks for a change, explain that limitation and offer to inspect the relevant existing record instead. Never imply that a proposed project or yarn assignment has been saved.

If the MCP server reports an authentication, connectivity, or configuration error, relay the actionable error succinctly. Do not invent collection data or silently replace it with general knowledge.
