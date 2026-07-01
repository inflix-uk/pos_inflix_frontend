/** Live input: uppercase, no leading spaces, collapse duplicate spaces (keeps trailing space while typing). */
export function formatProductNameInput(value: string | null | undefined): string {
  if (value == null) return "";
  return String(value)
    .toUpperCase()
    .replace(/^\s+/, "")
    .replace(/\s{2,}/g, " ");
}

/** Final value for save/display: trim, uppercase, single spaces between words. */
export function formatProductName(value: string | null | undefined): string {
  if (value == null || String(value).trim() === "") return "";
  return String(value).trim().replace(/\s+/g, " ").toUpperCase();
}
