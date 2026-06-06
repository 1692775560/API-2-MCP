export type HttpMethod =
  | "get"
  | "put"
  | "post"
  | "delete"
  | "options"
  | "head"
  | "patch"
  | "trace";

export type JsonSchema = {
  type?: string;
  description?: string;
  enum?: unknown[];
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  additionalProperties?: boolean | JsonSchema;
  format?: string;
  default?: unknown;
};

export type OpenApiSpec = {
  openapi?: string;
  swagger?: string;
  info?: {
    title?: string;
    version?: string;
    description?: string;
  };
  servers?: Array<{ url: string }>;
  paths?: Record<string, Record<string, OpenApiOperation | unknown>>;
  components?: {
    schemas?: Record<string, JsonSchema>;
    securitySchemes?: Record<string, unknown>;
  };
};

export type OpenApiParameter = {
  name: string;
  in: "query" | "header" | "path" | "cookie";
  required?: boolean;
  description?: string;
  schema?: JsonSchema;
};

export type OpenApiOperation = {
  operationId?: string;
  summary?: string;
  description?: string;
  parameters?: OpenApiParameter[];
  requestBody?: {
    required?: boolean;
    content?: Record<string, { schema?: JsonSchema }>;
  };
  responses?: Record<string, unknown>;
  tags?: string[];
};

export type ApiOperation = {
  toolName: string;
  method: HttpMethod;
  path: string;
  summary: string;
  description: string;
  parameters: OpenApiParameter[];
  bodySchema?: JsonSchema;
  bodyRequired: boolean;
  risk: "read" | "write" | "destructive";
};

export type GeneratorOptions = {
  specPath: string;
  outDir: string;
  serverName?: string;
};

export type GenerateFromSpecOptions = {
  spec: OpenApiSpec;
  outDir: string;
  serverName?: string;
  env?: {
    bearerToken?: string;
    apiKey?: string;
    apiKeyHeader?: string;
    baseUrl?: string;
  };
};
