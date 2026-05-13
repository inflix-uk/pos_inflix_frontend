/** Supplier document or purchase account (Customer uses contactName). */
export type SupplierLike = {
  name?: string;
  contactPerson?: string;
  contactName?: string;
};

const isObjectIdLike = (s: string) => /^[a-f0-9]{24}$/i.test(s);

export function formatSupplierDisplay(ref: SupplierLike | string | null | undefined): string {
  if (ref == null || ref === "") return "";
  if (typeof ref === "string") {
    const trimmed = ref.trim();
    return isObjectIdLike(trimmed) ? "" : trimmed;
  }
  const name = ref.name != null ? String(ref.name).trim() : "";
  const contactRaw = ref.contactPerson ?? ref.contactName;
  const contact = contactRaw != null ? String(contactRaw).trim() : "";
  if (!name && !contact) return "";
  if (!contact || contact === name) return name || contact;
  return `${name} · ${contact}`;
}

export type PurchasePartyRef = string | (SupplierLike & { _id?: string }) | undefined;

/** Resolve supplier/account on a purchase for table cells (matches API populate). */
export function formatPurchasePartyDisplay(
  supplier?: PurchasePartyRef,
  account?: PurchasePartyRef,
): string {
  const fromObj = (v: PurchasePartyRef) => {
    if (v == null || v === "") return "";
    if (typeof v === "string") {
      const trimmed = v.trim();
      return isObjectIdLike(trimmed) ? "" : trimmed;
    }
    return formatSupplierDisplay(v);
  };
  const s = fromObj(supplier);
  if (s) return s;
  const a = fromObj(account);
  return a || "—";
}
