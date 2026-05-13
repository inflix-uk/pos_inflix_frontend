import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const runtime = "nodejs";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

async function verifyBearer(authHeader: string | null): Promise<boolean> {
  if (!authHeader?.startsWith("Bearer ")) return false;
  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: authHeader },
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
}

function smtpConfig() {
  const host = process.env.STATEMENT_SMTP_HOST || process.env.SMTP_HOST;
  const port = Number(process.env.STATEMENT_SMTP_PORT || process.env.SMTP_PORT || 587);
  const secureEnv = (process.env.STATEMENT_SMTP_SECURE || "").toLowerCase();
  const secure = secureEnv === "true" || port === 465;
  const user = process.env.STATEMENT_SMTP_USER || process.env.SMTP_USER;
  const pass = process.env.STATEMENT_SMTP_PASS || process.env.SMTP_PASS;
  const from = process.env.STATEMENT_EMAIL_FROM || process.env.SMTP_FROM;
  return { host, port, secure, user, pass, from };
}

export async function POST(req: NextRequest) {
  const ok = await verifyBearer(req.headers.get("authorization"));
  if (!ok) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  let body: {
    to?: string;
    pdfBase64?: string;
    filename?: string;
    accountName?: string;
    accountType?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid JSON body" }, { status: 400 });
  }

  const { to, pdfBase64, filename, accountName, accountType } = body;
  if (!to || !pdfBase64 || !filename) {
    return NextResponse.json(
      { success: false, message: "Missing to, pdfBase64, or filename" },
      { status: 400 }
    );
  }

  const toTrim = String(to).trim();
  if (!/^\S+@\S+\.\S+$/.test(toTrim)) {
    return NextResponse.json({ success: false, message: "Invalid email address" }, { status: 400 });
  }

  const { host, port, secure, user, pass, from } = smtpConfig();
  if (!host || !user || !pass || !from) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Email is not configured. Set STATEMENT_SMTP_HOST, STATEMENT_SMTP_PORT (optional), STATEMENT_SMTP_USER, STATEMENT_SMTP_PASS, STATEMENT_EMAIL_FROM in the server environment (e.g. .env.local). Optional: STATEMENT_SMTP_SECURE=true for SSL.",
      },
      { status: 503 }
    );
  }

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = Buffer.from(String(pdfBase64), "base64");
  } catch {
    return NextResponse.json({ success: false, message: "Invalid PDF data" }, { status: 400 });
  }
  if (pdfBuffer.length < 100) {
    return NextResponse.json({ success: false, message: "PDF attachment is too small or empty" }, { status: 400 });
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  const safeName = (accountName || "Account").replace(/[<>]/g, "");
  const subject = `Account statement — ${safeName}`;

  try {
    await transporter.sendMail({
      from,
      to: toTrim,
      subject,
      text: `Please find your account statement for ${safeName} attached as a PDF.`,
      html: `<p>Please find your account statement for <strong>${safeName}</strong> attached.</p>`,
      attachments: [
        {
          filename: String(filename).replace(/[/\\]/g, "_"),
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to send email";
    return NextResponse.json({ success: false, message: msg }, { status: 502 });
  }

  return NextResponse.json({ success: true, message: "Statement emailed" });
}
