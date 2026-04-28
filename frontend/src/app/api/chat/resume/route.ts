import { NextRequest } from "next/server";
import { proxySseToBackend } from "../../_proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  return proxySseToBackend(request, "/api/chat/resume");
}
