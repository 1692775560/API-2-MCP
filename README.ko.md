<p align="center">
  <img src="docs/assets/readme-hero.png" alt="API-2-MCP hero banner" width="100%">
</p>

<h1 align="center">API-2-MCP</h1>

<p align="center">
  <b>OpenAPI 명세에서 실행 가능한 MCP Server를 생성합니다.</b>
</p>

<p align="center">
  REST API를 Claude Code, Codex 및 다른 MCP 클라이언트가 바로 호출할 수 있는 구조화된 도구로 바꿉니다.
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

AI Agent에는 안정적이고 발견하기 쉬운 구조화 도구가 필요합니다. 많은 API는
이미 OpenAPI로 설명되어 있지만, 이를 MCP tool로 직접 감싸는 작업은 반복적이고
오류가 나기 쉽습니다. API-2-MCP는 OpenAPI 3.x JSON 명세를 읽고 입력 schema,
인증 환경 변수, operation-to-tool 매핑을 포함한 TypeScript MCP Server를
생성합니다.

| Input | Output |
| --- | --- |
| OpenAPI 3.x JSON spec | TypeScript MCP Server |
| REST path/query/header/body params | MCP tool input schemas |
| API keys and bearer tokens | `.env`-driven generated clients |
| API operation IDs | Agent-callable MCP tools |
| Local specs or remote URLs | Ready-to-run generated projects |

## Quick Start

GitHub에서 바로 실행:

```bash
npx --yes github:1692775560/API-2-MCP generate ./openapi.json --out ./my-mcp-server
```

원격 URL에서 OpenAPI 명세 가져오기 또는 발견:

```bash
npx --yes github:1692775560/API-2-MCP create \
  --url https://api.example.com/openapi.json \
  --out ./my-mcp-server
```

생성된 MCP Server 실행:

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

내장 예제 생성:

```bash
npm run generate:petstore
npm run generate:deepseek
```

전체 로컬 체크:

```bash
npm run check
```

## CLI

### Generate From A Local Spec

```bash
npx --yes github:1692775560/API-2-MCP generate ./openapi.json --out ./my-mcp-server
```

`servers.url`이 상대 경로라면 `--base-url`을 지정하세요:

```bash
npx --yes github:1692775560/API-2-MCP generate ./openapi.json \
  --base-url https://api.example.com \
  --out ./my-mcp-server
```

### Create From A URL

```bash
npx --yes github:1692775560/API-2-MCP create \
  --url https://api.example.com/openapi.json \
  --out ./my-mcp-server
```

`--url`이 OpenAPI JSON 주소가 아니라 API base URL이라면 API-2-MCP는 다음
discovery path를 시도합니다:

- `/openapi.json`
- `/swagger.json`
- `/v3/api-docs`
- `/.well-known/openapi.json`

### Auth Options

Bearer token:

```bash
npx --yes github:1692775560/API-2-MCP create \
  --url https://api.example.com/openapi.json \
  --key "$API_TOKEN" \
  --out ./my-mcp-server
```

API-key header:

```bash
npx --yes github:1692775560/API-2-MCP create \
  --url https://api.example.com/openapi.json \
  --auth api-key \
  --key "$API_KEY" \
  --key-header x-api-key \
  --out ./my-mcp-server
```

시크릿은 생성된 `.env` 파일에 기록됩니다. API key를 공개 채팅 기록이나 전역
Agent 설정에 붙여 넣지 마세요.

## What It Generates

생성 프로젝트에는 다음이 포함됩니다:

- OpenAPI operation별 MCP tool 등록
- path, query, header, cookie, JSON body에서 생성된 입력 schema
- 환경 변수 기반 API key / bearer token 인증
- 생성 프로젝트용 README와 `.env.example`
- 재현성을 위한 `openapi.json` 복사본
- HTTP method 기반 read/write/destructive 라벨
- stdio로 실행되는 TypeScript MCP Server

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

Claude Code slash command와 Codex skill 설치:

```bash
git clone https://github.com/1692775560/API-2-MCP.git
cd API-2-MCP
npm install
npm run build
npm run install:agent-command
```

Claude Code에서 사용:

```text
/api-to-mcp generate ./openapi.json --out ./my-mcp-server
/api-to-mcp create --url https://api.example.com/openapi.json --out ./my-mcp-server
```

Codex에서는 포함된 skill을 설치한 뒤 같은 인자로 `api-to-mcp` skill을 사용하면
됩니다.

## DeepSeek Example

```bash
npm run build
npm run generate:deepseek
```

라이브 smoke test:

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
