<p align="center">
  <img src="docs/assets/readme-hero.png" alt="API-2-MCP hero banner" width="100%">
</p>

<h1 align="center">API-2-MCP</h1>

<p align="center">
  <b>Generate production-ready MCP servers from OpenAPI specs.</b>
</p>

<p align="center">
  Turn REST APIs into agent-ready tools for Claude Code, Codex, and other MCP clients.
</p>

<p align="center">
  <a href="https://github.com/1692775560/API-2-MCP/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/1692775560/API-2-MCP/ci.yml?branch=main&label=CI&style=for-the-badge" alt="CI status"></a>
  <img src="https://img.shields.io/badge/Node.js-%3E%3D20-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js >=20">
  <img src="https://img.shields.io/badge/OpenAPI-3.x-6BA539?style=for-the-badge&logo=openapiinitiative&logoColor=white" alt="OpenAPI 3.x">
  <img src="https://img.shields.io/badge/MCP-ready-00AEEF?style=for-the-badge" alt="MCP ready">
  <img src="https://img.shields.io/badge/License-MIT-white?style=for-the-badge" alt="MIT license">
</p>

<p align="center">
  <a href="README.md">English</a> ·
  <a href="README.zh-CN.md">简体中文</a> ·
  <a href="README.ja.md">日本語</a> ·
  <a href="README.ko.md">한국어</a> ·
  <a href="README.es.md">Español</a>
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> ·
  <a href="#what-it-generates">What It Generates</a> ·
  <a href="#claude-code--codex">Claude Code & Codex</a> ·
  <a href="#deepseek-example">DeepSeek Example</a> ·
  <a href="#roadmap">Roadmap</a>
</p>

---

## Why API-2-MCP

Modern AI agents need structured tools. Most APIs are already described by
OpenAPI, but wiring them into MCP servers is repetitive and easy to get wrong.
API-2-MCP reads an OpenAPI 3.x JSON spec and generates a runnable TypeScript MCP
server with schemas, auth wiring, and operation-level tools.

| From | To |
| --- | --- |
| OpenAPI 3.x JSON specs | TypeScript MCP servers |
| REST path/query/header/body params | MCP tool input schemas |
| API keys and bearer tokens | `.env`-driven generated clients |
| API operation IDs | Agent-callable MCP tools |
| Local specs or remote URLs | Ready-to-run generated projects |

## Quick Start

Install the CLI, then generate from a local OpenAPI spec:

```bash
npm install -g @taozhang123/api-to-mcp
api-to-mcp generate ./openapi.json --out ./my-mcp-server
```

Fetch or discover a remote OpenAPI spec:

```bash
api-to-mcp create \
  --url https://api.example.com/openapi.json \
  --out ./my-mcp-server
```

Then run the generated MCP server:

```bash
cd ./my-mcp-server
npm install
npm run build
npm start
```

## Install From Source

```bash
git clone https://github.com/1692775560/API-2-MCP.git
cd API-2-MCP
npm install
npm run build
```

Generate the bundled examples:

```bash
npm run generate:petstore
npm run generate:deepseek
```

Run the full local check:

```bash
npm run check
```

## CLI

### Generate From A Local Spec

```bash
api-to-mcp generate ./openapi.json --out ./my-mcp-server
```

Use `--base-url` when the spec contains a relative `servers.url`:

```bash
api-to-mcp generate ./openapi.json \
  --base-url https://api.example.com \
  --out ./my-mcp-server
```

### Create From A URL

```bash
api-to-mcp create \
  --url https://api.example.com/openapi.json \
  --out ./my-mcp-server
```

If `--url` is a base URL instead of an OpenAPI JSON URL, API-2-MCP probes common
discovery paths:

- `/openapi.json`
- `/swagger.json`
- `/v3/api-docs`
- `/.well-known/openapi.json`

### Auth Options

Bearer token:

```bash
api-to-mcp create \
  --url https://api.example.com/openapi.json \
  --key "$API_TOKEN" \
  --out ./my-mcp-server
```

API-key header:

```bash
api-to-mcp create \
  --url https://api.example.com/openapi.json \
  --auth api-key \
  --key "$API_KEY" \
  --key-header x-api-key \
  --out ./my-mcp-server
```

Secrets are written to the generated `.env` file. Avoid pasting API keys into
chat transcripts or global agent settings.

## What It Generates

Generated projects include:

- MCP tool registration for each OpenAPI operation
- Input schemas derived from path, query, header, cookie, and JSON body params
- API key or bearer token auth through environment variables
- A generated README and `.env.example`
- A copied `openapi.json` for reproducibility
- Conservative read/write/destructive labels based on HTTP method
- A TypeScript MCP server that runs over stdio

Example generated project:

```text
my-mcp-server/
  .env.example
  openapi.json
  package.json
  README.md
  src/
    index.ts
```

## Claude Code & Codex

Install the Claude Code slash command and Codex skill:

```bash
git clone https://github.com/1692775560/API-2-MCP.git
cd API-2-MCP
npm install
npm run build
npm run install:agent-command
```

Then use Claude Code:

```text
/api-to-mcp generate ./openapi.json --out ./my-mcp-server
/api-to-mcp create --url https://api.example.com/openapi.json --out ./my-mcp-server
```

For Codex, install the included skill with the same script, then ask Codex to use
the `api-to-mcp` skill with the same arguments.

## DeepSeek Example

Generate a DeepSeek MCP server from the bundled OpenAPI example:

```bash
npm run build
npm run generate:deepseek
```

Run a live smoke test with your own key:

```bash
export DEEPSEEK_API_KEY="sk-..."
npm run smoke:deepseek
```

The smoke test generates a DeepSeek MCP server, starts it over stdio, lists
tools, and calls the generated chat completion tool.

## Supported Specs

| Feature | Status |
| --- | --- |
| OpenAPI 3.x JSON | Supported |
| Local `$ref` resolution | Supported |
| `allOf`, `anyOf`, `oneOf` body schemas | Supported |
| Path-level and operation-level params | Supported |
| Query, path, header, cookie params | Supported |
| Relative server URLs | Supported with `--base-url` or source URL |
| Swagger 2.0 | Not supported |
| YAML input | Planned |

## Development

```bash
npm install
npm run typecheck
npm test
npm run check
```

CI runs on Node.js 20 and 22.

## Roadmap

- YAML input
- Postman collections
- OAuth helpers
- Tool allowlists
- More generated runtime options
- Python runtime
- Published npm package

## License

MIT
