import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function tenantIdFromRequest(req: NextRequest): string | undefined {
  const host = (
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    ""
  )
    .split(":")[0]
    .toLowerCase();
  if (host.endsWith(".inflix.uk")) {
    const sub = host.slice(0, -".inflix.uk".length);
    if (sub && !["www", "api", "platform"].includes(sub)) return sub;
  }
  return undefined;
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid JSON body" }, { status: 400 });
  }

  const tenantId = tenantIdFromRequest(req);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: auth,
  };
  if (tenantId) {
    headers["X-Tenant-Id"] = tenantId;
    headers["Origin"] = `https://${tenantId}.inflix.uk`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch(`${API_BASE}/api/settings/email/test`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
    });
    const text = await res.text();
    return new NextResponse(text || JSON.stringify({ success: false, message: "Empty response" }), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    const aborted = e instanceof Error && e.name === "AbortError";
    return NextResponse.json(
      {
        success: false,
        message: aborted
          ? "SMTP test timed out. Your server may block outbound mail (ports 587/465). Try 587 + TLS or 465 + SSL, or use an email relay (SendGrid/Mailgun)."
          : "Could not reach the email API. Redeploy the backend, then try again.",
      },
      { status: 502 }
    );
  } finally {
    clearTimeout(timer);
  }
}
