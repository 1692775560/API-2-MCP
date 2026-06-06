import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { OpenApiSpec } from "./types.js";

const DISCOVERY_PATHS = [
  "",
  "/openapi.json",
  "/swagger.json",
  "/api-docs",
  "/v3/api-docs",
  "/docs/openapi.json",
  "/.well-known/openapi.json",
];

export async function loadOpenApiSpecFromUrl(
  inputUrl: string,
  auth?: {
    type: "bearer" | "api-key";
    key?: string;
    keyHeader?: string;
  },
): Promise<{
  spec: OpenApiSpec;
  sourceUrl: string;
}> {
  const urls = candidateUrls(inputUrl);
  const errors: string[] = [];

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        headers: {
          accept: "application/json",
          ...authHeaders(auth),
        },
      });

      if (!response.ok) {
        errors.push(`${url}: ${response.status} ${response.statusText}`);
        continue;
      }

      const spec = (await response.json()) as OpenApiSpec;
      if (!spec.paths || (!spec.openapi && !spec.swagger)) {
        errors.push(`${url}: response is JSON but not an OpenAPI spec`);
        continue;
      }

      return { spec, sourceUrl: url };
    } catch (error) {
      errors.push(`${url}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  throw new Error(
    `Could not discover an OpenAPI JSON spec from ${inputUrl}.\nTried:\n${errors
      .map((item) => `- ${item}`)
      .join("\n")}`,
  );
}

export async function saveFetchedSpec(outDir: string, spec: OpenApiSpec): Promise<void> {
  await writeFile(join(outDir, "openapi.json"), `${JSON.stringify(spec, null, 2)}\n`, "utf8");
}

function candidateUrls(inputUrl: string): string[] {
  let parsed: URL;
  try {
    parsed = new URL(inputUrl);
  } catch {
    throw new Error(`Invalid URL: ${inputUrl}`);
  }

  if (/\.(json)$/i.test(parsed.pathname) || parsed.pathname.includes("api-docs")) {
    return [withoutTrailingSlash(parsed)];
  }

  const candidates = DISCOVERY_PATHS.map((path) => {
    const url = new URL(parsed);
    url.pathname = `${url.pathname.replace(/\/$/, "")}${path}`;
    url.search = "";
    url.hash = "";
    return withoutTrailingSlash(url);
  });

  return [...new Set(candidates)];
}

function withoutTrailingSlash(url: URL): string {
  return url.toString().replace(/\/$/, "");
}

function authHeaders(auth?: {
  type: "bearer" | "api-key";
  key?: string;
  keyHeader?: string;
}): Record<string, string> {
  if (!auth?.key) {
    return {};
  }

  if (auth.type === "api-key") {
    return { [auth.keyHeader || "x-api-key"]: auth.key };
  }

  return { authorization: `Bearer ${auth.key}` };
}
