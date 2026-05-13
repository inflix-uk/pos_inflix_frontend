import { NextRequest, NextResponse } from "next/server";
import { agentBaseOrigin, parseAllowedLoopbackAgentBase } from "@/lib/printAgentLoopbackUrl";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const agentBase = req.nextUrl.searchParams.get("agentBase");
  const u = parseAllowedLoopbackAgentBase(agentBase);
  if (!u) {
    return NextResponse.json({ ok: false, error: "Invalid agent URL" }, { status: 400 });
  }
  const token = req.headers.get("x-print-token") || "";
  const headers: HeadersInit = {};
  if (token) headers["X-Print-Token"] = token;
  try {
    const r = await fetch(`${agentBaseOrigin(u)}/health`, {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(5000),
    });
    const j = (await r.json().catch(() => ({}))) as Record<string, unknown>;
    return NextResponse.json(j, { status: r.ok ? 200 : r.status });
  } catch {
    return NextResponse.json({ ok: false }, { status: 502 });
  }
}
