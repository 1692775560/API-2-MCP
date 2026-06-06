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
  $ref?: string;
  type?: string;
  description?: string;
  enum?: unknown[];
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  additionalProperties?: boolean | JsonSchema;
  allOf?: JsonSchema[];
  anyOf?: JsonSchema[];
  oneOf?: JsonSchema[];
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
  paths?: Record<string, OpenApiPathItem>;
  components?: {
    schemas?: Record<string, JsonSchema>;
    parameters?: Record<string, OpenApiParameter>;
    requestBodies?: Record<string, OpenApiRequestBody>;
    securitySchemes?: Record<string, unknown>;
  };
};

export type OpenApiReference = {
  $ref: string;
};

export type OpenApiParameter = {
  name: string;
  in: "query" | "header" | "path" | "cookie";
  required?: boolean;
  description?: string;
  schema?: JsonSchema;
};

export type OpenApiRequestBody = {
  required?: boolean;
  content?: Record<string, { schema?: JsonSchema | OpenApiReference }>;
};

export type OpenApiOperation = {
  operationId?: string;
  summary?: string;
  description?: string;
  parameters?: Array<OpenApiParameter | OpenApiReference>;
  requestBody?: OpenApiRequestBody | OpenApiReference;
  responses?: Record<string, unknown>;
  tags?: string[];
};

export type OpenApiPathItem = {
  parameters?: Array<OpenApiParameter | OpenApiReference>;
} & Record<string, OpenApiOperation | Array<OpenApiParameter | OpenApiReference> | unknown>;

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
