/**
 * Standard QR payload format for POS labels and scan flow.
 * Must match backend utils/qrPayload.js
 * Format: POSv1|<type>|<id>
 */

const PREFIX = 'POSv1';
const TYPES = ['product', 'serial', 'location'] as const;
export type QrPayloadType = (typeof TYPES)[number];

export interface ParsedQrPayload {
  type: QrPayloadType;
  id: string;
}

export function parseQrPayload(payload: string | null | undefined): ParsedQrPayload | null {
  if (!payload || typeof payload !== 'string') return null;
  const s = payload.trim();
  const parts = s.split('|');
  if (parts.length < 3) return null;
  const [prefix, type, ...rest] = parts;
  const id = rest.join('|').trim();
  if (!id) return null;
  if ((prefix !== 'POSv1' && prefix !== 'POS') || !TYPES.includes(type as QrPayloadType)) return null;
  return { type: type as QrPayloadType, id };
}

export function buildQrPayload(type: QrPayloadType, id: string): string {
  if (!TYPES.includes(type) || !id) return '';
  return `${PREFIX}|${type}|${id}`;
}

export { PREFIX, TYPES };
