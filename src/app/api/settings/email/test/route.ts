import { NextRequest, NextResponse } from "next/server";
import { sendTestEmail, type SmtpSettings } from "@/lib/smtpMail";

export const runtime = "nodejs";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type TestBody = {
  testEmail?: string;
  smtpHost?: string;
  smtpPort?: number | string;
  smtpSecure?: string;
  smtpUsername?: string;
  smtpPassword?: string;
  fromEmail?: string;
  fromName?: string;
  replyToEmail?: string;
  replyToName?: string;
};

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

function backendHeaders(auth: string, tenantId?: string): Record<string, string> {
  const headers: Record<string, string> = { Authorization: auth };
  if (tenantId) {
    headers["X-Tenant-Id"] = tenantId;
    headers["Origin"] = `https://${tenantId}.inflix.uk`;
  }
  return headers;
}

async function verifyAuth(auth: string, tenantId?: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: backendHeaders(auth, tenantId),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function loadStoredSettings(auth: string, tenantId?: string): Promise<Partial<SmtpSettings> | null> {
  try {
    const res = await fetch(`${API_BASE}/api/settings/email`, {
      headers: backendHeaders(auth, tenantId),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: Partial<SmtpSettings> };
    return json.data ?? null;
  } catch {
    return null;
  }
}

function buildSettings(body: TestBody, stored: Partial<SmtpSettings> | null): SmtpSettings {
  const portRaw = body.smtpPort ?? stored?.smtpPort ?? 587;
  const port = typeof portRaw === "string" ? parseInt(portRaw, 10) : Number(portRaw);
  const formPassword = String(body.smtpPassword || "").trim();
  const storedPassword = String(stored?.smtpPassword || "").trim();
  const password =
    formPassword && formPassword !== "********" ? formPassword : storedPassword;

  return {
    smtpHost: String(body.smtpHost ?? stored?.smtpHost ?? "").trim(),
    smtpPort: Number.isFinite(port) ? port : 587,
    smtpSecure: (body.smtpSecure ?? stored?.smtpSecure ?? "tls") as SmtpSettings["smtpSecure"],
    smtpUsername: String(body.smtpUsername ?? stored?.smtpUsername ?? "").trim(),
    smtpPassword: password,
    fromEmail: String(body.fromEmail ?? stored?.fromEmail ?? "").trim(),
    fromName: String(body.fromName ?? stored?.fromName ?? "").trim(),
    replyToEmail: String(body.replyToEmail ?? stored?.replyToEmail ?? "").trim() || undefined,
    replyToName: String(body.replyToName ?? stored?.replyToName ?? "").trim() || undefined,
  };
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const tenantId = tenantIdFromRequest(req);
  const ok = await verifyAuth(auth, tenantId);
  if (!ok) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  let body: TestBody;
  try {
    body = (await req.json()) as TestBody;
  } catch {
    return NextResponse.json({ success: false, message: "Invalid JSON body" }, { status: 400 });
  }

  const testEmail = String(body.testEmail || "").trim();
  if (!/^\S+@\S+\.\S+$/.test(testEmail)) {
    return NextResponse.json({ success: false, message: "Enter a valid test email address" }, { status: 400 });
  }

  const stored = await loadStoredSettings(auth, tenantId);
  const settings = buildSettings(body, stored);

  try {
    await sendTestEmail(settings, testEmail);
    return NextResponse.json({
      success: true,
      message: `Test email sent to ${testEmail}`,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to send test email";
    return NextResponse.json({ success: false, message }, { status: 502 });
  }
}
