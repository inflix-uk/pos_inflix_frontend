"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RotateCcw, ScanLine, X } from "lucide-react";
import { findReturnTarget, returnStartUrl } from "../utils/findReturnTarget";

interface QuickReturnScanModalProps {
  open: boolean;
  onClose: () => void;
  /** Opens the manual return form (returns without an invoice). */
  onManualReturn: () => void;
}

/**
 * One step to start a return: scan the IMEI (or type the invoice number) and go straight to
 * the return screen for that invoice with the scanned item already in the basket.
 */
export function QuickReturnScanModal({ open, onClose, onManualReturn }: QuickReturnScanModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setValue("");
    setError(null);
    setBusy(false);
    const t = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const term = value.trim();
    if (!term || busy) return;
    setBusy(true);
    setError(null);
    const target = await findReturnTarget(term);
    if (!target) {
      setBusy(false);
      setError(
        "Nothing found to return. Check the IMEI / invoice number — the item may not be sold, or may already be returned."
      );
      inputRef.current?.select();
      return;
    }
    router.push(returnStartUrl(target));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/40 p-4 pt-16 sm:pt-4">
      <div role="dialog" aria-modal="true" aria-labelledby="quick-return-title" className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-50 p-2">
              <RotateCcw className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h2 id="quick-return-title" className="text-base font-semibold text-gray-900">
                New sales return
              </h2>
              <p className="mt-0.5 text-xs text-gray-500">Scan the IMEI once — the item goes straight into the return.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 p-5">
          <label htmlFor="quick-return-input" className="block text-sm font-medium text-gray-700">
            IMEI / serial or invoice number
          </label>
          <div className="relative">
            <ScanLine className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              ref={inputRef}
              id="quick-return-input"
              type="text"
              autoComplete="off"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError(null);
              }}
              placeholder="Scan IMEI or type INV-…"
              className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-3 text-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-500"
              disabled={busy}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={busy || !value.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 font-semibold text-white hover:bg-orange-600 disabled:pointer-events-none disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <RotateCcw className="h-5 w-5" />}
            {busy ? "Finding sale…" : "Start return"}
          </button>
        </form>

        <div className="rounded-b-2xl border-t border-gray-100 bg-gray-50 px-5 py-3 text-center">
          <button
            type="button"
            onClick={onManualReturn}
            className="text-xs font-medium text-gray-500 underline-offset-2 hover:text-gray-800 hover:underline"
          >
            No invoice? Enter a return manually
          </button>
        </div>
      </div>
    </div>
  );
}
