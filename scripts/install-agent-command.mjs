#!/usr/bin/env node
import { copyFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const homeDir = homedir();

const installs = [
  {
    label: "Claude Code slash command",
    source: resolve(rootDir, ".claude/commands/api-to-mcp.md"),
    target: resolve(homeDir, ".claude/commands/api-to-mcp.md"),
  },
  {
    label: "Codex skill",
    source: resolve(rootDir, "skills/api-to-mcp/SKILL.md"),
    target: resolve(homeDir, ".codex/skills/api-to-mcp/SKILL.md"),
  },
];

for (const install of installs) {
  await mkdir(dirname(install.target), { recursive: true });
  await copyFile(install.source, install.target);
  console.log(`Installed ${install.label}: ${install.target}`);
}

console.log("");
console.log("Claude Code: use /api-to-mcp generate ./openapi.json --out ./my-mcp-server");
console.log("Codex: ask to use the api-to-mcp skill, then provide the same arguments.");
