import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import ts from "typescript";
import { loadTsModule } from "./helpers/load-ts-module.mjs";

test("generated server forwards cookie parameters", async () => {
  const outDir = await mkdtemp(join(tmpdir(), "api-to-mcp-cookie-generator-test-"));

  try {
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
  } finally {
    await rm(outDir, { recursive: true, force: true });
  }
});

test("generated server handles MCP initialize, tools/list, and tools/call over stdio", async () => {
  await loadTsModule("src/openapi.ts");
  const { generateMcpServerFromSpec } = await loadTsModule("src/generator.ts");
  const outDir = await mkdtemp(join(tmpdir(), "api-to-mcp-protocol-generator-test-"));
  const baseUrl = "https://api.example.test";
  let serverProcess;

  try {
    await generateMcpServerFromSpec({
      spec: {
        openapi: "3.0.3",
        info: { title: "Protocol Fixture", version: "1.0.0" },
        servers: [{ url: baseUrl }],
        paths: {
          "/pets": {
            get: {
              operationId: "listPets",
              summary: "List pets",
              parameters: [
                {
                  name: "limit",
                  in: "query",
                  schema: { type: "integer" },
                },
              ],
              responses: { "200": { description: "ok" } },
            },
          },
        },
      },
      outDir,
    });

    await transpileGeneratedServer(outDir);
    serverProcess = startGeneratedServer(outDir, baseUrl);

    const initialize = await serverProcess.request("initialize", {
      protocolVersion: "2025-03-26",
      capabilities: {},
      clientInfo: { name: "test-client", version: "0.0.0" },
    });
    assert.equal(initialize.result.serverInfo.name, "protocol-fixture");

    const list = await serverProcess.request("tools/list");
    assert.deepEqual(
      list.result.tools.map((tool) => tool.name),
      ["list_pets"],
    );

    const call = await serverProcess.request("tools/call", {
      name: "list_pets",
      arguments: { limit: 2 },
    });
    assert.equal(call.result.content[0].type, "text");
    assert.deepEqual(JSON.parse(call.result.content[0].text), {
      method: "GET",
      url: "https://api.example.test/pets?limit=2",
    });
  } finally {
    serverProcess?.stop();
    await rm(outDir, { recursive: true, force: true });
  }
});

async function transpileGeneratedServer(outDir) {
  const sourcePath = resolve(outDir, "src/index.ts");
  const outputPath = resolve(outDir, "dist/index.js");
  const source = await readFile(sourcePath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ES2022,
    },
    fileName: sourcePath,
  }).outputText;

  await mkdir(resolve(outDir, "dist"), { recursive: true });
  await writeFile(outputPath, output, "utf8");
  await writeFile(
    resolve(outDir, "mock-fetch.mjs"),
    `globalThis.fetch = async (url, init = {}) => {
  return new Response(JSON.stringify({
    method: init.method,
    url: String(url)
  }), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
};
`,
    "utf8",
  );
}

function startGeneratedServer(outDir, baseUrl) {
  const child = spawn(process.execPath, [
    "--import",
    resolve(outDir, "mock-fetch.mjs"),
    resolve(outDir, "dist/index.js"),
  ], {
    cwd: outDir,
    env: {
      ...process.env,
      API_BASE_URL: baseUrl,
    },
    stdio: ["pipe", "pipe", "pipe"],
  });
  let nextId = 1;
  let outputBuffer = "";
  let stderr = "";
  const pending = new Map();

  child.stdout.setEncoding("utf8");
  child.stdout.on("data", (chunk) => {
    outputBuffer += chunk;

    while (true) {
      const lineEnd = outputBuffer.indexOf("\n");
      if (lineEnd === -1) {
        break;
      }

      const line = outputBuffer.slice(0, lineEnd).trim();
      outputBuffer = outputBuffer.slice(lineEnd + 1);
      if (!line) {
        continue;
      }

      const message = JSON.parse(line);
      const waiter = pending.get(message.id);
      if (waiter) {
        pending.delete(message.id);
        clearTimeout(waiter.timeout);
        waiter.resolve(message);
      }
    }
  });

  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });

  child.on("exit", (code, signal) => {
    for (const [id, waiter] of pending) {
      pending.delete(id);
      clearTimeout(waiter.timeout);
      waiter.reject(new Error(`Generated server exited early: code=${code} signal=${signal} stderr=${stderr}`));
    }
  });

  return {
    request(method, params = {}) {
      const id = nextId++;

      return new Promise((resolveRequest, rejectRequest) => {
        const timeout = setTimeout(() => {
          pending.delete(id);
          rejectRequest(new Error(`Timed out waiting for ${method}. stderr=${stderr}`));
        }, 5000);

        pending.set(id, { resolve: resolveRequest, reject: rejectRequest, timeout });
        child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`);
      });
    },
    stop() {
      child.kill();
    },
  };
}
