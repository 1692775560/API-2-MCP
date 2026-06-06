<p align="center">
  <img src="docs/assets/readme-hero.png" alt="API-2-MCP hero banner" width="100%">
</p>

<h1 align="center">API-2-MCP</h1>

<p align="center">
  <b>Genera MCP servers listos para producción desde especificaciones OpenAPI.</b>
</p>

<p align="center">
  Convierte APIs REST en herramientas estructuradas para Claude Code, Codex y otros clientes MCP.
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

Los AI agents necesitan herramientas estables, estructuradas y fáciles de
descubrir. Muchas APIs ya están descritas con OpenAPI, pero envolver cada
endpoint como una herramienta MCP manualmente es repetitivo y propenso a
errores. API-2-MCP lee una especificación OpenAPI 3.x en JSON y genera un MCP
Server en TypeScript con schemas de entrada, variables de autenticación y
mapeo de operaciones a herramientas.

| Input | Output |
| --- | --- |
| OpenAPI 3.x JSON spec | TypeScript MCP Server |
| REST path/query/header/body params | MCP tool input schemas |
| API keys and bearer tokens | `.env`-driven generated clients |
| API operation IDs | Agent-callable MCP tools |
| Local specs or remote URLs | Ready-to-run generated projects |

## Quick Start

Ejecutar directamente desde GitHub:

```bash
npx --yes @api2mcp/cli generate ./openapi.json --out ./my-mcp-server
```

Obtener o descubrir una especificación OpenAPI remota:

```bash
npx --yes @api2mcp/cli create \
  --url https://api.example.com/openapi.json \
  --out ./my-mcp-server
```

Ejecutar el MCP Server generado:

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

Generar los ejemplos incluidos:

```bash
npm run generate:petstore
npm run generate:deepseek
```

Ejecutar la verificación local completa:

```bash
npm run check
```

## CLI

### Generate From A Local Spec

```bash
npx --yes @api2mcp/cli generate ./openapi.json --out ./my-mcp-server
```

Usa `--base-url` cuando `servers.url` sea relativo:

```bash
npx --yes @api2mcp/cli generate ./openapi.json \
  --base-url https://api.example.com \
  --out ./my-mcp-server
```

### Create From A URL

```bash
npx --yes @api2mcp/cli create \
  --url https://api.example.com/openapi.json \
  --out ./my-mcp-server
```

Si `--url` es una URL base de API en lugar de un JSON OpenAPI, API-2-MCP prueba
rutas comunes de descubrimiento:

- `/openapi.json`
- `/swagger.json`
- `/v3/api-docs`
- `/.well-known/openapi.json`

### Auth Options

Bearer token:

```bash
npx --yes @api2mcp/cli create \
  --url https://api.example.com/openapi.json \
  --key "$API_TOKEN" \
  --out ./my-mcp-server
```

API-key header:

```bash
npx --yes @api2mcp/cli create \
  --url https://api.example.com/openapi.json \
  --auth api-key \
  --key "$API_KEY" \
  --key-header x-api-key \
  --out ./my-mcp-server
```

Los secretos se escriben en el archivo `.env` generado. No pegues API keys en
transcripciones públicas ni en configuraciones globales de agents.

## What It Generates

El proyecto generado incluye:

- Registro de MCP tools para cada operación OpenAPI
- Schemas de entrada desde path, query, header, cookie y JSON body
- Autenticación por API key o bearer token mediante variables de entorno
- README y `.env.example` generados
- Copia de `openapi.json` para reproducibilidad
- Etiquetas read/write/destructive según el HTTP method
- MCP Server TypeScript que corre por stdio

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

Instalar el slash command de Claude Code y el skill de Codex:

```bash
git clone https://github.com/1692775560/API-2-MCP.git
cd API-2-MCP
npm install
npm run build
npm run install:agent-command
```

Usar en Claude Code:

```text
/api-to-mcp generate ./openapi.json --out ./my-mcp-server
/api-to-mcp create --url https://api.example.com/openapi.json --out ./my-mcp-server
```

En Codex, instala el skill incluido y pide usar `api-to-mcp` con los mismos
argumentos.

## DeepSeek Example

```bash
npm run build
npm run generate:deepseek
```

Smoke test en vivo:

```bash
export DEEPSEEK_API_KEY="sk-..."
npm run smoke:deepseek
```

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
