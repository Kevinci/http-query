# Kurze, einfache Erklärung — @http-query/client (für Dummies)

Diese Datei erklärt in einfachen Worten, was dieses Paket macht und wie du es nutzt. Keine Vorkenntnisse erforderlich.

## Was ist das?

`@http-query/client` ist eine kleine TypeScript-Bibliothek, die die neue HTTP-Methode `QUERY` (RFC 10008) unterstützt. Sie erlaubt dir, HTTP-Anfragen mit einem JSON-Body zu senden — ähnlich wie `POST`, aber mit einer eigenen Methode.

Ziel der Bibliothek ist es, Entwicklern eine saubere, typsichere und erweiterbare API für `QUERY`-Anfragen zu geben, inklusive:

- Fallbacks (z. B. auf `POST` oder `GET`, wenn `QUERY` nicht unterstützt wird)
- Zeitüberschreitung (Timeout) und Abbruch (Abort)
- Automatische JSON-Verarbeitung (parsen / serialisieren)
- Wiederholungslogik (Retries) für sichere Requests
- Optionaler In-Memory-Cache
- Middleware- und Hook-Systeme zum Einhaken (Logging, Auth, etc.)


## Warum ein Mock-Server? (CORS)

Browser erlauben nicht jede HTTP-Methode automatisch von anderen Domains. Viele öffentliche Demo-APIs (z. B. httpbin.org) erlauben die Methode `QUERY` nicht in ihren CORS-Headern. Deshalb gibt es einen kleinen lokalen Mock-Server, der `QUERY` unterstützt und die nötigen CORS-Header setzt. So funktioniert die Demo im Browser.


## Schnellstart — in 3 Schritten (einfach)

1. Paket installieren:

```bash
cd packages/client
npm install
```

2. Den Mock-Server und die Demo starten (zwei Terminals):

Terminal A — Dev-Server (liefert Demo, rebuilds automatisch):

```bash
npm run dev
# Öffne dann http://localhost:5173
```

Terminal B — Mock-API (CORS-enabled, unterstützt QUERY):

```bash
npm run mock-server
# Mock API läuft auf http://localhost:3000
```

3. Öffne im Browser: http://localhost:5173 und klicke auf "Send QUERY". Die Antwort kommt vom lokalen Mock-Server und wird im Demo-Feld angezeigt.


## Beispiel: So benutzt du die Bibliothek im Code (TypeScript)

Beispiel mit dem Top-Level-Helper `query`:

```ts
import { query } from "@http-query/client";

// Typen optional
const users = await query<{ id: number; name: string }[]>("/users", {
  body: { active: true },
});

console.log(users);
```

Oder mit einem konfigurierten Client:

```ts
import { createClient } from "@http-query/client";

const client = createClient({ baseUrl: "https://api.example.com", fallback: "POST" });

const res = await client.request("/users", { body: { name: "John" } });
```

Wichtige Optionen (kurz):
- `method`: standardmäßig `QUERY` — kann überschrieben werden
- `fallback`: z. B. `"POST"` oder `"GET"` (bei GET wird der Body in Query-Parameter umgewandelt)
- `timeout`: ms, automatische Abbruch der Anfrage
- `retries`: Anzahl der automatischen Wiederholungen (exponentielles Backoff)
- `cache`: `true` für einfachen In-Memory-Cache bei sicheren Anfragen


## Middleware, Hooks und Fehlerbehandlung (sehr kurz)

- `client.middleware.useBefore(fn)` — wird vor dem Abschicken jeder Anfrage ausgeführt
- `client.middleware.useAfter(fn)` — wird nach jeder Response ausgeführt
- Fehlerklassen, die du erwarten kannst:
  - `HttpError` (non-ok HTTP status)
  - `TimeoutError` (Timeout)
  - `NetworkError` (z. B. DNS/Connection)
  - `ParseError` (JSON parse fehlgeschlagen)

Beispiel für ein einfaches Logging-Middleware:

```ts
client.middleware.useBefore(async (init) => {
  console.log('Request:', init.method, init.url);
  return init;
});
```


## Demo-UI (wo was ist)

- `packages/client/demo/index.html` — die kleine Demo-Seite
- `packages/client/demo/main.mjs` — das JS, das die Demo steuert
- `packages/client/scripts/mock-server.js` — lokaler API-Mock (nutze `npm run mock-server`)


## Deployment (GitHub Pages)

Wenn du die Demo veröffentlichen möchtest (GitHub Pages), führe aus:

```bash
cd packages/client
npm run prepare:ghpages
```

Das erzeugt / aktualisiert den Ordner `docs/client/` im Repository. Danach pushst du die Änderungen auf `main` und aktivierst GitHub Pages in den Repository-Einstellungen (Ordner `/docs`). Es gibt auch eine GitHub Actions-Workflowdatei im Projekt, die das automatisch bei Push auf `main` macht.


## Troubleshooting (häufige Probleme)

- CORS-Fehler im Browser: starte `npm run mock-server` — ohne lokalen Mock kann die Demo im Browser scheitern.
- `QUERY` in der echten API: Nicht alle Server unterstützen `QUERY` — prüfe die `OPTIONS`-Antwort (Capability Detection) oder nutze Fallback `POST`.
- Wenn Tests fehlschlagen: `npm test` zeigt die Fehler; normalerweise sind unit tests im `tests/` Ordner.


## Ich will mehr

Wenn du möchtest, kann ich dir helfen bei:
- Automatischem Browser-Reload bei Rebuild (live-reload)
- Erweiterter Demo (Request-Builder, Capability-Checker)
- Release / changesets & npm publishing pipeline


---

Wenn du willst, schreibe ich diese Datei noch in Englisch um oder füge ein kurzes Video/GIF hinzu, das die Demo zeigt. Soll ich das tun?
