import assert from "node:assert/strict";
import test from "node:test";
import { loadTsModule } from "./helpers/load-ts-module.mjs";

test("rejects Swagger 2.0 specs", async () => {
  const { assertSupportedOpenApiSpec } = await loadTsModule("src/openapi.ts");

  assert.throws(
    () => assertSupportedOpenApiSpec({ swagger: "2.0", paths: {} }),
    /Swagger 2\.0 specs are not supported/,
  );
});

test("resolves relative OpenAPI server URLs against source URLs", async () => {
  const { resolveBaseUrl } = await loadTsModule("src/openapi.ts");

  assert.equal(
    resolveBaseUrl(
      {
        openapi: "3.0.3",
        servers: [{ url: "/api" }],
        paths: {},
      },
      "https://example.com/openapi.json",
    ),
    "https://example.com/api",
  );

  assert.throws(
    () =>
      resolveBaseUrl({
        openapi: "3.0.3",
        servers: [{ url: "/api" }],
        paths: {},
      }),
    /Pass --base-url/,
  );
});

test("merges path parameters and dereferences composed body schemas", async () => {
  const { extractOperations, inputSchemaForOperation } = await loadTsModule("src/openapi.ts");

  const spec = {
    openapi: "3.0.3",
    info: { title: "Fixture", version: "1.0.0" },
    components: {
      parameters: {
        Tenant: {
          name: "tenantId",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      },
      schemas: {
        BasePet: {
          type: "object",
          properties: {
            name: { type: "string" },
          },
          required: ["name"],
        },
      },
    },
    paths: {
      "/tenants/{tenantId}/pets": {
        parameters: [{ $ref: "#/components/parameters/Tenant" }],
        post: {
          operationId: "createPet",
          parameters: [
            {
              name: "tenantId",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
            {
              name: "limit",
              in: "query",
              schema: { type: "integer" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  allOf: [{ $ref: "#/components/schemas/BasePet" }],
                },
              },
            },
          },
          responses: {
            "200": { description: "ok" },
          },
        },
      },
    },
  };

  const operation = extractOperations(spec)[0];
  const schema = inputSchemaForOperation(operation);

  assert.equal(operation.parameters.length, 2);
  assert.equal(schema.properties.tenantId.type, "integer");
  assert.equal(schema.properties.body.allOf[0].properties.name.type, "string");
  assert.deepEqual(schema.required.sort(), ["body", "tenantId"]);
});
