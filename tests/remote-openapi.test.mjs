import assert from "node:assert/strict";
import test from "node:test";
import { loadTsModule } from "./helpers/load-ts-module.mjs";

test("remote loader rejects Swagger 2.0 and keeps discovery errors", async () => {
  await loadTsModule("src/openapi.ts");
  const { loadOpenApiSpecFromUrl } = await loadTsModule("src/remote-openapi.ts");
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    statusText: "OK",
    json: async () => ({
      swagger: "2.0",
      paths: {
        "/pets": {
          get: { responses: {} },
        },
      },
    }),
  });

  try {
    await assert.rejects(
      () => loadOpenApiSpecFromUrl("https://example.com/openapi.json"),
      /Swagger 2\.0 specs are not supported/,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("remote loader passes timeout signal to fetch", async () => {
  await loadTsModule("src/openapi.ts");
  const { loadOpenApiSpecFromUrl } = await loadTsModule("src/remote-openapi.ts");
  const originalFetch = globalThis.fetch;
  let sawSignal = false;

  globalThis.fetch = async (_url, init) => {
    sawSignal = Boolean(init.signal);
    return {
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => ({
        openapi: "3.0.3",
        paths: {
          "/pets": {
            get: { responses: {} },
          },
        },
      }),
    };
  };

  try {
    const result = await loadOpenApiSpecFromUrl("https://example.com/openapi.json", undefined, {
      timeoutMs: 1234,
    });

    assert.equal(result.sourceUrl, "https://example.com/openapi.json");
    assert.equal(sawSignal, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
