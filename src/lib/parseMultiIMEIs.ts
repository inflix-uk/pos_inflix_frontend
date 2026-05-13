/**
 * Extract serial numbers from a free-form text blob (paste, multi-line, scanner output).
 * - Splits on newlines, commas, semicolons, and whitespace.
 * - Captures every embedded 15-digit IMEI (e.g. "IMEI:359...").
 * - Accepts alphanumeric / hyphenated serials of length 6-32.
 * - Case-insensitive de-duplication; preserves first-seen casing and order.
 */
export function parseMultiIMEIs(s: string): string[] {
 const raw = String(s || "");
 const seen = new Set<string>();
 const out: string[] = [];

 const add = (v: string) => {
  const t = String(v).trim();
  if (!t) return;
  const k = t.toUpperCase();
  if (seen.has(k)) return;
  seen.add(k);
  out.push(t);
 };

 const addAlnumToken = (raw: string) => {
  const tok = raw.trim();
  if (!tok) return;

  if (tok.length < 6 || tok.length > 32) return;
  if (!/^[A-Za-z0-9\-]+$/i.test(tok)) return;

  if (/^\d+$/.test(tok)) {
   if (tok.length === 15) add(tok);
   else if (tok.length >= 6) add(tok);
   return;
  }

  add(tok);
 };

 const processPart = (part: string) => {
  for (const rawTok of part.split(/\s+/).filter(Boolean)) {
   const tok = rawTok.trim();
   if (!tok) continue;
   const imeis = tok.match(/\d{15}/g);
   if (imeis) imeis.forEach((x) => add(x));
   const rest = tok.replace(/\d{15}/g, " ").trim();
   if (!rest) continue;
   for (const sub of rest.split(/\s+/).filter(Boolean)) {
    addAlnumToken(sub);
   }
  }
 };

 for (const line of raw.split(/\r?\n/)) {
  for (const seg of line.split(/[,;]+/)) {
   processPart(seg);
  }
 }

 return out;
}
