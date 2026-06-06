#!/usr/bin/env node
import { chmod, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = resolve(rootDir, "src");
const outDir = resolve(rootDir, "dist");
const sources = ["types.ts", "openapi.ts", "remote-openapi.ts", "generator.ts", "cli.ts"];
const checkOnly = process.argv.includes("--check");

if (!checkOnly) {
  await rm(outDir, { force: true, recursive: true });
  await mkdir(outDir, { recursive: true });
}

for (const sourceFile of sources) {
  const sourcePath = resolve(srcDir, sourceFile);
  const outPath = resolve(outDir, basename(sourceFile, ".ts") + ".js");
  const source = await readFile(sourcePath, "utf8");
  const result = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ES2022,
      esModuleInterop: true,
      verbatimModuleSyntax: false,
    },
    fileName: sourcePath,
    reportDiagnostics: true,
  });

  if (result.diagnostics?.length) {
    const host = {
      getCanonicalFileName: (fileName) => fileName,
      getCurrentDirectory: () => rootDir,
      getNewLine: () => "\n",
    };
    const message = ts.formatDiagnosticsWithColorAndContext(result.diagnostics, host);
    console.error(message);
    process.exitCode = 1;
    continue;
  }

  if (!checkOnly) {
    await writeFile(outPath, result.outputText, "utf8");
  }
}

if (!checkOnly) {
  await chmod(resolve(outDir, "cli.js"), 0o755);
} else if (!process.exitCode) {
  console.log(`Checked ${sources.length} TypeScript source files.`);
}
