"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
 AlertTriangle,
 ArrowLeft,
 CheckCircle2,
 FileText,
 IdCard,
 Loader2,
 PenLine,
 RotateCcw,
 Smartphone,
 User,
 Wallet,
} from "lucide-react";
import { useAddPurchase } from "../../purchases/add/hooks/useAddPurchase";
import { ItemForm } from "../../purchases/add/components";
import { parseMultiIMEIs } from "@/lib/parseMultiIMEIs";
import { usePermissions } from "@/hooks/usePermissions";
import { compressImageFile } from "@/lib/imageCompress";
import SignaturePad, { type SignaturePadHandle } from "@/components/SignaturePad";
import { tradeInApi, TradeInApiError } from "../service/tradeInApi";
import { IdPhotoTile } from "../components/IdPhotoTile";
import { UsePhoneModal } from "../components/UsePhoneModal";
import {
 PAYOUT_LABELS,
 type PayoutMethod,
 type TradeInFileKind,
 type TradeInFileMeta,
 type TradeInMeta,
} from "../types";

/** localAt: when this computer uploaded it (so a slower poll reply doesn't hide a fresh upload). */
type FileSlot = { meta: TradeInFileMeta; dataUrl: string | null; localAt?: number };
type Files = Partial<Record<TradeInFileKind, FileSlot>>;
type Msg = { type: "error" | "success" | ""; text: string };

const POLL_MS = 3000;
const draftStorageKey = (id: string) => `tradein-draft-${id}`;

const inputCls =
 "block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-lime-500 focus:ring-2 focus:ring-lime-500/40";

function Section({ icon: Icon, title, hint, children, right }: {
 icon: React.ElementType;
 title: string;
 hint?: string;
 children: React.ReactNode;
 right?: React.ReactNode;
}) {
 return (
  <section className="border-b border-gray-200 p-4">
   <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
    <div>
     <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
      <Icon className="h-4 w-4 text-lime-700" />
      {title}
     </h2>
     {hint && <p className="mt-0.5 text-xs text-gray-500">{hint}</p>}
    </div>
    {right}
   </div>
   {children}
  </section>
 );
}

