/** Normalize product / inventory item names to uppercase for consistent display and storage. */
export function formatProductName(value: string | null | undefined): string {
  if (value == null || String(value).trim() === "") return "";
  return String(value).trim().replace(/\s+/g, " ").toUpperCase();
}
