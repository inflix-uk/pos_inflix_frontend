import * as XLSX from "xlsx";

export interface ParsedImportFile {
 headers: string[];
 rows: Record<string, string>[];
}

/**
 * Parse CSV or Excel file to headers + rows (array of objects keyed by header).
 */
export async function parseImportFile(file: File): Promise<ParsedImportFile> {
 const buf = await file.arrayBuffer();
 const wb = XLSX.read(buf, { type: "array", raw: false });
 const firstSheet = wb.Sheets[wb.SheetNames[0]];
 if (!firstSheet) return { headers: [], rows: [] };
 const data = XLSX.utils.sheet_to_json<string[]>(firstSheet, { header: 1, defval: "" });
 if (!Array.isArray(data) || data.length === 0) return { headers: [], rows: [] };
 const headerRow = data[0].map((h) => String(h ?? "").trim() || `Column_${data[0].indexOf(h)}`);
 const rows: Record<string, string>[] = [];
 for (let i = 1; i < data.length; i++) {
  const row = data[i] as string[] | undefined;
  const obj: Record<string, string> = {};
  headerRow.forEach((h, j) => {
   obj[h] = row && row[j] != null ? String(row[j]).trim() : "";
  });
  rows.push(obj);
 }
 return { headers: headerRow, rows };
}
