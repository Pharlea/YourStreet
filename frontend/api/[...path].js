const BACKEND_BASE_URL = process.env.BACKEND_PROXY_URL || "https://yourstreet.onrender.com";

function buildUpstreamUrl(reqUrl) {
  // req.url already starts with /api/... for this catch-all function.
  return new URL(reqUrl, BACKEND_BASE_URL).toString();
}

function buildUpstreamHeaders(reqHeaders) {
  const headers = { ...reqHeaders };
  delete headers.host;
  delete headers["content-length"];
  delete headers.connection;
  delete headers["x-vercel-id"];
  return headers;
}

export default async function handler(req, res) {
  try {
    const upstreamUrl = buildUpstreamUrl(req.url || "/api");
    const method = req.method || "GET";

    const isBodyMethod = !["GET", "HEAD"].includes(method.toUpperCase());
    const body = isBodyMethod ? JSON.stringify(req.body ?? {}) : undefined;

    const upstreamResponse = await fetch(upstreamUrl, {
      method,
      headers: {
        ...buildUpstreamHeaders(req.headers),
        ...(isBodyMethod ? { "content-type": req.headers["content-type"] || "application/json" } : {}),
      },
      body,
      redirect: "manual",
    });

    res.statusCode = upstreamResponse.status;

    // Forward critical headers used by auth/session and CORS.
    const passthroughHeaders = [
      "content-type",
      "cache-control",
      "location",
      "set-cookie",
      "access-control-allow-origin",
      "access-control-allow-credentials",
      "access-control-allow-methods",
      "access-control-allow-headers",
      "vary",
    ];

    for (const headerName of passthroughHeaders) {
      const headerValue = upstreamResponse.headers.get(headerName);
      if (headerValue) {
        res.setHeader(headerName, headerValue);
      }
    }

    const text = await upstreamResponse.text();
    res.send(text);
  } catch (error) {
    res.status(502).json({
      message: "Proxy error",
      detail: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
