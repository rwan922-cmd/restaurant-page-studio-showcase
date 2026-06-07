import { createCloudflareOperations } from "../../../src/server/cloudflare-operations";
import type { CloudflareEnv } from "../../../src/server/cloudflare-types";
import { createHttpHandler } from "../../../src/server/http";

type PagesContext = {
  request: Request;
  env: CloudflareEnv;
};

export async function onRequest(context: PagesContext) {
  const handler = createHttpHandler(createCloudflareOperations(context.env));
  return handler(context.request);
}
