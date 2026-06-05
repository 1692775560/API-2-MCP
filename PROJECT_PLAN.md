# api-to-mcp Project Plan

## Positioning

`api-to-mcp` turns existing REST APIs into production-ready MCP servers.

The wedge is simple: most teams already have OpenAPI specs, but hand-writing MCP
servers is repetitive and error-prone. This project makes existing APIs usable by
AI agents in minutes.

## Target User

- Developers building internal AI agents
- SaaS teams exposing product APIs to MCP clients
- AI tool builders who need tool-calling over existing REST systems
- Platform teams modernizing legacy APIs for agent workflows

## MVP

The first version should prove one loop:

1. Read an OpenAPI JSON spec.
2. Generate a TypeScript MCP server.
3. Run locally over stdio.
4. Call the backing API with path, query, header, and JSON body parameters.
5. Document risk level for each generated tool.

Current implemented scope:

- OpenAPI JSON input
- TypeScript Node runtime
- MCP stdio server
- API key and bearer token auth
- Path/query/header/body parameter forwarding
- Generated README and `.env.example`
- Read/write/destructive risk labels
- Petstore demo spec

## Differentiators

- Production posture, not just code generation
- Auth templates included by default
- Safety labeling for write/destructive operations
- Generated output is readable and editable
- CLI-first workflow that can fit into existing repos

## Near-Term Roadmap

### 0.2

- YAML input
- Better JSON Schema to Zod conversion
- Endpoint allowlist/denylist
- Generated smoke tests
- Claude Desktop config snippet
- MCP Inspector script

### 0.3

- Postman collection input
- OpenAPI URL input
- OAuth helper templates
- Tool naming customization
- Generate only selected tags or paths

### 0.4

- Python runtime
- Hono/Fastify HTTP transport option
- Built-in audit log hooks
- Rate limiting hooks

## Launch Strategy

Launch with three demos:

- Petstore: simple public demo
- GitHub API: useful developer workflow
- Stripe API: strong "dangerous operations need review" safety story

README headline:

> Generate a production-ready MCP server from any OpenAPI spec in 60 seconds.

Demo flow:

```bash
npx api-to-mcp generate ./openapi.json --out ./my-api-mcp
cd my-api-mcp
npm install
npm run dev
```

Then show the generated tools inside an MCP client.
