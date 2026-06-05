# api-to-mcp

Generate a TypeScript MCP server from an OpenAPI spec.

## MVP

```bash
npm install
npm run build
npm run generate:petstore
npm run generate:deepseek
```

Generated servers include:

- MCP tool registration for each OpenAPI operation
- Input schemas derived from path, query, header, and JSON body params
- API key or bearer token auth via environment variables
- A generated README and `.env.example`
- Conservative read/write risk labels based on HTTP method

## DeepSeek Smoke Test

Set `DEEPSEEK_API_KEY` in your shell, then run:

```bash
npm run smoke:deepseek
```

The smoke test generates a DeepSeek MCP server, starts the generated TypeScript
server over stdio, lists its tools, and calls the generated `chat_completions`
MCP tool.

## CLI

```bash
npx api-to-mcp generate ./openapi.json --out ./my-mcp-server
```

## Roadmap

- YAML input
- Postman collections
- OAuth helpers
- Tool allowlists
- Smoke tests for generated tools
- Python runtime
