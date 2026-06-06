import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");
const specPath = resolve(rootDir, "examples/deepseek/openapi.json");
const generatedDir = process.env.DEEPSEEK_MCP_OUT
  ? resolve(process.env.DEEPSEEK_MCP_OUT)
  : resolve(rootDir, ".tmp/deepseek-smoke");

const apiKey = process.env.DEEPSEEK_API_KEY;
if (!apiKey) {
  throw new Error("Set DEEPSEEK_API_KEY before running this smoke test.");
}

function run(command, args, options = {}) {
  console.log(`Running: ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    cwd: rootDir,
    stdio: "inherit",
    ...options,
  });

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed with status ${result.status}`);
  }
}

rmSync(generatedDir, { recursive: true, force: true });
mkdirSync(generatedDir, { recursive: true });

run("node", ["dist/cli.js", "generate", specPath, "--out", generatedDir]);

async function transpileGeneratedServer() {
  console.log("Transpiling generated MCP server...");
  const ts = await import("typescript");
  const sourcePath = resolve(generatedDir, "src/index.ts");
  const outputPath = resolve(generatedDir, "dist/index.js");
  const source = readFileSync(sourcePath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ES2022,
    },
  });

  mkdirSync(resolve(generatedDir, "dist"), { recursive: true });
  writeFileSync(outputPath, output.outputText, "utf8");
}

await transpileGeneratedServer();

function withTimeout(promise, label, ms = 30000) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function createMcpClient() {
  const child = spawn(process.execPath, [resolve(generatedDir, "dist/index.js")], {
    cwd: generatedDir,
    env: {
      ...process.env,
      API_BASE_URL: "https://api.deepseek.com",
      API_BEARER_TOKEN: apiKey,
    },
  });

  let nextId = 1;
  let buffer = Buffer.alloc(0);
  const pending = new Map();
  const stderrChunks = [];

  child.stderr.on("data", (chunk) => {
    stderrChunks.push(Buffer.from(chunk));
  });

  child.stdout.on("data", (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
    drainMessages();
  });

  child.on("exit", (code, signal) => {
    const stderr = Buffer.concat(stderrChunks).toString("utf8");
    const error = new Error(`MCP server exited with code ${code ?? "null"} signal ${signal ?? "null"}\n${stderr}`);
    for (const { reject } of pending.values()) {
      reject(error);
    }
    pending.clear();
  });

  function drainMessages() {
    while (true) {
      const lineEnd = buffer.indexOf("\n");
      if (lineEnd === -1) {
        return;
      }

      const raw = buffer.subarray(0, lineEnd).toString("utf8").replace(/\r$/, "");
      buffer = buffer.subarray(lineEnd + 1);
      const message = JSON.parse(raw);

      if (message.id !== undefined && pending.has(message.id)) {
        const { resolve: resolvePending, reject } = pending.get(message.id);
        pending.delete(message.id);

        if (message.error) {
          reject(new Error(JSON.stringify(message.error)));
        } else {
          resolvePending(message.result);
        }
      }
    }
  }

  function send(message) {
    child.stdin.write(`${JSON.stringify(message)}\n`);
  }

  function request(method, params) {
    const id = nextId;
    nextId += 1;

    const promise = new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
    });

    send({
      jsonrpc: "2.0",
      id,
      method,
      params,
    });

    return promise;
  }

  function notify(method, params = {}) {
    send({
      jsonrpc: "2.0",
      method,
      params,
    });
  }

  async function close() {
    child.kill();
  }

  function stderr() {
    return Buffer.concat(stderrChunks).toString("utf8");
  }

  return { request, notify, close, stderr };
}

const client = createMcpClient();

async function mcpRequest(method, params, label, ms) {
  try {
    return await withTimeout(client.request(method, params), label, ms);
  } catch (error) {
    throw new Error(`${error.message}\nGenerated server stderr:\n${client.stderr()}`);
  }
}

try {
  console.log("Connecting to generated MCP server...");
  await mcpRequest(
    "initialize",
    {
      protocolVersion: "2025-03-26",
      capabilities: {},
      clientInfo: {
        name: "api-to-mcp-smoke",
        version: "0.1.0",
      },
    },
    "MCP initialize",
  );
  client.notify("notifications/initialized");

  console.log("Listing generated tools...");
  const tools = await mcpRequest("tools/list", {}, "MCP tools/list");
  const toolNames = tools.tools.map((tool) => tool.name);
  if (!toolNames.includes("chat_completions")) {
    throw new Error(`Expected chat_completions tool, got: ${toolNames.join(", ")}`);
  }

  console.log("Calling DeepSeek through generated MCP tool...");
  const result = await mcpRequest(
    "tools/call",
    {
      name: "chat_completions",
      arguments: {
        body: {
          model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
          messages: [
            {
              role: "user",
              content: "Reply with exactly: api-to-mcp smoke ok",
            },
          ],
          stream: false,
          temperature: 0,
          max_tokens: 20,
        },
      },
    },
    "MCP callTool",
    60000,
  );

  const text = result.content?.[0]?.text ?? "";
  const parsed = JSON.parse(text);
  const answer = parsed.choices?.[0]?.message?.content ?? "";
  if (!answer.toLowerCase().includes("api-to-mcp smoke ok")) {
    throw new Error(`Unexpected DeepSeek response: ${answer}`);
  }

  console.log("DeepSeek MCP smoke test passed.");
} finally {
  await client.close();
}
