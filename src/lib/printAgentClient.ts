/**
 * Browser → Print Bridge with same-origin proxy fallback when direct loopback fetch
 * fails (common: CORS origin mismatch, e.g. POS on :3001, agent allows :3000 only).
 */

import { parseAllowedLoopbackAgentBase } from "@/lib/printAgentLoopbackUrl";

const JSON_ACCEPT: HeadersInit = { Accept: "application/json" };

function agentBaseParam(agentUrl: string): string {
  return encodeURIComponent(agentUrl.replace(/\/$/, ""));
}

/** /status returns HTML unless format=json or Accept is application/json only. */
function agentPathWithQuery(agentPath: string): string {
  const p = agentPath.startsWith("/") ? agentPath : `/${agentPath}`;
  if (p === "/status" || p.startsWith("/status?")) {
    return p.includes("?") ? p : `${p}?format=json`;
  }
  return p;
}

/** True when the POS tab is on this machine (localhost) so Next can proxy to 127.0.0.1. */
export function canUsePrintAgentProxy(agentUrl: string): boolean {
  if (typeof window === "undefined") return false;
  if (!parseAllowedLoopbackAgentBase(agentUrl)) return false;
  try {
    const h = new URL(window.location.origin).hostname.toLowerCase();
    return h === "localhost" || h === "127.0.0.1" || h === "::1";
  } catch {
    return false;
  }
}

function isLikelyNetworkOrCorsError(e: unknown): boolean {
  if (!(e instanceof Error)) return true;
  const m = e.message.toLowerCase();
  return (
    m.includes("failed to fetch") ||
    m.includes("networkerror") ||
    m.includes("load failed") ||
    m.includes("cors")
  );
}

function proxyPathForAgentPath(agentPath: string): string | null {
  const p = agentPath.startsWith("/") ? agentPath : `/${agentPath}`;
  if (p === "/health") return "/api/print-agent/health";
  if (p === "/status") return "/api/print-agent/status";
  if (p === "/printers") return "/api/print-agent/printers";
  if (p === "/print/pdf") return "/api/print-agent/print/pdf";
  if (p === "/print/receipt/escpos") return "/api/print-agent/print/receipt/escpos";
  if (p === "/print/label-png") return "/api/print-agent/print/label-png";
  return null;
}

async function fetchViaProxy(
  agentUrl: string,
  method: "GET" | "POST",
  agentPath: string,
  init: { token?: string; jsonBody?: Record<string, unknown>; signal?: AbortSignal }
): Promise<Response> {
  const proxyPath = proxyPathForAgentPath(agentPath);
  if (!proxyPath) throw new Error(`No proxy route for ${agentPath}`);

  const headers: HeadersInit = { ...(init.token ? { "X-Print-Token": init.token } : {}) };

  if (method === "GET") {
    return fetch(`${proxyPath}?agentBase=${agentBaseParam(agentUrl)}`, {
      method: "GET",
      headers,
      signal: init.signal,
    });
  }

  return fetch(proxyPath, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ agentBase: agentUrl.replace(/\/$/, ""), payload: init.jsonBody }),
    signal: init.signal,
  });
}

async function fetchDirect(
  agentUrl: string,
  method: "GET" | "POST",
  agentPath: string,
  options?: {
    token?: string;
    jsonBody?: Record<string, unknown>;
    signal?: AbortSignal;
  }
): Promise<Response> {
  const base = agentUrl.replace(/\/$/, "");
  const path = agentPathWithQuery(agentPath.startsWith("/") ? agentPath : `/${agentPath}`);
  return fetch(`${base}${path}`, {
    method,
    signal: options?.signal,
    headers: {
      ...JSON_ACCEPT,
      ...(options?.token ? { "X-Print-Token": options.token } : {}),
      ...(method === "POST" ? { "Content-Type": "application/json" } : {}),
    },
    ...(method === "POST" && options?.jsonBody
      ? { body: JSON.stringify(options.jsonBody) }
      : {}),
  });
}

/** GET or POST to Print Bridge; on localhost prefers Next proxy (no CORS). */
export async function fetchPrintAgent(
  agentUrl: string,
  method: "GET" | "POST",
  agentPath: string,
  options?: {
    token?: string;
    jsonBody?: Record<string, unknown>;
    timeoutMs?: number;
  }
): Promise<Response> {
  const path = agentPath.startsWith("/") ? agentPath : `/${agentPath}`;
  const signal = options?.timeoutMs
    ? AbortSignal.timeout(options.timeoutMs)
    : undefined;
  const init = {
    token: options?.token,
    jsonBody: options?.jsonBody,
    signal,
  };

  // Local dev: proxy first — avoids CORS when POS is localhost:3001 and agent allows only some origins.
  if (canUsePrintAgentProxy(agentUrl)) {
    try {
      const proxyRes = await fetchViaProxy(agentUrl, method, path, init);
      if (proxyRes.ok || proxyRes.status === 401 || proxyRes.status === 403) {
        return proxyRes;
      }
    } catch {
      /* try direct */
    }
  }

  try {
    return await fetchDirect(agentUrl, method, path, init);
  } catch (e) {
    if (!canUsePrintAgentProxy(agentUrl) || !isLikelyNetworkOrCorsError(e)) throw e;
    return fetchViaProxy(agentUrl, method, path, init);
  }
}

/** Reliable reachability: /health is always JSON (unlike /status HTML page). */
export async function checkPrintAgentReachable(
  agentUrl: string,
  agentToken?: string
): Promise<boolean> {
  try {
    const res = await fetchPrintAgent(agentUrl, "GET", "/health", {
      token: agentToken,
      timeoutMs: 5000,
    });
    const json = (await res.json().catch(() => ({}))) as { ok?: boolean };
    return res.ok && !!json.ok;
  } catch {
    return false;
  }
}
