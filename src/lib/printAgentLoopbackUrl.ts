/**
 * Restrict print-agent proxy targets to loopback only (mitigate SSRF if route is ever exposed).
 */

export function parseAllowedLoopbackAgentBase(raw: string | null | undefined): URL | null {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim().replace(/\/+$/, "");
  let u: URL;
  try {
    u = new URL(trimmed);
  } catch {
    return null;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;
  const h = u.hostname.toLowerCase();
  if (h !== "localhost" && h !== "127.0.0.1" && h !== "::1") return null;
  const portStr = u.port;
  const port = portStr ? parseInt(portStr, 10) : u.protocol === "https:" ? 443 : 80;
  if (!Number.isFinite(port) || port < 1 || port > 65535) return null;
  return u;
}

export function agentBaseOrigin(u: URL): string {
  const port = u.port;
  return `${u.protocol}//${u.hostname}${port ? `:${port}` : ""}`;
}
