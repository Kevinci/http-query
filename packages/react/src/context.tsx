import { createContext, createElement, useContext, useMemo, useRef, type ReactNode } from "react";
import { createClient, type CreateClientOptions, type HttpQueryClient } from "@kevincii/http-query-core";
import { QueryCache } from "./cache";

export interface HttpQueryContextValue {
  client: HttpQueryClient;
  cache: QueryCache;
}

const HttpQueryContext = createContext<HttpQueryContextValue | null>(null);

export interface HttpQueryProviderProps {
  /** An existing client. If omitted, one is created from `clientOptions`. */
  client?: HttpQueryClient;
  /** Options used to create a client when `client` is not provided. */
  clientOptions?: CreateClientOptions;
  /** A shared cache. If omitted, one is created for this provider. */
  cache?: QueryCache;
  children: ReactNode;
}

/**
 * Provides the client and shared query cache to all `useHttpQuery*` hooks.
 *
 * @example
 * <HttpQueryProvider clientOptions={{ baseUrl: "/api" }}>
 *   <App />
 * </HttpQueryProvider>
 */
export function HttpQueryProvider(props: HttpQueryProviderProps) {
  const { client, clientOptions, cache, children } = props;

  // Keep identities stable across renders unless inputs change.
  const clientRef = useRef<HttpQueryClient>();
  const resolvedClient = useMemo(() => {
    if (client) return client;
    if (!clientRef.current) clientRef.current = createClient(clientOptions);
    return clientRef.current;
  }, [client, clientOptions]);

  const cacheRef = useRef<QueryCache>();
  const resolvedCache = useMemo(() => {
    if (cache) return cache;
    if (!cacheRef.current) cacheRef.current = new QueryCache();
    return cacheRef.current;
  }, [cache]);

  const value = useMemo<HttpQueryContextValue>(
    () => ({ client: resolvedClient, cache: resolvedCache }),
    [resolvedClient, resolvedCache],
  );

  return createElement(HttpQueryContext.Provider, { value }, children);
}

/** Access the full context (client + cache). Throws outside a provider. */
export function useHttpQueryContext(): HttpQueryContextValue {
  const ctx = useContext(HttpQueryContext);
  if (!ctx) throw new Error("useHttpQuery* must be used within an <HttpQueryProvider>");
  return ctx;
}

/** Access the underlying client. */
export function useHttpQueryClient(): HttpQueryClient {
  return useHttpQueryContext().client;
}

/** Access the shared query cache (for manual invalidation / seeding). */
export function useQueryCache(): QueryCache {
  return useHttpQueryContext().cache;
}
