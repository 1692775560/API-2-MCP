---
name: api-to-mcp
description: Generate production-ready TypeScript MCP servers from OpenAPI 3.x JSON specs or URLs. Use when the user asks to convert an API/OpenAPI/Swagger document into an MCP server, install API tools for agents, or run api-to-mcp from Codex.
---

# api-to-mcp

Use this skill to generate a TypeScript MCP server from an OpenAPI 3.x JSON spec.

## Decide the mode

- Local spec: use `generate`.
- Remote spec or API base URL: use `create`.
- Swagger 2.0: tell the user to convert it to OpenAPI 3.x first.
- Relative `servers.url` in a local spec: require `--base-url`.

## Commands

From this repository:

```bash
npm install
npm run build
node dist/cli.js generate ./openapi.json --out ./my-mcp-server
node dist/cli.js create --url https://api.example.com/openapi.json --out ./my-mcp-server
```

From GitHub without a local checkout:

```bash
npx --yes @taozhang123/api-to-mcp generate ./openapi.json --out ./my-mcp-server
npx --yes @taozhang123/api-to-mcp create --url https://api.example.com/openapi.json --out ./my-mcp-server
```

## Auth examples

Bearer token:

```bash
node dist/cli.js create --url https://api.example.com/openapi.json --key "$API_TOKEN" --out ./my-mcp-server
```

API key header:

```bash
node dist/cli.js create --url https://api.example.com/openapi.json --auth api-key --key "$API_KEY" --key-header x-api-key --out ./my-mcp-server
```

## After generation

Run:

```bash
cd ./my-mcp-server
npm install
npm run build
npm start
```

Do not print secrets back to the user.
