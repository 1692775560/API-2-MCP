import { readFile } from "node:fs/promises";
import type {
  ApiOperation,
  HttpMethod,
  JsonSchema,
  OpenApiOperation,
  OpenApiSpec,
} from "./types.js";

const HTTP_METHODS = new Set<HttpMethod>([
  "get",
  "put",
  "post",
  "delete",
  "options",
  "head",
  "patch",
  "trace",
]);

export async function loadOpenApiSpec(specPath: string): Promise<OpenApiSpec> {
  const raw = await readFile(specPath, "utf8");
  try {
    return JSON.parse(raw) as OpenApiSpec;
  } catch (error) {
    throw new Error(
      `Failed to parse ${specPath}. MVP supports JSON OpenAPI specs only. ${(error as Error).message}`,
    );
  }
}

export function extractOperations(spec: OpenApiSpec): ApiOperation[] {
  if (!spec.paths) {
    throw new Error("OpenAPI spec has no paths object.");
  }

  const operations: ApiOperation[] = [];

  for (const [path, pathItem] of Object.entries(spec.paths)) {
    for (const [methodKey, maybeOperation] of Object.entries(pathItem)) {
      const method = methodKey.toLowerCase() as HttpMethod;
      if (!HTTP_METHODS.has(method)) {
        continue;
      }

      const operation = maybeOperation as OpenApiOperation;
      const bodySchema = getJsonBodySchema(operation);
      const summary = operation.summary || `${method.toUpperCase()} ${path}`;

      operations.push({
        toolName: uniqueToolName(
          operations.map((item) => item.toolName),
          operation.operationId || `${method}_${path}`,
        ),
        method,
        path,
        summary,
        description: operation.description || summary,
        parameters: operation.parameters || [],
        bodySchema,
        bodyRequired: Boolean(operation.requestBody?.required),
        risk: classifyRisk(method),
      });
    }
  }

  if (operations.length === 0) {
    throw new Error("OpenAPI spec has no HTTP operations.");
  }

  return operations;
}

export function getBaseUrl(spec: OpenApiSpec): string {
  return spec.servers?.[0]?.url || "https://api.example.com";
}

export function getProjectName(spec: OpenApiSpec, fallback = "generated-mcp-server"): string {
  return slugify(spec.info?.title || fallback);
}

export function inputSchemaForOperation(operation: ApiOperation): JsonSchema {
  const properties: Record<string, JsonSchema> = {};
  const required: string[] = [];

  for (const parameter of operation.parameters) {
    properties[parameter.name] = {
      ...(parameter.schema || { type: "string" }),
      description: parameter.description,
    };
    if (parameter.required || parameter.in === "path") {
      required.push(parameter.name);
    }
  }

  if (operation.bodySchema) {
    properties.body = {
      ...operation.bodySchema,
      description: "JSON request body.",
    };
    if (operation.bodyRequired) {
      required.push("body");
    }
  }

  return {
    type: "object",
    properties,
    required,
    additionalProperties: false,
  };
}

function getJsonBodySchema(operation: OpenApiOperation): JsonSchema | undefined {
  return operation.requestBody?.content?.["application/json"]?.schema;
}

function classifyRisk(method: HttpMethod): ApiOperation["risk"] {
  if (method === "get" || method === "head" || method === "options") {
    return "read";
  }
  if (method === "delete") {
    return "destructive";
  }
  return "write";
}

function uniqueToolName(existing: string[], seed: string): string {
  const base = slugify(seed).replaceAll("-", "_");
  let candidate = base;
  let index = 2;

  while (existing.includes(candidate)) {
    candidate = `${base}_${index}`;
    index += 1;
  }

  return candidate;
}

function slugify(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/^-?$/, "api");
}
