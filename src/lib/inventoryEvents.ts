/**
 * Cross-tab event bus for inventory changes (sales, returns, transfers).
 * Pages that display stock subscribe; writers (e.g. create-sales) emit after success.
 * Uses BroadcastChannel when available with a localStorage fallback for older browsers.
 */

const CHANNEL = "inflix:inventory";
const LS_KEY = "inflix:inventory:tick";

export type InventoryEvent =
 | { type: "sale-created"; saleId?: string }
 | { type: "sale-voided"; saleId?: string }
 | { type: "sale-return"; saleReturnId?: string }
 | { type: "stock-transferred" }
 | { type: "purchase-imported" }
 | { type: "manual-refresh" };

type Listener = (e: InventoryEvent) => void;

let bc: BroadcastChannel | null = null;
const localListeners = new Set<Listener>();

function ensureChannel(): BroadcastChannel | null {
 if (typeof window === "undefined") return null;
 if (bc) return bc;
 if (typeof BroadcastChannel === "function") {
  bc = new BroadcastChannel(CHANNEL);
 }
 return bc;
}

export function emitInventoryEvent(event: InventoryEvent): void {
 if (typeof window === "undefined") return;
 const ch = ensureChannel();
 if (ch) ch.postMessage(event);
 // Same-tab listeners (BroadcastChannel doesn't fire in the posting tab)
 localListeners.forEach((fn) => {
  try { fn(event); } catch { /* listener error */ }
 });
 // localStorage fallback for tabs without BroadcastChannel and as a belt-and-braces signal
 try {
  window.localStorage.setItem(LS_KEY, JSON.stringify({ ...event, t: Date.now() }));
 } catch { /* quota / storage disabled */ }
}

export function onInventoryEvent(listener: Listener): () => void {
 if (typeof window === "undefined") return () => {};
 localListeners.add(listener);
 const ch = ensureChannel();
 const onMessage = (ev: MessageEvent) => listener(ev.data as InventoryEvent);
 const onStorage = (ev: StorageEvent) => {
  if (ev.key !== LS_KEY || !ev.newValue) return;
  try { listener(JSON.parse(ev.newValue) as InventoryEvent); } catch { /* bad json */ }
 };
 if (ch) ch.addEventListener("message", onMessage);
 window.addEventListener("storage", onStorage);
 return () => {
  localListeners.delete(listener);
  if (ch) ch.removeEventListener("message", onMessage);
  window.removeEventListener("storage", onStorage);
 };
}
