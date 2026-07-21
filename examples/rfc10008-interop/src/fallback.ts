/**
 * RFC 10008 fallback example — what happens when QUERY is *not* supported.
 *
 * This is fully self-contained: it starts a tiny local HTTP server that
 * REJECTS the `QUERY` method with `405 Method Not Allowed`, then runs the
 * client against it. The client's built-in QUERY → POST → GET fallback chain
 * kicks in automatically, so `client.query()` still succeeds — just over POST.
 *
 * It proves the point an interop adapter cares about: you write one
 * `client.query()` call and the wire method is negotiated for you.
 *
 * Run with:  npm run start:fallback
 * No external services required.
 */
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { createClient, HttpError } from "@kevincii/http-query-client";

type BrokerQuery = {
  stream: string;
  limit: number;
};

/**
 * A broker that does NOT implement RFC 10008 QUERY. It answers:
 *   - QUERY  → 405 Method Not Allowed   (forces the client to fall back)
 *   - POST   → 200 with the echoed body (the fallback the client lands on)
 *   - GET    → 200                       (the final safety-net fallback)
 */
function startLegacyBroker(): Promise<{ url: string; close: () => Promise<void> }> {
  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    if (req.method === "QUERY") {
      // Pretend this server predates RFC 10008.
      res.writeHead(405, { "Content-Type": "application/json", Allow: "POST, GET" });
      res.end(JSON.stringify({ error: "QUERY not supported" }));
      return;
    }

    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          servedBy: req.method, // <- which method actually succeeded
          url: req.url,
          body: body ? JSON.parse(body) : null,
        }),
      );
    });
  });

  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      resolve({
        url: `http://127.0.0.1:${port}`,
        close: () => new Promise((done) => server.close(() => done())),
      });
    });
  });
}

async function main(): Promise<void> {
  const broker = await startLegacyBroker();
  console.log(`Legacy broker (rejects QUERY) listening at ${broker.url}`);

  // Default fallback is "POST"; the final GET safety net is always appended.
  const client = createClient({ baseUrl: broker.url });

  const query: BrokerQuery = { stream: "events", limit: 10 };

  try {
    const result = await client.query<{ servedBy: string; body: BrokerQuery | null }, BrokerQuery>(
      "/broker/query",
      query,
    );

    console.log("client.query() succeeded despite QUERY being rejected.");
    console.log(`  → server served the request via: ${result.servedBy}`);
    console.log(`  → body still delivered intact:    ${JSON.stringify(result.body)}`);

    if (result.servedBy === "POST") {
      console.log("Fallback QUERY → POST confirmed.");
    }
  } catch (err) {
    if (err instanceof HttpError) {
      console.error(`Broker returned HTTP ${err.status}:`, err.body);
    } else {
      console.error("Unexpected error:", err);
    }
    process.exitCode = 1;
  } finally {
    await broker.close();
  }
}

void main();
