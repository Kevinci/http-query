/**
 * Minimal RFC 10008 (HTTP QUERY) reference example.
 *
 * Demonstrates the smallest possible use of `@kevincii/http-query-client`:
 *   1. initialise a client
 *   2. send a QUERY request with a JSON body
 *   3. read the response
 *   4. handle errors cleanly
 *
 * The client sends the RFC 10008 `QUERY` method first and transparently
 * handles the QUERY → POST → GET fallback chain, so an interop adapter only
 * has to care about the request body and the response — not the wire method.
 *
 * Run with:  npm start   (see README.md for the endpoint setup)
 */
import {
  createClient,
  HttpError,
  NetworkError,
  ParseError,
  TimeoutError,
} from "@kevincii/http-query-client";

/**
 * The JSON body of the QUERY request — the RFC 10008 "query document".
 * Declared as a `type` (not `interface`) so it satisfies the client's
 * `QueryParams` constraint.
 */
type BrokerQuery = {
  stream: string;
  limit: number;
};

/**
 * Shape we expect back from the broker. Keep this loose for interop: an
 * adapter under test may return anything, so we only assert what we read.
 */
interface BrokerQueryResult {
  method?: string;
  body?: BrokerQuery | null;
  [key: string]: unknown;
}

// 1. Initialise a client. `baseUrl` points at the RFC 10008 broker under test;
//    override it with BROKER_URL when pointing at Ayder / another adapter.
const client = createClient({
  baseUrl: process.env.BROKER_URL ?? "http://localhost:3000",
});

async function main(): Promise<void> {
  // The QUERY body: this is what RFC 10008 carries as the request payload.
  const query: BrokerQuery = {
    stream: "events",
    limit: 10,
  };

  try {
    // 2. Send the QUERY request.  `client.query()` issues:
    //      QUERY /broker/query  with the JSON body above,
    //    and falls back to POST, then GET, if the server answers 405/501.
    const result = await client.query<BrokerQueryResult, BrokerQuery>(
      "/broker/query",
      query,
    );

    // 3. Read the response.
    console.log("QUERY /broker/query succeeded.");
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    // 4. Handle errors cleanly using the client's typed error classes.
    if (err instanceof HttpError) {
      console.error(`Broker returned HTTP ${err.status}:`, err.body);
    } else if (err instanceof TimeoutError) {
      console.error("Request timed out before the broker responded.");
    } else if (err instanceof NetworkError) {
      console.error("Network/transport error — is the broker running?", err.message);
    } else if (err instanceof ParseError) {
      console.error("Broker response was not valid JSON:", err.message);
    } else {
      console.error("Unexpected error:", err);
    }
    process.exitCode = 1;
  }
}

void main();
