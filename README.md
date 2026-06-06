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

Use `--base-url` when a local OpenAPI spec contains a relative `servers.url`.
OpenAPI 3.x JSON specs are supported; Swagger 2.0 specs should be converted to
OpenAPI 3.x before generation.

For the simple URL + key flow:

```bash
npx api-to-mcp create \
  --url https://api.example.com/openapi.json \
  --key your_api_key \
  --out ./my-mcp-server
```

If `--url` is a base URL instead of an OpenAPI JSON URL, `api-to-mcp` will try
common discovery paths such as `/openapi.json`, `/swagger.json`, `/v3/api-docs`,
and `/.well-known/openapi.json`.

For API-key headers instead of bearer auth:

```bash
npx api-to-mcp create \
  --url https://api.example.com/openapi.json \
  --auth api-key \
  --key your_api_key \
  --key-header x-api-key \
  --out ./my-mcp-server
```

The generated project gets a ready `.env` file plus an `openapi.json` copy.
Use `--timeout-ms` to change the per-request OpenAPI discovery timeout.

## Roadmap

- YAML input
- Postman collections
- OAuth helpers
- Tool allowlists
- Smoke tests for generated tools
- Python runtime