export default function NewTradeInPage() {
 const router = useRouter();
 const searchParams = useSearchParams();
 const { can } = usePermissions();
 const allowCreateVariantValues = can("variant_attribute.create");
 const p = useAddPurchase();

 const [draftId, setDraftId] = useState<string | null>(searchParams.get("draft"));
 const draftPromise = useRef<Promise<string> | null>(null);
 const resumed = useRef(false);
 const [meta, setMeta] = useState<TradeInMeta | null>(null);
 const [metaError, setMetaError] = useState(false);

 const [customer, setCustomer] = useState({ name: "", phone: "", email: "" });
 const [notes, setNotes] = useState("");
 const [payoutMethod, setPayoutMethod] = useState<PayoutMethod>("cash");

 const [files, setFiles] = useState<Files>({});
 const filesRef = useRef<Files>({});
 useEffect(() => {
  filesRef.current = files;
 }, [files]);
 const [busy, setBusy] = useState<Partial<Record<TradeInFileKind, boolean>>>({});
 const [termsAccepted, setTermsAccepted] = useState(false);
 const [termsVia, setTermsVia] = useState<"desktop" | "phone" | null>(null);
 const [termsBusy, setTermsBusy] = useState(false);
 const [phoneOpen, setPhoneOpen] = useState(false);
 const [phoneLinkActive, setPhoneLinkActive] = useState(false);

 const sigRef = useRef<SignaturePadHandle | null>(null);
 const [sigHasInk, setSigHasInk] = useState(false);

 const [submitting, setSubmitting] = useState(false);
 /** Set while completing, so the background phone sync doesn't redirect away from the success page. */
 const completingRef = useRef(false);
 const [message, setMessage] = useState<Msg>({ type: "", text: "" });

 const termsText = meta?.termsText || "";
 const termsRequired = termsText.trim().length > 0;

 // ── Draft: created the first time we need a server record (photo, QR, terms, signature, complete) ──
 const ensureDraft = useCallback(async (): Promise<string> => {
  if (draftId) return draftId;
  if (!draftPromise.current) {
   draftPromise.current = tradeInApi
    .createDraft()
    .then((d) => {
     resumed.current = true; // brand-new draft: nothing to resume
     setDraftId(d._id);
     router.replace(`/trade-ins/new?draft=${d._id}`, { scroll: false });
     return d._id;
    })
    .catch((e) => {
     draftPromise.current = null;
     throw e;
    });
  }
  return draftPromise.current;
 }, [draftId, router]);

 const forgetDraft = useCallback(
  (text: string) => {
   draftPromise.current = null;
   setDraftId(null);
   setFiles({});
   setTermsAccepted(false);
   setTermsVia(null);
   setPhoneLinkActive(false);
   router.replace("/trade-ins/new", { scroll: false });
   setMessage({ type: "error", text });
  },
  [router]
 );

 useEffect(() => {
  tradeInApi
   .meta()
   .then(setMeta)
   .catch(() => setMetaError(true));
 }, []);

 /** Pull the draft's state from the server; fetch image data only for files that changed. */
 const syncFromServer = useCallback(
  async (id: string, { firstLoad = false } = {}) => {
   if (completingRef.current) return;
   try {
    const t = await tradeInApi.get(id);
    if (completingRef.current) return;
    if (t.status === "completed") {
     router.replace(`/trade-ins/${id}`);
     return;
    }
    setTermsAccepted(!!t.termsAccepted);
    setTermsVia(t.termsAcceptedVia || null);
    setPhoneLinkActive(!!t.uploadLinkActive);
    const serverFiles = t.files || [];
    const prev = filesRef.current;
    const next: Files = {};
    const changed: TradeInFileKind[] = [];
    for (const f of serverFiles) {
     const had = prev[f.kind];
     if (had && (had.meta.updatedAt === f.updatedAt || (had.localAt && Date.now() - had.localAt < 10_000))) next[f.kind] = had;
     else {
      next[f.kind] = { meta: f, dataUrl: had?.dataUrl ?? null };
      changed.push(f.kind);
     }
    }
    // Keep anything this computer uploaded in the last few seconds even if this reply predates it.
    for (const kind of Object.keys(prev) as TradeInFileKind[]) {
     const had = prev[kind];
     if (!next[kind] && had?.localAt && Date.now() - had.localAt < 10_000) next[kind] = had;
    }
    filesRef.current = next;
    setFiles(next);
    if (changed.length > 0) {
     const withData = await tradeInApi.getFiles(id, changed);
     setFiles((prev) => {
      const next = { ...prev };
      for (const f of withData) if (next[f.kind]) next[f.kind] = { meta: f, dataUrl: f.dataUrl };
      return next;
     });
    }
   } catch (e) {
    if (e instanceof TradeInApiError && e.status === 404) {
     forgetDraft(
      firstLoad
       ? "That unfinished trade-in has expired (they are kept for 24 hours). Please start again."
       : "This trade-in draft has expired. Please add the photos and signature again."
     );
    }
   }
  },
  [router, forgetDraft]
 );

 // Resume a draft after a page refresh (?draft=id): photos, terms + the customer fields we kept locally.
 useEffect(() => {
  if (resumed.current || !draftId) return;
  resumed.current = true;
  try {
   const raw = sessionStorage.getItem(draftStorageKey(draftId));
   if (raw) {
    const saved = JSON.parse(raw);
    if (saved.customer) setCustomer({ name: "", phone: "", email: "", ...saved.customer });
    if (typeof saved.notes === "string") setNotes(saved.notes);
    if (saved.payoutMethod && saved.payoutMethod in PAYOUT_LABELS) setPayoutMethod(saved.payoutMethod);
   }
  } catch {
   /* storage unavailable — fine */
  }
  syncFromServer(draftId, { firstLoad: true });
 }, [draftId, syncFromServer]);

 useEffect(() => {
  if (!draftId) return;
  try {
   sessionStorage.setItem(draftStorageKey(draftId), JSON.stringify({ customer, notes, payoutMethod }));
  } catch {
   /* ignore */
  }
 }, [draftId, customer, notes, payoutMethod]);

 // Live updates from the phone while its link is open.
 useEffect(() => {
  if (!draftId || !(phoneOpen || phoneLinkActive)) return;
  const tick = () => {
   if (document.visibilityState === "visible") syncFromServer(draftId);
  };
  const h = window.setInterval(tick, POLL_MS);
  return () => window.clearInterval(h);
 }, [draftId, phoneOpen, phoneLinkActive, syncFromServer]);

 const openPhone = async () => {
  setMessage({ type: "", text: "" });
  try {
   await ensureDraft();
   setPhoneOpen(true);
   setPhoneLinkActive(true);
  } catch (e) {
   setMessage({ type: "error", text: e instanceof Error ? e.message : "Could not start the trade-in." });
  }
 };

 const uploadPhoto = async (kind: TradeInFileKind, file: File) => {
  setMessage({ type: "", text: "" });
  setBusy((b) => ({ ...b, [kind]: true }));
  try {
   const dataUrl = await compressImageFile(file);
   const id = await ensureDraft();
   const saved = await tradeInApi.putFile(id, kind, dataUrl);
   setFiles((f) => ({ ...f, [kind]: { meta: saved, dataUrl, localAt: Date.now() } }));
  } catch (e) {
   if (e instanceof TradeInApiError && e.status === 404) forgetDraft("This trade-in draft has expired. Please try again.");
   else setMessage({ type: "error", text: e instanceof Error ? e.message : "Photo upload failed." });
  } finally {
   setBusy((b) => ({ ...b, [kind]: false }));
  }
 };

 const removeFile = async (kind: TradeInFileKind) => {
  if (!draftId) return;
  setBusy((b) => ({ ...b, [kind]: true }));
  try {
   await tradeInApi.deleteFile(draftId, kind);
   setFiles((f) => {
    const next = { ...f };
    delete next[kind];
    return next;
   });
   if (kind === "signature") sigRef.current?.clear();
  } catch (e) {
   setMessage({ type: "error", text: e instanceof Error ? e.message : "Could not remove it." });
  } finally {
   setBusy((b) => ({ ...b, [kind]: false }));
  }
 };

 const saveSignature = async (): Promise<boolean> => {
  const dataUrl = sigRef.current?.toDataUrl();
  if (!dataUrl) return false;
  setBusy((b) => ({ ...b, signature: true }));
  try {
   const id = await ensureDraft();
   const saved = await tradeInApi.putFile(id, "signature", dataUrl);
   setFiles((f) => ({ ...f, signature: { meta: saved, dataUrl, localAt: Date.now() } }));
   return true;
  } catch (e) {
   setMessage({ type: "error", text: e instanceof Error ? e.message : "Could not save the signature." });
   return false;
  } finally {
   setBusy((b) => ({ ...b, signature: false }));
  }
 };

 const toggleTerms = async (checked: boolean) => {
  setTermsBusy(true);
  try {
   const id = await ensureDraft();
   const r = await tradeInApi.setTermsAccepted(id, checked);
   setTermsAccepted(r.termsAccepted);
   setTermsVia((r.termsAcceptedVia as "desktop" | "phone" | null) || null);
  } catch (e) {
   setMessage({ type: "error", text: e instanceof Error ? e.message : "Could not save." });
  } finally {
   setTermsBusy(false);
  }
 };

 // Running total = what the customer gets paid (purchase price × units), including the line still in the form.
 const total = useMemo(() => {
  const price = (v: string) => parseFloat(v) || 0;
  let sum = 0;
  for (const e of p.savedItems) sum += price(e.data.purchasePrice) * (e.imeiCount || 0);
  sum += price(p.itemData.purchasePrice) * (p.itemData.multiIMEIs.trim() ? parseMultiIMEIs(p.itemData.multiIMEIs).length : 0);
  for (const e of p.savedOtherItems) sum += price(e.data.purchasePrice) * (parseInt(e.data.quantity) || 0);
  sum += price(p.otherItemData.purchasePrice) * (parseInt(p.otherItemData.quantity) || 0);
  return sum;
 }, [p.savedItems, p.itemData, p.savedOtherItems, p.otherItemData]);
 const units = p.totalIMEIs + p.totalOtherQuantity;

 const handleComplete = async () => {
  setMessage({ type: "", text: "" });
  const name = customer.name.trim();
  const phone = customer.phone.trim();
  if (!name || !phone) {
   setMessage({ type: "error", text: "Enter the customer's name and mobile number." });
   return;
  }
  const collected = p.collectItemsForSubmit();
  if (!collected.ok) {
   setMessage({ type: "error", text: collected.error });
   return;
  }
  if (termsRequired && !termsAccepted) {
   setMessage({ type: "error", text: "The customer must accept the trade-in terms (tick the box, or accept on the phone)." });
   return;
  }
  setSubmitting(true);
  completingRef.current = true;
  let leaving = false;
  try {
   const id = await ensureDraft();
   if (!files.signature) {
    const saved = sigHasInk ? await saveSignature() : false;
    if (!saved) {
     setMessage({ type: "error", text: "The customer must sign before you can complete the trade-in." });
     return;
    }
   }
   await tradeInApi.complete(id, {
    customer: { name, phone, email: customer.email.trim() },
    notes: notes.trim(),
    payoutMethod,
    termsAccepted,
    items: collected.allItems,
   });
   try {
    sessionStorage.removeItem(draftStorageKey(id));
   } catch {
    /* ignore */
   }
   leaving = true; // keep sync paused: we're leaving this page
   router.push(`/trade-ins/${id}?created=1`);
  } catch (e) {
   if (e instanceof TradeInApiError && e.status === 409 && draftId) {
    const ref = (e.data as { reference?: string } | undefined)?.reference;
    if (ref) {
     leaving = true;
     router.push(`/trade-ins/${draftId}`);
     return;
    }
   }
   if (e instanceof TradeInApiError && e.status === 404) {
    forgetDraft("This trade-in draft expired before it was completed. Please add the photos and signature again.");
    return;
   }
   setMessage({ type: "error", text: e instanceof Error ? e.message : "Could not complete the trade-in." });
  } finally {
   setSubmitting(false);
   if (!leaving) completingRef.current = false;
  }
 };

 const received = {
  id_front: !!files.id_front,
  id_back: !!files.id_back,
  signature: !!files.signature,
 };

 return (
  <div className="min-h-screen bg-gray-50 p-6">
   <UsePhoneModal
    open={phoneOpen}
    onClose={() => setPhoneOpen(false)}
    tradeInId={draftId}
    received={received}
    termsAccepted={termsAccepted}
    termsRequired={termsRequired}
   />

   <div className="mx-auto mb-4 flex max-w-6xl flex-wrap items-center justify-between gap-3">
    <div className="flex items-center gap-3">
     <Link href="/trade-ins" className="rounded-lg p-2 text-gray-600 hover:bg-white" aria-label="Back to trade-ins">
      <ArrowLeft className="h-5 w-5" />
     </Link>
     <div>
      <h1 className="text-xl font-semibold text-gray-900">New trade-in</h1>
      <p className="text-sm text-gray-500">Buy a device from a customer and add it straight to stock.</p>
     </div>
    </div>
    <button
     type="button"
     onClick={openPhone}
     className="inline-flex items-center gap-2 rounded-lg border border-lime-300 bg-lime-50 px-3 py-2 text-sm font-medium text-lime-900 hover:bg-lime-100"
    >
     <Smartphone className="h-4 w-4" />
     Use phone
    </button>
   </div>

   {(p.optionsError.sendTo || p.optionsError.tax || p.optionsError.categories) && (
    <div className="mx-auto mb-4 flex max-w-6xl items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
     <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-600" />
     <span className="flex-1">Couldn&apos;t load some item options. Check your connection.</span>
     <button
      type="button"
      onClick={p.retryFailedOptions}
      className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
     >
      <RotateCcw className="h-3.5 w-3.5" /> Retry
     </button>
    </div>
   )}

   <div className="mx-auto max-w-6xl overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
    <Section icon={User} title="Customer" hint="The person selling the device(s).">
     <div className="grid gap-3 md:grid-cols-3">
      <label className="block">
       <span className="mb-1 block text-xs font-medium text-gray-600">Name *</span>
       <input
        className={inputCls}
        value={customer.name}
        maxLength={100}
        onChange={(e) => setCustomer((c) => ({ ...c, name: e.target.value }))}
        placeholder="Full name"
        autoComplete="off"
       />
      </label>
      <label className="block">
       <span className="mb-1 block text-xs font-medium text-gray-600">Mobile *</span>
       <input
        className={inputCls}
        value={customer.phone}
        maxLength={40}
        inputMode="tel"
        onChange={(e) => setCustomer((c) => ({ ...c, phone: e.target.value }))}
        placeholder="07…"
        autoComplete="off"
       />
      </label>
      <label className="block">
       <span className="mb-1 block text-xs font-medium text-gray-600">Email</span>
       <input
        className={inputCls}
        type="email"
        value={customer.email}
        onChange={(e) => setCustomer((c) => ({ ...c, email: e.target.value }))}
        placeholder="Optional"
        autoComplete="off"
       />
      </label>
     </div>
     <label className="mt-3 block">
      <span className="mb-1 block text-xs font-medium text-gray-600">Notes</span>
      <textarea
       className={`${inputCls} resize-none`}
       rows={2}
       maxLength={2000}
       value={notes}
       onChange={(e) => setNotes(e.target.value)}
       placeholder="Anything to remember about this trade-in"
      />
     </label>
    </Section>

    <section className="border-b border-gray-200 p-3">
     <div className="mb-2 px-1">
      <h2 className="text-sm font-semibold text-gray-900">Devices</h2>
      <p className="text-xs text-gray-500">
       Same as Add Purchase. <strong className="font-medium text-gray-700">Purchase price</strong> = what you pay the
       customer; <strong className="font-medium text-gray-700">Sale price</strong> = your selling price. Use the note for
       condition (e.g. &quot;scratch on screen&quot;).
      </p>
     </div>
     <ItemForm
      variant="inline"
      data={p.itemData}
      currencySymbol={p.currencySymbol}
      totalIMEIs={p.totalIMEIs}
      imeiQuantity={0}
      savedItems={p.savedItems}
      allSavedIMEICount={p.savedIMEICount}
      sendToOptions={p.sendToOptions}
      taxCategories={p.taxCategories}
      types={p.types}
      typesForNonSerial={p.typesForNonSerial}
      optionsLoading={p.optionsLoading}
      optionsError={p.optionsError}
      onRetryOptions={p.retryFailedOptions}
      makes={p.makes}
      grades={p.grades}
      brands={p.brands}
      brandModels={p.brandModels}
      capacities={p.capacities}
      colours={p.colours}
      showGradeImei={p.showGradeImei}
      showBrandImei={p.showBrandImei}
      showStorageImei={p.showStorageImei}
      showColorImei={p.showColorImei}
      showGradeOther={p.showGradeOther}
      showBrandOther={p.showBrandOther}
      showStorageOther={p.showStorageOther}
      showColorOther={p.showColorOther}
      onChange={p.handleItemChange}
      onSubmit={handleComplete}
      onReset={p.handleReset}
      onAddItem={p.handleAddItem}
      canAddSerialItem={p.canAddSerialItem}
      onRemoveItem={p.handleRemoveItem}
      onEditItem={p.handleEditItem}
      mode={p.itemMode}
      onModeChange={p.setItemMode}
      otherItemData={p.otherItemData}
      otherQuantityLimit={0}
      savedOtherItems={p.savedOtherItems}
      savedOtherQuantity={p.savedOtherQuantity}
      totalOtherQuantity={p.totalOtherQuantity}
      onOtherItemChange={p.handleOtherItemChange}
      onAddOtherItem={p.handleAddOtherItem}
      onRemoveOtherItem={p.handleRemoveOtherItem}
      onEditOtherItem={p.handleEditOtherItem}
      onSearchNonSerialProducts={p.searchNonSerialProducts}
      onSelectNonSerialProduct={p.selectNonSerialProduct}
      onSearchSerialProducts={p.searchSerialProducts}
      onSelectSerialProduct={p.selectSerialProduct}
      allowCreateVariantValues={allowCreateVariantValues}
      onAddBrand={p.addBrand}
      onAddModel={p.addModelUnderBrand}
      onAddCapacity={p.addCapacity}
      onAddColour={p.addColour}
      onAddGrade={p.addGrade}
      categoryVariantAttributesImei={p.categoryVariantAttributesImei}
      categoryVariantAttributesOther={p.categoryVariantAttributesOther}
      onVariantChange={p.handleItemVariantChange}
      onVariantModelChange={p.handleItemVariantModelChange}
      onOtherVariantChange={p.handleOtherItemVariantChange}
      onOtherVariantModelChange={p.handleOtherItemVariantModelChange}
      onAddValueForAttribute={p.addValueForAttribute}
      onAddModelForAttribute={p.addModelForAttribute}
      onAddChildForModelAttribute={p.addChildForModelAttribute}
      onAddValueAtPath={p.addValueAtPath}
      onEditVariantAtPath={p.updateVariantValueAtPath}
      onDeleteVariantAtPath={p.deleteVariantValueAtPath}
      getVariantOptionsForAttributeIndex={p.getVariantOptionsForAttributeIndex}
     />
    </section>

    <Section
     icon={IdCard}
     title="ID document"
     hint="Optional. Photo of the customer's ID — front and back."
     right={
      <button
       type="button"
       onClick={openPhone}
       className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
      >
       <Smartphone className="h-3.5 w-3.5" /> No camera? Use phone
      </button>
     }
    >
     <div className="grid max-w-xl grid-cols-2 gap-3">
      <IdPhotoTile
       label="Front"
       dataUrl={files.id_front?.dataUrl ?? null}
       uploadedVia={files.id_front?.meta.uploadedVia}
       busy={!!busy.id_front}
       onPick={(f) => uploadPhoto("id_front", f)}
       onRemove={() => removeFile("id_front")}
      />
      <IdPhotoTile
       label="Back"
       dataUrl={files.id_back?.dataUrl ?? null}
       uploadedVia={files.id_back?.meta.uploadedVia}
       busy={!!busy.id_back}
       onPick={(f) => uploadPhoto("id_back", f)}
       onRemove={() => removeFile("id_back")}
      />
     </div>
    </Section>

    <Section icon={FileText} title="Terms & signature" hint="The customer reads the terms, accepts and signs — here or on the phone.">
     {metaError && (
      <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
       Couldn&apos;t load the trade-in terms. Refresh the page to try again.
      </p>
     )}
     {termsRequired ? (
      <>
       <div className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
        {termsText}
       </div>
       <label className="mt-3 flex items-start gap-2 text-sm text-gray-800">
        <input
         type="checkbox"
         className="mt-0.5 h-4 w-4 rounded border-gray-300 text-lime-600 focus:ring-lime-500"
         checked={termsAccepted}
         disabled={termsBusy}
         onChange={(e) => toggleTerms(e.target.checked)}
        />
        <span>
         The customer has read and accepts the terms &amp; conditions.
         {termsAccepted && termsVia === "phone" && (
          <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-lime-50 px-2 py-0.5 text-[11px] font-medium text-lime-800">
           <Smartphone className="h-3 w-3" /> accepted on phone
          </span>
         )}
        </span>
       </label>
      </>
     ) : (
      meta && (
       <p className="text-xs text-gray-500">
        No trade-in terms are set. You can add them in Settings → Notes &amp; Terms.
       </p>
      )
     )}

     <div className="mt-4 max-w-xl">
      <span className="mb-1 flex items-center gap-1.5 text-xs font-medium text-gray-600">
       <PenLine className="h-3.5 w-3.5" /> Customer signature *
      </span>
      {files.signature ? (
       <div className="rounded-xl border border-gray-200 bg-white p-3">
        {files.signature.dataUrl ? (
         // eslint-disable-next-line @next/next/no-img-element
         <img src={files.signature.dataUrl} alt="Customer signature" className="h-28 w-full object-contain" />
        ) : (
         <div className="flex h-28 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
         </div>
        )}
        <div className="mt-2 flex items-center justify-between text-xs">
         <span className="inline-flex items-center gap-1 text-green-700">
          <CheckCircle2 className="h-3.5 w-3.5" /> Signed{files.signature.meta.uploadedVia === "phone" ? " on phone" : ""}
         </span>
         <button
          type="button"
          onClick={() => removeFile("signature")}
          disabled={!!busy.signature}
          className="font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50"
         >
          Sign again
         </button>
        </div>
       </div>
      ) : (
       <>
        <SignaturePad ref={sigRef} onChange={setSigHasInk} height={170} disabled={!!busy.signature} />
        <button
         type="button"
         onClick={saveSignature}
         disabled={!sigHasInk || !!busy.signature}
         className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-40"
        >
         {busy.signature ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
         Save signature
        </button>
       </>
      )}
     </div>
    </Section>

    <Section icon={Wallet} title="Payment to customer">
     <div className="flex flex-wrap items-end gap-6">
      <label className="block">
       <span className="mb-1 block text-xs font-medium text-gray-600">Paid by</span>
       <select
        className={inputCls}
        value={payoutMethod}
        onChange={(e) => setPayoutMethod(e.target.value as PayoutMethod)}
       >
        {(Object.keys(PAYOUT_LABELS) as PayoutMethod[]).map((k) => (
         <option key={k} value={k}>
          {PAYOUT_LABELS[k]}
         </option>
        ))}
       </select>
      </label>
      <div>
       <span className="block text-xs font-medium text-gray-600">Total to pay</span>
       <span className="text-2xl font-semibold text-gray-900">
        {p.currencySymbol}
        {total.toFixed(2)}
       </span>
       <span className="ml-2 text-xs text-gray-500">
        {units} item{units === 1 ? "" : "s"}
       </span>
      </div>
     </div>
    </Section>

    <div className="flex flex-wrap items-center justify-end gap-3 p-4">
     {message.text && (
      <span className={`text-sm font-medium ${message.type === "error" ? "text-red-600" : "text-green-600"}`} role="alert">
       {message.text}
      </span>
     )}
     <button
      type="button"
      onClick={handleComplete}
      disabled={submitting}
      className="inline-flex items-center gap-2 rounded-lg bg-lime-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-lime-800 disabled:cursor-not-allowed disabled:opacity-50"
     >
      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
      {submitting ? "Completing…" : "Complete trade-in"}
     </button>
    </div>
   </div>
  </div>
 );
}
