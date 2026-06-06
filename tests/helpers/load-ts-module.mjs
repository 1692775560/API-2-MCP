import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const tempDir = resolve(rootDir, ".tmp/test-modules", String(process.pid));

export async function loadTsModule(sourcePath, replacements = []) {
  const absoluteSourcePath = resolve(rootDir, sourcePath);
  const outputPath = resolve(tempDir, sourcePath).replace(/\.ts$/, ".mjs");
  const source = await readFile(absoluteSourcePath, "utf8");
  let output = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ES2022,
      verbatimModuleSyntax: false,
    },
  }).outputText;

  output = output.replace(/import\s+type\s+[^;]+;\n/g, "");
  output = output.replace(/from "\.\/([^"]+)\.js"/g, (_match, moduleName) => {
    return `from "./${moduleName}.mjs"`;
  });

  for (const [pattern, replacement] of replacements) {
    output = output.replace(pattern, replacement);
  }

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, output, "utf8");

  return import(`${pathToFileURL(outputPath).href}?t=${Date.now()}-${Math.random()}`);
}
