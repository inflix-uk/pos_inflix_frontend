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
  const target = `${agentBaseOrigin(u)}/status?format=json`;
  try {
    const r = await fetch(target, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    const text = await r.text();
    try {
      const json = JSON.parse(text) as unknown;
      return NextResponse.json(json, { status: r.ok ? 200 : r.status });
    } catch {
      return NextResponse.json(
        { error: "Agent did not return JSON", status: r.status },
        { status: 502 }
      );
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: "Cannot reach print agent from Next.js server", detail: msg },
      { status: 502 }
    );
  }
}
