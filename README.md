# api-to-mcp

Generate a TypeScript MCP server from an OpenAPI spec.

## MVP

```bash
npm install
npm run build
npm run generate:petstore
```

Generated servers include:

- MCP tool registration for each OpenAPI operation
- Input schemas derived from path, query, header, and JSON body params
- API key or bearer token auth via environment variables
- A generated README and `.env.example`
- Conservative read/write risk labels based on HTTP method

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
