import type { jsPDF } from "jspdf";

const VFS_FONT_FILE = "LiberationSans-Bold.ttf";
const FONT_PATH = "/fonts/repair-label/LiberationSans-Bold.ttf";

function uint8ToBinaryString(bytes: Uint8Array): string {
  const CHUNK = 0x8000;
  let s = "";
  for (let i = 0; i < bytes.length; i += CHUNK) {
    s += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK) as unknown as number[]);
  }
  return s;
}

let cachedBinary: string | null = null;
let loadPromise: Promise<string> | null = null;

async function loadFontBinaryOnce(): Promise<string> {
  if (cachedBinary) return cachedBinary;
  if (!loadPromise) {
    loadPromise = (async () => {
      let buf: Uint8Array;
      if (typeof window === "undefined") {
        const fs = await import("node:fs");
        const path = await import("node:path");
        const fontPath = path.join(process.cwd(), "public", "fonts", "repair-label", "LiberationSans-Bold.ttf");
        buf = new Uint8Array(fs.readFileSync(fontPath));
      } else {
        const res = await fetch(FONT_PATH);
        if (!res.ok) {
          throw new Error(`Repair label font failed to load (${res.status}): ${FONT_PATH}`);
        }
        buf = new Uint8Array(await res.arrayBuffer());
      }
      cachedBinary = uint8ToBinaryString(buf);
      return cachedBinary;
    })();
  }
  return loadPromise;
}

/**
 * Embeds Liberation Sans Bold (SIL Open Font License) into the PDF so label text uses a real TTF.
 * Node/pdf.js often fails to paint standard-14 Helvetica on canvas; embedded fonts rasterize reliably.
 */
export async function registerRepairLabelEmbeddedFont(doc: jsPDF): Promise<void> {
  const binary = await loadFontBinaryOnce();
  if (!doc.existsFileInVFS(VFS_FONT_FILE)) {
    doc.addFileToVFS(VFS_FONT_FILE, binary);
    // WinAnsi works better with pdf.js canvas in Node for Latin repair-label text than Identity-H after jsPDF embed.
    doc.addFont(VFS_FONT_FILE, "RepairLabel", "bold", undefined, "WinAnsiEncoding");
  }
}

export const REPAIR_LABEL_JSPDF_FONT = { family: "RepairLabel", style: "bold" } as const;
