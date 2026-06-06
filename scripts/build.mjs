#!/usr/bin/env node
import { chmod, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = resolve(rootDir, "src");
const outDir = resolve(rootDir, "dist");
const sources = ["types.ts", "openapi.ts", "remote-openapi.ts", "generator.ts", "cli.ts"];

await rm(outDir, { force: true, recursive: true });
await mkdir(outDir, { recursive: true });

for (const sourceFile of sources) {
  const sourcePath = resolve(srcDir, sourceFile);
  const outPath = resolve(outDir, basename(sourceFile, ".ts") + ".js");
  const source = await readFile(sourcePath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ES2022,
      moduleResolution: ts.ModuleResolutionKind.NodeNext,
      esModuleInterop: true,
      verbatimModuleSyntax: false,
    },
    fileName: sourcePath,
  }).outputText;

  await writeFile(outPath, output, "utf8");
}

await chmod(resolve(outDir, "cli.js"), 0o755);
