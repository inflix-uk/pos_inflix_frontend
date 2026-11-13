import { salesApi } from "../../sales-dashboard/service/salesApi";

export type ReturnTarget = {
  saleId: string;
  reference: string;
  customerName?: string;
  /** Set when the user scanned an IMEI / serial — the start page adds it to the basket straight away. */
  serial?: string;
};

/** Long numeric (IMEI) or a single alphanumeric token of 8+ characters (serial). */
export function looksLikeSerial(term: string): boolean {
  const t = term.trim();
  return /^\d{8,}$/.test(t) || (t.length >= 8 && /^[A-Za-z0-9]+$/.test(t));
}

/** URL of the return page for a target; the scanned serial rides along so it is not scanned twice. */
export function returnStartUrl(target: Pick<ReturnTarget, "saleId" | "serial">): string {
  const base = `/sales-return/start/${encodeURIComponent(target.saleId)}`;
  return target.serial ? `${base}?serial=${encodeURIComponent(target.serial)}` : base;
}

async function findBySerial(term: string): Promise<ReturnTarget | null> {
  try {
    const res = await salesApi.getFindBySerial(term);
    const d = res?.data;
    if (!d?.saleId) return null;
    return { saleId: d.saleId, reference: d.reference, customerName: d.customerName, serial: d.serial || term };
  } catch {
    return null;
  }
}

async function findByInvoice(term: string): Promise<ReturnTarget | null> {
  try {
    const res = await salesApi.getSales({ search: term, limit: 10 });
    const list = (res.data ?? []) as Array<{ _id?: string; reference?: string; customerName?: string }>;
    const wanted = term.trim().toUpperCase();
    // Prefer an exact invoice number match over a partial search hit.
    const sale = list.find((s) => (s.reference || "").toUpperCase() === wanted) ?? (/^INV-/i.test(term) ? list[0] : undefined);
    if (!sale?._id) return null;
    return { saleId: sale._id, reference: sale.reference || term, customerName: sale.customerName };
  } catch {
    return null;
  }
}

/**
 * Resolve what the user scanned / typed into the sale to return against.
 * IMEI / serial first (when it looks like one), then invoice number.
 */
export async function findReturnTarget(rawTerm: string): Promise<ReturnTarget | null> {
  const term = rawTerm.trim();
  if (!term) return null;
  if (/^INV-/i.test(term)) return findByInvoice(term);
  if (looksLikeSerial(term)) {
    const bySerial = await findBySerial(term);
    if (bySerial) return bySerial;
  }
  return findByInvoice(term);
}
