const COLLECT_URL = "http://188.166.214.47:3520/collect";

/** Same-origin proxy so HTTPS Vercel never posts mixed-content HTTP to HX. */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Allow", "POST");
    res.end(JSON.stringify({ error: "POST only" }));
    return;
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: "JSON body required" }));
      return;
    }
  }
  if (!body || typeof body !== "object") {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: "JSON body required" }));
    return;
  }

  try {
    const upstream = await fetch(COLLECT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(4000),
    });
    const text = await upstream.text();
    res.statusCode = upstream.status;
    res.setHeader("Content-Type", "application/json");
    res.end(text || '{"ok":true}');
  } catch {
    res.statusCode = 202;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: false }));
  }
}
