import { NextRequest, NextResponse } from "next/server";
import { agentBaseOrigin, parseAllowedLoopbackAgentBase } from "@/lib/printAgentLoopbackUrl";

export const runtime = "nodejs";

type Body = {
  agentBase?: string;
  payload?: {
    printerName?: string;
    pdfBase64?: string;
    jobName?: string;
    copies?: number;
    orientation?: "portrait" | "landscape";
    scale?: "noscale" | "shrink" | "fit";
  };
};

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ success: false, message: "Invalid JSON" }, { status: 400 });
  }
  const u = parseAllowedLoopbackAgentBase(body.agentBase);
  if (!u || !body.payload || typeof body.payload !== "object") {
    return NextResponse.json({ success: false, message: "Invalid agent URL or payload" }, { status: 400 });
  }
  const token = req.headers.get("x-print-token") || "";
  try {
    const r = await fetch(`${agentBaseOrigin(u)}/print/pdf`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "X-Print-Token": token } : {}),
      },
      body: JSON.stringify(body.payload),
      signal: AbortSignal.timeout(30000),
    });
    const j = await r.json().catch(() => ({}));
    return NextResponse.json(j, { status: r.status });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ success: false, message: msg }, { status: 502 });
  }
}
