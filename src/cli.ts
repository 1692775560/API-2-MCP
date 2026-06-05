#!/usr/bin/env node
import { Command } from "commander";
import { resolve } from "node:path";
import { generateMcpServer } from "./generator.js";

const program = new Command();

program
  .name("api-to-mcp")
  .description("Generate MCP servers from OpenAPI specs.")
  .version("0.1.0");

program
  .command("generate")
  .description("Generate a TypeScript MCP server from an OpenAPI JSON spec.")
  .argument("<spec>", "Path to an OpenAPI JSON spec.")
  .requiredOption("-o, --out <dir>", "Output directory.")
  .option("-n, --name <name>", "Generated package/server name.")
  .action(async (spec: string, options: { out: string; name?: string }) => {
    await generateMcpServer({
      specPath: resolve(spec),
      outDir: resolve(options.out),
      serverName: options.name,
    });

    console.log(`Generated MCP server at ${resolve(options.out)}`);
  });

program.parseAsync().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
