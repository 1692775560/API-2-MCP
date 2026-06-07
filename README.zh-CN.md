<p align="center">
  <img src="docs/assets/readme-hero.png" alt="API-2-MCP 主图" width="100%">
</p>

<h1 align="center">API-2-MCP</h1>

<p align="center">
  <b>从 OpenAPI 规范一键生成可运行的 MCP Server。</b>
</p>

<p align="center">
  把 REST API 变成 Claude Code、Codex 和其他 MCP 客户端可以直接调用的结构化工具。
</p>

<p align="center">
  <a href="https://github.com/1692775560/API-2-MCP/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/1692775560/API-2-MCP/ci.yml?branch=main&label=CI&style=for-the-badge" alt="CI 状态"></a>
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
  <a href="#快速开始">快速开始</a> ·
  <a href="#生成内容">生成内容</a> ·
  <a href="#claude-code--codex">Claude Code & Codex</a> ·
  <a href="#deepseek-示例">DeepSeek 示例</a> ·
  <a href="#路线图">路线图</a>
</p>

---

## 为什么需要 API-2-MCP

AI Agent 需要稳定、结构化、可发现的工具。很多服务已经有 OpenAPI
规范，但把每个接口手动包装成 MCP tool 既重复又容易出错。API-2-MCP
读取 OpenAPI 3.x JSON 规范，生成一个可运行的 TypeScript MCP Server，
并自动处理输入 schema、鉴权环境变量和接口到工具的映射。

| 输入 | 输出 |
| --- | --- |
| OpenAPI 3.x JSON 规范 | TypeScript MCP Server |
| REST path/query/header/body 参数 | MCP tool 输入 schema |
| API Key / Bearer Token | 基于 `.env` 的生成客户端 |
| OpenAPI operationId | Agent 可调用工具 |
| 本地 spec 或远程 URL | 可直接运行的生成项目 |

## 快速开始

直接从 GitHub 使用：

```bash
npx --yes @taozhang123/api-to-mcp generate ./openapi.json --out ./my-mcp-server
```

从远程 URL 获取或发现 OpenAPI 规范：

```bash
npx --yes @taozhang123/api-to-mcp create \
  --url https://api.example.com/openapi.json \
  --out ./my-mcp-server
```

运行生成后的 MCP Server：

```bash
cd ./my-mcp-server
npm install
npm run build
npm start
```

## 从源码安装

```bash
git clone https://github.com/1692775560/API-2-MCP.git
cd API-2-MCP
npm install
npm run build
```

生成内置示例：

```bash
npm run generate:petstore
npm run generate:deepseek
```

运行完整本地检查：

```bash
npm run check
```

## CLI 用法

### 从本地 OpenAPI 文件生成

```bash
npx --yes @taozhang123/api-to-mcp generate ./openapi.json --out ./my-mcp-server
```

如果 spec 里的 `servers.url` 是相对路径，请显式传入 `--base-url`：

```bash
npx --yes @taozhang123/api-to-mcp generate ./openapi.json \
  --base-url https://api.example.com \
  --out ./my-mcp-server
```

### 从 URL 创建

```bash
npx --yes @taozhang123/api-to-mcp create \
  --url https://api.example.com/openapi.json \
  --out ./my-mcp-server
```

如果 `--url` 是 API 根地址而不是 OpenAPI JSON 地址，API-2-MCP 会尝试探测：

- `/openapi.json`
- `/swagger.json`
- `/v3/api-docs`
- `/.well-known/openapi.json`

### 鉴权参数

Bearer Token：

```bash
npx --yes @taozhang123/api-to-mcp create \
  --url https://api.example.com/openapi.json \
  --key "$API_TOKEN" \
  --out ./my-mcp-server
```

API Key Header：

```bash
npx --yes @taozhang123/api-to-mcp create \
  --url https://api.example.com/openapi.json \
  --auth api-key \
  --key "$API_KEY" \
  --key-header x-api-key \
  --out ./my-mcp-server
```

密钥会写入生成项目的 `.env` 文件。不要把 API Key 直接粘贴到公开聊天记录
或全局 Agent 配置里。

## 生成内容

生成项目包含：

- 每个 OpenAPI operation 对应的 MCP tool 注册
- path、query、header、cookie、JSON body 参数生成的输入 schema
- 通过环境变量配置的 API Key / Bearer Token 鉴权
- 生成项目自己的 README 和 `.env.example`
- 复制保存的 `openapi.json`，便于复现
- 基于 HTTP method 的 read/write/destructive 风险标签
- 通过 stdio 运行的 TypeScript MCP Server

生成项目结构示例：

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

安装 Claude Code slash command 和 Codex skill：

```bash
git clone https://github.com/1692775560/API-2-MCP.git
cd API-2-MCP
npm install
npm run build
npm run install:agent-command
```

在 Claude Code 中使用：

```text
/api-to-mcp generate ./openapi.json --out ./my-mcp-server
/api-to-mcp create --url https://api.example.com/openapi.json --out ./my-mcp-server
```

Codex 侧会安装同名 skill。安装后让 Codex 使用 `api-to-mcp` skill，并提供同样
的参数即可。

## DeepSeek 示例

使用内置 OpenAPI 示例生成 DeepSeek MCP Server：

```bash
npm run build
npm run generate:deepseek
```

使用你自己的 key 运行在线 smoke test：

```bash
export DEEPSEEK_API_KEY="sk-..."
npm run smoke:deepseek
```

Smoke test 会生成 DeepSeek MCP Server，通过 stdio 启动它，列出 tools，并调用
生成的 chat completion tool。

## 支持范围

| 能力 | 状态 |
| --- | --- |
| OpenAPI 3.x JSON | 已支持 |
| 本地 `$ref` 解析 | 已支持 |
| `allOf`、`anyOf`、`oneOf` body schema | 已支持 |
| path-level 和 operation-level 参数 | 已支持 |
| query、path、header、cookie 参数 | 已支持 |
| 相对 server URL | 通过 `--base-url` 或 source URL 支持 |
| Swagger 2.0 | 暂不支持 |
| YAML 输入 | 计划中 |

## 开发

```bash
npm install
npm run typecheck
npm test
npm run check
```

CI 会在 Node.js 20 和 22 上运行。

## 路线图

- YAML 输入
- Postman Collection
- OAuth 辅助能力
- Tool allowlist
- 更多生成运行时选项
- Python runtime
- 发布 npm package

## 许可证

MIT
