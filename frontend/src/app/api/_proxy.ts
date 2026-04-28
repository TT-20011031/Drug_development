import { NextRequest } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:9603";

export async function proxySseToBackend(
  request: NextRequest,
  backendPath: string
) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      }
    );
  }

  const backendResponse = await fetch(`${BACKEND_URL}${backendPath}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
    // 透传客户端 abort 信号，让后端及时停止
    signal: request.signal,
  });

  if (!backendResponse.ok) {
    return new Response(
      JSON.stringify({ error: `Backend error: ${backendResponse.status}` }),
      {
        status: backendResponse.status,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      }
    );
  }

  const stream = backendResponse.body;
  if (!stream) {
    return new Response(JSON.stringify({ error: "No stream" }), {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }

  const backendContentType = backendResponse.headers.get("content-type");
  const contentType =
    backendContentType && backendContentType.includes("charset")
      ? backendContentType
      : "text/event-stream; charset=utf-8";

  return new Response(stream, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
