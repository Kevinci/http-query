// src/index.ts
export * from "@kevincii/http-query-core";
import { createClient } from "@kevincii/http-query-core";
var client = createClient({ fallback: "POST" });
function createBrowserClient(opts = {}) {
  return createClient({ fallback: "POST", ...opts });
}
export {
  client,
  createBrowserClient
};
//# sourceMappingURL=index.mjs.map