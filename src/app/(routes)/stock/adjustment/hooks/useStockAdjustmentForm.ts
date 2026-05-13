"use client";

import { useState, useCallback, useEffect } from "react";
import { stockAdjustmentApi } from "../service/stockAdjustmentApi";
import type { StockAdjustment, StockMove } from "../types";

export function useStockAdjustmentForm(adjustmentId: string | null) {
 const [adjustment, setAdjustment] = useState<StockAdjustment | null>(null);
 const [stockMoves, setStockMoves] = useState<StockMove[]>([]);
 const [loading, setLoading] = useState(!!adjustmentId);
 const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

 const fetchAdjustment = useCallback(async () => {
  if (!adjustmentId) {
   setAdjustment(null);
   setStockMoves([]);
   setLoading(false);
   return;
  }
  setLoading(true);
  try {
   const res = await stockAdjustmentApi.getById(adjustmentId);
   setAdjustment(res.data);
   setStockMoves(res.stockMoves || []);
  } catch (e) {
   setMessage({ text: e instanceof Error ? e.message : "Failed to load", type: "error" });
  } finally {
   setLoading(false);
  }
 }, [adjustmentId]);

 useEffect(() => {
  fetchAdjustment();
 }, [fetchAdjustment]);

 const setMessageAndClear = useCallback((m: { text: string; type: "success" | "error" } | null) => {
  setMessage(m);
  if (m) setTimeout(() => setMessage(null), 5000);
 }, []);

 const updateAdjustment = useCallback(
  async (payload: { locationId?: string; reasonCode?: string; notes?: string }) => {
   if (!adjustmentId) return;
   try {
    const updated = await stockAdjustmentApi.update(adjustmentId, payload);
    setAdjustment(updated);
    setMessageAndClear({ text: "Updated", type: "success" });
   } catch (e) {
    setMessageAndClear({ text: e instanceof Error ? e.message : "Update failed", type: "error" });
   }
  },
  [adjustmentId, setMessageAndClear]
 );

 const addLine = useCallback(
  async (payload: { productId: string; deltaQty: number }) => {
   if (!adjustmentId) return;
   try {
    const updated = await stockAdjustmentApi.addLine(adjustmentId, payload);
    setAdjustment(updated);
    setMessageAndClear({ text: "Line added", type: "success" });
   } catch (e) {
    setMessageAndClear({ text: e instanceof Error ? e.message : "Add line failed", type: "error" });
   }
  },
  [adjustmentId, setMessageAndClear]
 );

 const removeLine = useCallback(
  async (lineId: string) => {
   if (!adjustmentId) return;
   try {
    const updated = await stockAdjustmentApi.removeLine(adjustmentId, lineId);
    setAdjustment(updated);
    setMessageAndClear({ text: "Line removed", type: "success" });
   } catch (e) {
    setMessageAndClear({ text: e instanceof Error ? e.message : "Remove failed", type: "error" });
   }
  },
  [adjustmentId, setMessageAndClear]
 );

 const addSerial = useCallback(
  async (payload: { serialOrImei: string; direction: "IN" | "OUT" }) => {
   if (!adjustmentId) return;
   try {
    const updated = await stockAdjustmentApi.addSerial(adjustmentId, payload);
    setAdjustment(updated);
    setMessageAndClear({ text: "Serial added", type: "success" });
   } catch (e) {
    setMessageAndClear({ text: e instanceof Error ? e.message : "Add serial failed", type: "error" });
   }
  },
  [adjustmentId, setMessageAndClear]
 );

 const removeSerial = useCallback(
  async (serialOrImei: string) => {
   if (!adjustmentId) return;
   try {
    const updated = await stockAdjustmentApi.removeSerial(adjustmentId, serialOrImei);
    setAdjustment(updated);
    setMessageAndClear({ text: "Serial removed", type: "success" });
   } catch (e) {
    setMessageAndClear({ text: e instanceof Error ? e.message : "Remove failed", type: "error" });
   }
  },
  [adjustmentId, setMessageAndClear]
 );

 const post = useCallback(async () => {
  if (!adjustmentId) return;
  try {
   const updated = await stockAdjustmentApi.post(adjustmentId);
   setAdjustment(updated);
   setMessageAndClear({ text: "Adjustment posted", type: "success" });
  } catch (e) {
   setMessageAndClear({ text: e instanceof Error ? e.message : "Post failed", type: "error" });
  }
 }, [adjustmentId, setMessageAndClear]);

 const cancel = useCallback(async () => {
  if (!adjustmentId) return;
  try {
   const updated = await stockAdjustmentApi.cancel(adjustmentId);
   setAdjustment(updated);
   setMessageAndClear({ text: "Adjustment cancelled", type: "success" });
  } catch (e) {
   setMessageAndClear({ text: e instanceof Error ? e.message : "Cancel failed", type: "error" });
  }
 }, [adjustmentId, setMessageAndClear]);

 return {
  adjustment,
  stockMoves,
  loading,
  message,
  setMessage: setMessageAndClear,
  refresh: fetchAdjustment,
  updateAdjustment,
  addLine,
  removeLine,
  addSerial,
  removeSerial,
  post,
  cancel,
 };
}
