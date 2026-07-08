import { createClient } from "../dist/index.mjs";

const out = document.getElementById("out");
const send = document.getElementById("send");
const urlInput = document.getElementById("url");
const bodyInput = document.getElementById("body");
const fallbackEl = document.getElementById("fallback");
const timeoutEl = document.getElementById("timeout");

function log(v) {
  if (out) out.textContent = JSON.stringify(v, null, 2);
}

const client = createClient({ baseUrl: "https://httpbin.org" });

send.addEventListener("click", async () => {
  try {
    const path = urlInput.value;
    let body = null;
    try { body = JSON.parse(bodyInput.value); } catch (e) { alert("Invalid JSON"); return; }
    const fallback = fallbackEl.value || undefined;
    const timeout = Number(timeoutEl.value) || undefined;

    log({ status: "sending..." });
    const res = await client.request(path, { body, method: "QUERY", fallback, timeout });
    log({ status: "ok", response: res });
  } catch (err) {
    log({ error: String(err) });
  }
});

