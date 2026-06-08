# API-2-MCP Terminal Demo Animation

Apple Terminal-style Remotion demo for showing API-2-MCP usage in the GitHub README or social previews.

## Preview

```bash
cd docs/remotion-terminal-demo
npm install
npm run preview
```

## Render

```bash
npm run render
```

The MP4 is written to:

```text
docs/remotion-terminal-demo/out/api-to-mcp-terminal-demo.mp4
```

Render a README-friendly poster frame:

```bash
npm run still
```

Generate the README GIF:

```bash
npm run gif
```

The animation shows:

- Installing `@taozhang123/api-to-mcp`
- Generating a TypeScript MCP server from `openapi.json`
- Building and starting the generated server
- Connecting the generated MCP tools to Claude Code and Codex
