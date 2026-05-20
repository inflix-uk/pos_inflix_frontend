/**
 * Browser → Print Bridge with same-origin proxy fallback when direct loopback fetch
 * fails (common: CORS origin mismatch, e.g. POS on :3001, agent allows :3000 only).
 */

import { parseAllowedLoopbackAgentBase } from "@/lib/printAgentLoopbackUrl";

function agentBaseParam(agentUrl: string): string {
  return encodeURIComponent(agentUrl.replace(/\/$/, ""));
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

/** GET or POST to Print Bridge; uses Next proxy on localhost when direct fetch fails. */
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
  const base = agentUrl.replace(/\/$/, "");
  const path = agentPath.startsWith("/") ? agentPath : `/${agentPath}`;
  const signal = options?.timeoutMs
    ? AbortSignal.timeout(options.timeoutMs)
    : undefined;
  const directInit: RequestInit = {
    method,
    signal,
    headers: {
      ...(options?.token ? { "X-Print-Token": options.token } : {}),
      ...(method === "POST" ? { "Content-Type": "application/json" } : {}),
    },
    ...(method === "POST" && options?.jsonBody
      ? { body: JSON.stringify(options.jsonBody) }
      : {}),
  };

  try {
    const res = await fetch(`${base}${path}`, directInit);
    return res;
  } catch (e) {
    if (!canUsePrintAgentProxy(agentUrl) || !isLikelyNetworkOrCorsError(e)) throw e;
    return fetchViaProxy(agentUrl, method, path, {
      token: options?.token,
      jsonBody: options?.jsonBody,
      signal,
    });
  }
}
