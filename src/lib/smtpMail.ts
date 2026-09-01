import nodemailer from "nodemailer";
import net from "net";
import tls from "tls";

export interface SmtpSettings {
  smtpHost: string;
  smtpPort: number;
  smtpSecure: "none" | "ssl" | "tls";
  smtpUsername: string;
  smtpPassword: string;
  fromEmail: string;
  fromName: string;
  replyToEmail?: string;
  replyToName?: string;
}

function isMaskedPassword(value: string | undefined): boolean {
  const p = String(value || "").trim();
  return !p || p === "********" || /^[*•]+$/.test(p);
}

function normalizeSmtpSecure(port: number, mode: string): "none" | "ssl" | "tls" {
  const m = (mode || "tls").toLowerCase();
  if (port === 465) return "ssl";
  if (port === 587 || port === 2525) return m === "ssl" ? "tls" : m === "none" ? "tls" : (m as "tls");
  return (m === "ssl" || m === "none" ? m : "tls") as "none" | "ssl" | "tls";
}

export function formatSmtpError(err: unknown, settings: SmtpSettings): string {
  const host = settings.smtpHost || "smtp";
  const port = settings.smtpPort || 587;
  const e = err as { code?: string; response?: string; message?: string };
  const parts: string[] = [];
  if (e?.code) parts.push(String(e.code));
  if (e?.response) parts.push(String(e.response).trim());
  const detail = parts.join(" — ") || (e?.message ? String(e.message) : "Failed to send email");
  if (/timeout|etimedout/i.test(detail)) {
    return `Mail server timed out (${host}:${port}). Use 587 + TLS or 465 + SSL. Your hosting server may block outbound SMTP — ask your host or use SendGrid/Mailgun.`;
  }
  if (/econnrefused|enotfound|edns|getaddrinfo/i.test(detail)) {
    return `Cannot reach mail server (${host}:${port}): ${detail}`;
  }
  if (/certificate|self signed|unable to verify/i.test(detail)) {
    return `TLS certificate error (${host}:${port}): ${detail}. Try port 587 with TLS.`;
  }
  if (/auth|invalid login|535|534/i.test(detail)) {
    return `SMTP login failed for ${settings.smtpUsername}@${host}: ${detail}. Re-enter and save your SMTP password.`;
  }
  return `Mail server error (${host}:${port}): ${detail}`;
}

function transportOptions(settings: SmtpSettings) {
  const port = Number(settings.smtpPort) || 587;
  const mode = normalizeSmtpSecure(port, settings.smtpSecure || "tls");
  const secure = mode === "ssl";
  const host = settings.smtpHost.trim();
  const rejectUnauthorized = process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== "0";
  const opts = {
    host,
    port,
    secure,
    auth: {
      user: settings.smtpUsername,
      pass: settings.smtpPassword,
    },
    connectionTimeout: 6000,
    greetingTimeout: 6000,
    socketTimeout: 10000,
    tls: {
      servername: host,
      minVersion: "TLSv1.2" as const,
      rejectUnauthorized,
    },
    ...(mode === "tls" && !secure ? { requireTLS: true } : {}),
  };
  return opts;
}

function probeSmtpReachability(settings: SmtpSettings, timeoutMs = 7000): Promise<void> {
  const port = Number(settings.smtpPort) || 587;
  const mode = normalizeSmtpSecure(port, settings.smtpSecure || "tls");
  const secure = mode === "ssl";
  const host = settings.smtpHost.trim();
  const rejectUnauthorized = process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== "0";

  return new Promise((resolve, reject) => {
    let settled = false;
    let socket: net.Socket | tls.TLSSocket | undefined;

    const finish = (err?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        socket?.destroy();
      } catch {
        /* ignore */
      }
      if (err) reject(err);
      else resolve();
    };

    const timer = setTimeout(() => finish(new Error("ETIMEDOUT")), timeoutMs);

    if (secure) {
      socket = tls.connect({ host, port, servername: host, rejectUnauthorized }, () => finish());
    } else {
      socket = net.connect({ host, port }, () => finish());
    }
    socket.on("error", (err) => finish(err));
  });
}

function formatFrom(settings: SmtpSettings): string {
  const name = (settings.fromName || "").replace(/"/g, "'");
  return name ? `"${name}" <${settings.fromEmail}>` : settings.fromEmail;
}

function formatReplyTo(settings: SmtpSettings): string | undefined {
  if (!settings.replyToEmail) return undefined;
  const name = (settings.replyToName || "").replace(/"/g, "'");
  return name ? `"${name}" <${settings.replyToEmail}>` : settings.replyToEmail;
}

function withDeadline<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    }),
  ]);
}

export async function sendTestEmail(settings: SmtpSettings, to: string): Promise<void> {
  if (!settings.smtpHost?.trim() || !settings.smtpUsername?.trim() || !settings.fromEmail?.trim()) {
    throw new Error("Email is not configured. Fill in SMTP host, username, and from email, then save.");
  }
  if (!settings.smtpPassword?.trim() || isMaskedPassword(settings.smtpPassword)) {
    throw new Error("SMTP password is required. Re-enter your password, click Save settings, then test again.");
  }

  await probeSmtpReachability(settings, 5000).catch((err) => {
    throw new Error(formatSmtpError(err, settings));
  });

  const transporter = nodemailer.createTransport(transportOptions(settings));
  try {
    await withDeadline(
      transporter.sendMail({
        from: formatFrom(settings),
        to,
        replyTo: formatReplyTo(settings),
        subject: "Test Email from POS Inflix",
        text: "This is a test email to verify your email settings are working correctly.",
        html: "<p>This is a test email to verify your email settings are working correctly.</p>",
      }),
      12000,
      formatSmtpError(new Error("ETIMEDOUT"), settings)
    );
  } catch (err) {
    throw new Error(formatSmtpError(err, settings));
  } finally {
    transporter.close();
  }
}
