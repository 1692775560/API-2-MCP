import assert from "node:assert/strict";
import { readFile, rm } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { loadTsModule } from "./helpers/load-ts-module.mjs";

test("generated server forwards cookie parameters", async () => {
  const outDir = resolve("/private/tmp/api-to-mcp-cookie-generator-test");
  await rm(outDir, { recursive: true, force: true });

  const { generateMcpServerFromSpec } = await loadTsModule("src/generator.ts", [
    [
      /import \{\s*extractOperations,[\s\S]*?\} from "\.\/openapi\.mjs";/,
      `function extractOperations() {
        return [{
          toolName: "cookie_tool",
          method: "get",
          path: "/pets",
          summary: "Cookie tool",
          description: "Cookie tool",
          parameters: [{ name: "session", in: "cookie", schema: { type: "string" } }],
          bodyRequired: false,
          risk: "read"
        }];
      }
      function getProjectName() { return "fixture"; }
      function inputSchemaForOperation() {
        return {
          type: "object",
          properties: { session: { type: "string" } },
          required: [],
          additionalProperties: false
        };
      }
      function loadOpenApiSpec() { return {}; }
      function resolveBaseUrl() { return "https://api.example.com"; }`,
    ],
  ]);

  await generateMcpServerFromSpec({
    spec: { openapi: "3.0.3", paths: {} },
    outDir,
  });

  const generated = await readFile(resolve(outDir, "src/index.ts"), "utf8");

  assert.match(generated, /cookieParamNames: \["session"\]/);
  assert.match(generated, /headers\.cookie = cookies\.join/);
});
