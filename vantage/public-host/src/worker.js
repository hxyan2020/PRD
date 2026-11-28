const ORIGIN = "https://raw.githubusercontent.com/hxyan2020/PRD/gh-pages";

const TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
};

function contentType(path) {
  const dot = path.lastIndexOf(".");
  return TYPES[path.slice(dot)] ?? "application/octet-stream";
}

function upstreamPath(pathname) {
  if (pathname === "/" || pathname.endsWith("/")) {
    return `${pathname.endsWith("/") ? pathname : `${pathname}/`}index.html`;
  }
  return pathname;
}

export default {
  async fetch(request, env) {
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    const url = new URL(request.url);
    const path = upstreamPath(url.pathname);
    const upstream = await fetch(`${ORIGIN}${path}`, {
      headers: { "User-Agent": "VantageMarketIntelligence/1.0" },
    });

    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        "content-type": contentType(path),
        "x-content-type-options": "nosniff",
      },
    });
  },
};
