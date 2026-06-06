---
description: Generate an MCP server from an OpenAPI 3.x JSON spec or URL.
argument-hint: "<generate|create> [api-to-mcp options]"
---

Use api-to-mcp to generate a TypeScript MCP server from an OpenAPI 3.x JSON spec.

User arguments:

```text
$ARGUMENTS
```

Behavior:

1. If the user gave no arguments, show concise usage examples and ask for a local OpenAPI JSON path or URL.
2. If the first argument is `generate`, run api-to-mcp against a local spec.
3. If the first argument is `create`, discover/fetch a remote OpenAPI JSON spec and generate the MCP server.
4. If the current repository contains this api-to-mcp project, prefer `node dist/cli.js` after ensuring dependencies are installed and `dist/cli.js` exists. If `dist/cli.js` is missing, run `npm install` if needed, then `npm run build`.
5. If this project is not present locally, use the GitHub package with `npx --yes github:1692775560/API-2-MCP`.
6. Never print API keys or bearer tokens back to the user.
7. Prefer environment variables or the generated `.env` file for secrets. Do not write raw API keys into Claude settings unless the user explicitly asks for that storage location.
8. After generation, tell the user the output path and the exact commands to run the generated MCP server.

Examples:

```bash
api-to-mcp generate ./openapi.json --out ./my-mcp-server
api-to-mcp generate ./openapi.json --base-url https://api.example.com --out ./my-mcp-server
api-to-mcp create --url https://api.example.com/openapi.json --out ./my-mcp-server
api-to-mcp create --url https://api.example.com/openapi.json --auth api-key --key "$API_KEY" --key-header x-api-key --out ./my-mcp-server
```

Implementation notes for the agent:

- Treat `$ARGUMENTS` as the arguments after `/api-to-mcp`.
- Run `api-to-mcp $ARGUMENTS`, where `api-to-mcp` is either `node dist/cli.js` in this repo or `npx --yes github:1692775560/API-2-MCP`.
- OpenAPI 3.x JSON is supported. Swagger 2.0 should be converted before generation.
- If a local spec has relative `servers.url`, ask for or pass `--base-url`.
