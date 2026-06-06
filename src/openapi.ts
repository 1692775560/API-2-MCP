import { readFile } from "node:fs/promises";
import type {
  ApiOperation,
  HttpMethod,
  JsonSchema,
  OpenApiOperation,
  OpenApiParameter,
  OpenApiPathItem,
  OpenApiReference,
  OpenApiRequestBody,
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
  assertSupportedOpenApiSpec(spec);

  if (!spec.paths) {
    throw new Error("OpenAPI spec has no paths object.");
  }

  const operations: ApiOperation[] = [];

  for (const [path, maybePathItem] of Object.entries(spec.paths)) {
    const pathItem = maybePathItem as OpenApiPathItem;
    const pathParameters = resolveParameters(spec, pathItem.parameters || []);

    for (const [methodKey, maybeOperation] of Object.entries(pathItem)) {
      const method = methodKey.toLowerCase() as HttpMethod;
      if (!HTTP_METHODS.has(method)) {
        continue;
      }

      const operation = maybeOperation as OpenApiOperation;
      const operationParameters = resolveParameters(spec, operation.parameters || []);
      const parameters = mergeParameters(pathParameters, operationParameters);
      const bodySchema = getJsonBodySchema(spec, operation);
      const requestBody = resolveRequestBody(spec, operation.requestBody);
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
        parameters,
        bodySchema,
        bodyRequired: Boolean(requestBody?.required),
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
  return resolveBaseUrl(spec);
}

export function resolveBaseUrl(spec: OpenApiSpec, sourceUrl?: string): string {
  const serverUrl = spec.servers?.[0]?.url || "https://api.example.com";

  try {
    return new URL(serverUrl).toString().replace(/\/$/, "");
  } catch {
    if (!sourceUrl) {
      throw new Error(`OpenAPI server URL is relative (${serverUrl}). Pass --base-url to generate a runnable server.`);
    }

    return new URL(serverUrl, sourceUrl).toString().replace(/\/$/, "");
  }
}

export function getProjectName(spec: OpenApiSpec, fallback = "generated-mcp-server"): string {
  return slugify(spec.info?.title || fallback);
}

export function assertSupportedOpenApiSpec(spec: OpenApiSpec): void {
  if (spec.swagger) {
    throw new Error("Swagger 2.0 specs are not supported yet. Convert the spec to OpenAPI 3.x before generating.");
  }

  if (!spec.openapi?.startsWith("3.")) {
    throw new Error("Only OpenAPI 3.x JSON specs are supported.");
  }
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

function getJsonBodySchema(spec: OpenApiSpec, operation: OpenApiOperation): JsonSchema | undefined {
  const schema = resolveRequestBody(spec, operation.requestBody)?.content?.["application/json"]?.schema;
  return schema ? dereferenceJsonSchema(spec, schema) : undefined;
}

function resolveParameters(
  spec: OpenApiSpec,
  parameters: Array<OpenApiParameter | OpenApiReference>,
): OpenApiParameter[] {
  return parameters.map((parameter) => dereferenceParameter(spec, parameter));
}

function mergeParameters(
  pathParameters: OpenApiParameter[],
  operationParameters: OpenApiParameter[],
): OpenApiParameter[] {
  const merged = new Map<string, OpenApiParameter>();

  for (const parameter of pathParameters) {
    merged.set(parameterKey(parameter), parameter);
  }

  for (const parameter of operationParameters) {
    merged.set(parameterKey(parameter), parameter);
  }

  return [...merged.values()];
}

function parameterKey(parameter: OpenApiParameter): string {
  return `${parameter.in}:${parameter.name}`;
}

function dereferenceParameter(
  spec: OpenApiSpec,
  parameter: OpenApiParameter | OpenApiReference,
): OpenApiParameter {
  if (!isReference(parameter)) {
    return {
      ...parameter,
      schema: parameter.schema ? dereferenceJsonSchema(spec, parameter.schema) : undefined,
    };
  }

  return dereferenceParameter(spec, resolveLocalRef(spec, parameter.$ref) as OpenApiParameter | OpenApiReference);
}

function resolveRequestBody(
  spec: OpenApiSpec,
  requestBody: OpenApiOperation["requestBody"],
): OpenApiRequestBody | undefined {
  if (!requestBody) {
    return undefined;
  }

  if (isReference(requestBody)) {
    return resolveRequestBody(spec, resolveLocalRef(spec, requestBody.$ref) as OpenApiOperation["requestBody"]);
  }

  return requestBody;
}

function dereferenceJsonSchema(spec: OpenApiSpec, schema: JsonSchema | OpenApiReference): JsonSchema {
  return dereferenceJsonSchemaInner(spec, schema, new Set<string>());
}

function dereferenceJsonSchemaInner(
  spec: OpenApiSpec,
  schema: JsonSchema | OpenApiReference,
  seenRefs: Set<string>,
): JsonSchema {
  if (isReference(schema)) {
    if (seenRefs.has(schema.$ref)) {
      return { $ref: schema.$ref };
    }

    seenRefs.add(schema.$ref);
    return dereferenceJsonSchemaInner(spec, resolveLocalRef(spec, schema.$ref) as JsonSchema | OpenApiReference, seenRefs);
  }

  return {
    ...schema,
    properties: schema.properties
      ? Object.fromEntries(
          Object.entries(schema.properties).map(([key, value]) => [
            key,
            dereferenceJsonSchemaInner(spec, value, new Set(seenRefs)),
          ]),
        )
      : undefined,
    items: schema.items ? dereferenceJsonSchemaInner(spec, schema.items, new Set(seenRefs)) : undefined,
    additionalProperties:
      typeof schema.additionalProperties === "object"
        ? dereferenceJsonSchemaInner(spec, schema.additionalProperties, new Set(seenRefs))
        : schema.additionalProperties,
    allOf: schema.allOf
      ? schema.allOf.map((item) => dereferenceJsonSchemaInner(spec, item, new Set(seenRefs)))
      : undefined,
    anyOf: schema.anyOf
      ? schema.anyOf.map((item) => dereferenceJsonSchemaInner(spec, item, new Set(seenRefs)))
      : undefined,
    oneOf: schema.oneOf
      ? schema.oneOf.map((item) => dereferenceJsonSchemaInner(spec, item, new Set(seenRefs)))
      : undefined,
  };
}

function isReference(value: unknown): value is OpenApiReference {
  return Boolean(value && typeof value === "object" && "$ref" in value);
}

function resolveLocalRef(spec: OpenApiSpec, ref: string): unknown {
  if (!ref.startsWith("#/")) {
    throw new Error(`Only local OpenAPI $ref values are supported: ${ref}`);
  }

  return ref
    .slice(2)
    .split("/")
    .map((segment) => segment.replace(/~1/g, "/").replace(/~0/g, "~"))
    .reduce<unknown>((current, segment) => {
      if (!current || typeof current !== "object" || !(segment in current)) {
        throw new Error(`Could not resolve OpenAPI $ref: ${ref}`);
      }

      return (current as Record<string, unknown>)[segment];
    }, spec);
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
