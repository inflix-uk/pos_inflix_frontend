"use client";

import { useState, useCallback, useEffect } from "react";
import { stockTransferApi } from "../service/stockTransferApi";
import { locationApi } from "@/app/(routes)/peoples/locations/service/locationApi";
import type { StockTransfer } from "../types";
import type { Location } from "@/app/(routes)/peoples/locations/types";

export function useStockTransferForm(transferId: string | null) {
 const [transfer, setTransfer] = useState<StockTransfer | null>(null);
 const [locations, setLocations] = useState<Location[]>([]);
 const [loading, setLoading] = useState(!!transferId);
 const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
 const [scanInput, setScanInput] = useState("");
 const [actionLoading, setActionLoading] = useState(false);

 const loadLocations = useCallback(async () => {
  try {
   const res = await locationApi.getLocations({ limit: 500, isActive: true });
   if (res.success && Array.isArray((res as { data?: Location[] }).data)) {
    setLocations((res as { data: Location[] }).data);
   }
  } catch {
   // ignore
  }
 }, []);

 const loadTransfer = useCallback(async () => {
  if (!transferId) {
   setTransfer(null);
   setLoading(false);
   return;
  }
  setLoading(true);
  try {
   const res = await stockTransferApi.getById(transferId);
   setTransfer(res.data);
  } catch (e) {
   setMessage({ text: e instanceof Error ? e.message : "Failed to load transfer", type: "error" });
  } finally {
   setLoading(false);
  }
 }, [transferId]);

 useEffect(() => {
  loadLocations();
 }, [loadLocations]);
 useEffect(() => {
  loadTransfer();
 }, [loadTransfer]);

 const updateTransfer = useCallback(async (payload: { fromLocationId?: string; toLocationId?: string; notes?: string }) => {
  if (!transferId || !transfer) return;
  setActionLoading(true);
  try {
   const updated = await stockTransferApi.update(transferId, payload);
   setTransfer(updated);
   setMessage({ text: "Transfer updated", type: "success" });
  } catch (e) {
   setMessage({ text: e instanceof Error ? e.message : "Update failed", type: "error" });
  } finally {
   setActionLoading(false);
  }
 }, [transferId, transfer]);

 const addLine = useCallback(
  async (payload: { productId?: string; purchaseId?: string; purchaseItemId?: string; qty: number; unitCost?: number }) => {
   if (!transferId) return;
   setActionLoading(true);
   try {
    const updated = await stockTransferApi.addLine(transferId, payload);
    setTransfer(updated);
    setMessage({ text: "Line added", type: "success" });
   } catch (e) {
    setMessage({ text: e instanceof Error ? e.message : "Failed to add line", type: "error" });
   } finally {
    setActionLoading(false);
   }
  },
  [transferId]
 );

 const removeLine = useCallback(async (lineId: string) => {
  if (!transferId) return;
  setActionLoading(true);
  try {
   const updated = await stockTransferApi.removeLine(transferId, lineId);
   setTransfer(updated);
   setMessage({ text: "Line removed", type: "success" });
  } catch (e) {
   setMessage({ text: e instanceof Error ? e.message : "Failed to remove line", type: "error" });
  } finally {
   setActionLoading(false);
  }
 }, [transferId]);

 const addSerial = useCallback(async (serialOrImei: string) => {
  if (!transferId) return;
  const s = serialOrImei.trim();
  if (!s) return;
  setActionLoading(true);
  setMessage(null);
  try {
   const updated = await stockTransferApi.addSerial(transferId, s);
   setTransfer(updated);
   setScanInput("");
   setMessage({ text: `Serial ${s} added`, type: "success" });
  } catch (e) {
   setMessage({ text: e instanceof Error ? e.message : "Failed to add serial", type: "error" });
  } finally {
   setActionLoading(false);
  }
 }, [transferId]);

 const removeSerial = useCallback(async (serialOrImei: string) => {
  if (!transferId) return;
  setActionLoading(true);
  try {
   const updated = await stockTransferApi.removeSerial(transferId, serialOrImei);
   setTransfer(updated);
   setMessage({ text: "Serial removed", type: "success" });
  } catch (e) {
   setMessage({ text: e instanceof Error ? e.message : "Failed to remove serial", type: "error" });
  } finally {
   setActionLoading(false);
  }
 }, [transferId]);

 const dispatch = useCallback(async () => {
  if (!transferId) return;
  setActionLoading(true);
  try {
   const updated = await stockTransferApi.dispatch(transferId);
   setTransfer(updated);
   setMessage({ text: "Transfer dispatched", type: "success" });
  } catch (e) {
   setMessage({ text: e instanceof Error ? e.message : "Failed to dispatch", type: "error" });
  } finally {
   setActionLoading(false);
  }
 }, [transferId]);

 const receive = useCallback(async () => {
  if (!transferId) return;
  setActionLoading(true);
  try {
   const updated = await stockTransferApi.receive(transferId);
   setTransfer(updated);
   setMessage({ text: "Transfer received", type: "success" });
  } catch (e) {
   setMessage({ text: e instanceof Error ? e.message : "Failed to receive", type: "error" });
  } finally {
   setActionLoading(false);
  }
 }, [transferId]);

 const cancel = useCallback(async () => {
  if (!transferId) return;
  setActionLoading(true);
  try {
   const updated = await stockTransferApi.cancel(transferId);
   setTransfer(updated);
   setMessage({ text: "Transfer cancelled", type: "success" });
  } catch (e) {
   setMessage({ text: e instanceof Error ? e.message : "Failed to cancel", type: "error" });
  } finally {
   setActionLoading(false);
  }
 }, [transferId]);

 return {
  transfer,
  locations,
  loading,
  message,
  setMessage,
  scanInput,
  setScanInput,
  actionLoading,
  loadTransfer,
  updateTransfer,
  addLine,
  removeLine,
  addSerial,
  removeSerial,
  dispatch,
  receive,
  cancel,
 };
}
