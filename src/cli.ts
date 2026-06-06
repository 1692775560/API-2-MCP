#!/usr/bin/env node
import { Command } from "commander";
import { resolve } from "node:path";
import { generateMcpServer, generateMcpServerFromSpec } from "./generator.js";
import { loadOpenApiSpecFromUrl, saveFetchedSpec } from "./remote-openapi.js";

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

program
  .command("create")
  .description("Fetch or discover an OpenAPI JSON spec from a URL, then generate a ready-to-run MCP server.")
  .requiredOption("-u, --url <url>", "OpenAPI JSON URL, or an API base URL to probe for common OpenAPI paths.")
  .requiredOption("-o, --out <dir>", "Output directory.")
  .option("-k, --key <key>", "Bearer token or API key to write into the generated .env file.")
  .option("--auth <type>", "Auth type for the generated API client: bearer or api-key.", "bearer")
  .option("--key-header <header>", "Header name to use when --auth api-key is selected.", "x-api-key")
  .option("-n, --name <name>", "Generated package/server name.")
  .option("--base-url <url>", "Override the API base URL used by the generated server.")
  .option("--timeout-ms <ms>", "Timeout in milliseconds for each OpenAPI discovery request.", "10000")
  .action(
    async (options: {
      url: string;
      out: string;
      key?: string;
      auth: "bearer" | "api-key";
      keyHeader: string;
      name?: string;
      baseUrl?: string;
      timeoutMs: string;
    }) => {
      if (options.auth !== "bearer" && options.auth !== "api-key") {
        throw new Error(`Unsupported auth type: ${options.auth}. Use "bearer" or "api-key".`);
      }

      const timeoutMs = Number(options.timeoutMs);
      if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) {
        throw new Error(`Invalid --timeout-ms value: ${options.timeoutMs}`);
      }

      const outDir = resolve(options.out);
      const { spec, sourceUrl } = await loadOpenApiSpecFromUrl(
        options.url,
        {
          type: options.auth,
          key: options.key,
          keyHeader: options.keyHeader,
        },
        { timeoutMs },
      );

      await generateMcpServerFromSpec({
        spec,
        outDir,
        serverName: options.name,
        env: {
          baseUrl: options.baseUrl,
          bearerToken: options.auth === "bearer" ? options.key : undefined,
          apiKey: options.auth === "api-key" ? options.key : undefined,
          apiKeyHeader: options.keyHeader,
        },
      });
      await saveFetchedSpec(outDir, spec);

      console.log(`Fetched OpenAPI spec from ${sourceUrl}`);
      console.log(`Generated MCP server at ${outDir}`);
      console.log("");
      console.log("Next:");
      console.log(`  cd ${JSON.stringify(outDir)}`);
      console.log("  npm install");
      console.log("  npm run build");
      console.log("  npm start");
    },
  );

program.parseAsync().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
