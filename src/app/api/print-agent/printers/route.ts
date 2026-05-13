import { NextRequest, NextResponse } from "next/server";
import { agentBaseOrigin, parseAllowedLoopbackAgentBase } from "@/lib/printAgentLoopbackUrl";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const agentBase = req.nextUrl.searchParams.get("agentBase");
  const u = parseAllowedLoopbackAgentBase(agentBase);
  if (!u) {
    return NextResponse.json(
      { error: "Invalid agent URL. Use http://127.0.0.1:PORT or http://localhost:PORT." },
      { status: 400 }
    );
  }
  const token = req.headers.get("x-print-token") || "";
  const headers: HeadersInit = {};
  if (token) headers["X-Print-Token"] = token;
  try {
    const r = await fetch(`${agentBaseOrigin(u)}/printers`, {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(8000),
    });
    const j = (await r.json().catch(() => ({}))) as Record<string, unknown>;
    return NextResponse.json(j, { status: r.status });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg, printers: [] }, { status: 502 });
  }
}
