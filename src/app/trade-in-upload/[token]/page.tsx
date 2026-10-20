"use client";

/**
 * Public phone page opened from the trade-in QR code (no staff login).
 * The token in the URL gives access to one unfinished trade-in for 30 minutes.
 * Lets staff/customer take the ID photos, accept the terms and sign on the phone.
 */
import React, { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Camera, CheckCircle2, Loader2, PenLine, ShieldCheck, TimerOff } from "lucide-react";
import { API_BASE_URL } from "@/lib/apiBase";
import { compressImageFile } from "@/lib/imageCompress";
import SignaturePad, { type SignaturePadHandle } from "@/components/SignaturePad";

type Kind = "id_front" | "id_back" | "signature";

interface Session {
 businessName: string;
 logo: string | null;
 termsText: string;
 termsAccepted: boolean;
 files: { kind: Kind; uploadedVia: string; updatedAt: string }[];
 expiresAt: string;
}

class ExpiredError extends Error {}

function PhoneUploadInner() {
 const params = useParams<{ token: string }>();
 const token = String(params?.token || "");
 const tenant = useSearchParams().get("t") || "";

 const [session, setSession] = useState<Session | null>(null);
 const [loading, setLoading] = useState(true);
 const [expired, setExpired] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [busy, setBusy] = useState<Partial<Record<Kind | "terms", boolean>>>({});
 const [previews, setPreviews] = useState<Partial<Record<Kind, string>>>({});
 const [sigHasInk, setSigHasInk] = useState(false);
 const sigRef = useRef<SignaturePadHandle | null>(null);

 const call = useCallback(
  async <T,>(method: string, path: string, body?: unknown): Promise<T> => {
   const headers: Record<string, string> = { "Content-Type": "application/json" };
   if (tenant) headers["X-Tenant-Id"] = tenant;
   let res: Response;
   try {
    res = await fetch(`${API_BASE_URL}/api/trade-in-upload/${encodeURIComponent(token)}${path}`, {
     method,
     headers,
     body: body === undefined ? undefined : JSON.stringify(body),
    });
   } catch {
    throw new Error("No internet connection. Check the phone's signal and try again.");
   }
   const json = await res.json().catch(() => ({}));
   if (res.status === 410) throw new ExpiredError(json?.message || "This link has expired.");
   if (!res.ok || json?.success === false) throw new Error(json?.message || "Something went wrong. Please try again.");
   return json.data as T;
  },
  [token, tenant]
 );

 const refresh = useCallback(async () => {
  try {
   setSession(await call<Session>("GET", ""));
  } catch (e) {
   if (e instanceof ExpiredError) setExpired(true);
   else setError(e instanceof Error ? e.message : "Could not load.");
  } finally {
   setLoading(false);
  }
 }, [call]);

 useEffect(() => {
  refresh();
 }, [refresh]);

 const handleError = (e: unknown) => {
  if (e instanceof ExpiredError) setExpired(true);
  else setError(e instanceof Error ? e.message : "Something went wrong.");
 };

 const uploadPhoto = async (kind: Kind, file: File) => {
  setError(null);
  setBusy((b) => ({ ...b, [kind]: true }));
  try {
   const dataUrl = await compressImageFile(file);
   await call("PUT", `/files/${kind}`, { dataUrl });
   setPreviews((p) => ({ ...p, [kind]: dataUrl }));
   await refresh();
  } catch (e) {
   handleError(e);
  } finally {
   setBusy((b) => ({ ...b, [kind]: false }));
  }
 };

 const acceptTerms = async () => {
  setError(null);
  setBusy((b) => ({ ...b, terms: true }));
  try {
   await call("POST", "/accept-terms", { accepted: true });
   await refresh();
  } catch (e) {
   handleError(e);
  } finally {
   setBusy((b) => ({ ...b, terms: false }));
  }
 };

 const submitSignature = async () => {
  const dataUrl = sigRef.current?.toDataUrl();
  if (!dataUrl) return;
  setError(null);
  setBusy((b) => ({ ...b, signature: true }));
  try {
   await call("PUT", "/files/signature", { dataUrl });
   setPreviews((p) => ({ ...p, signature: dataUrl }));
   await refresh();
  } catch (e) {
   handleError(e);
  } finally {
   setBusy((b) => ({ ...b, signature: false }));
  }
 };

 if (loading) {
  return (
   <div className="flex min-h-screen items-center justify-center bg-gray-50">
    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
   </div>
  );
 }

 if (expired) {
  return (
   <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gray-50 p-6 text-center">
    <TimerOff className="h-10 w-10 text-gray-400" />
    <h1 className="text-lg font-semibold text-gray-900">This link has expired</h1>
    <p className="max-w-xs text-sm text-gray-600">
     The trade-in may already be finished. Ask the staff to show a new QR code if you still need to upload something.
    </p>
   </div>
  );
 }

 if (!session) {
  return (
   <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6 text-center text-sm text-red-700">
    {error || "Could not load this page."}
   </div>
  );
 }

 const has = (k: Kind) => session.files.some((f) => f.kind === k);
 const termsRequired = session.termsText.trim().length > 0;
 const allDone = has("signature") && (!termsRequired || session.termsAccepted);

 const renderPhotoStep = (kind: Kind, title: string) => {
  const done = has(kind);
  return (
   <div key={kind} className="rounded-2xl bg-white p-4 shadow-sm">
    <div className="mb-3 flex items-center justify-between">
     <h2 className="font-semibold text-gray-900">{title}</h2>
     {done && <CheckCircle2 className="h-5 w-5 text-green-600" />}
    </div>
    {previews[kind] && (
     // eslint-disable-next-line @next/next/no-img-element
     <img src={previews[kind]} alt={title} className="mb-3 max-h-48 w-full rounded-lg object-contain" />
    )}
    <label
     className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold ${
      done ? "border border-gray-300 text-gray-700" : "bg-lime-700 text-white"
     } ${busy[kind] ? "pointer-events-none opacity-60" : ""}`}
    >
     {busy[kind] ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
     {busy[kind] ? "Uploading…" : done ? "Take again" : "Take photo"}
     <input
      type="file"
      accept="image/*"
      capture="environment"
      className="hidden"
      onChange={(e) => {
       const f = e.target.files?.[0];
       e.target.value = "";
       if (f) uploadPhoto(kind, f);
      }}
     />
    </label>
    <p className="mt-2 text-center text-xs text-gray-400">Optional</p>
   </div>
  );
 };

 return (
  <div className="min-h-screen bg-gray-100 pb-10">
   <header className="bg-white px-4 py-4 shadow-sm">
    <div className="mx-auto flex max-w-md items-center gap-3">
     {session.logo && (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={session.logo} alt="" className="h-10 max-w-[120px] object-contain" />
     )}
     <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{session.businessName || "Trade-in"}</p>
      <h1 className="text-lg font-semibold text-gray-900">Trade-in details</h1>
     </div>
    </div>
   </header>

   <main className="mx-auto max-w-md space-y-4 px-4 pt-4">
    {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

    {allDone && (
     <div className="flex items-start gap-3 rounded-2xl bg-green-50 p-4 text-green-800">
      <CheckCircle2 className="mt-0.5 h-6 w-6 flex-shrink-0" />
      <div>
       <p className="font-semibold">All done — thank you!</p>
       <p className="text-sm">Please hand the phone back to the staff. They can now complete the trade-in.</p>
      </div>
     </div>
    )}

    {renderPhotoStep("id_front", "1. ID — front")}
    {renderPhotoStep("id_back", "2. ID — back")}

    {termsRequired && (
     <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
       <h2 className="font-semibold text-gray-900">3. Terms &amp; conditions</h2>
       {session.termsAccepted && <CheckCircle2 className="h-5 w-5 text-green-600" />}
      </div>
      <div className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
       {session.termsText}
      </div>
      {session.termsAccepted ? (
       <p className="mt-3 flex items-center gap-2 text-sm font-medium text-green-700">
        <ShieldCheck className="h-5 w-5" /> You accepted the terms.
       </p>
      ) : (
       <button
        type="button"
        onClick={acceptTerms}
        disabled={!!busy.terms}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-lime-700 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
       >
        {busy.terms ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
        I have read and accept
       </button>
      )}
     </div>
    )}

    <div className="rounded-2xl bg-white p-4 shadow-sm">
     <div className="mb-3 flex items-center justify-between">
      <h2 className="flex items-center gap-2 font-semibold text-gray-900">
       <PenLine className="h-4 w-4" /> {termsRequired ? "4." : "3."} Signature
      </h2>
      {has("signature") && <CheckCircle2 className="h-5 w-5 text-green-600" />}
     </div>
     {has("signature") && previews.signature ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={previews.signature} alt="Your signature" className="mb-3 h-28 w-full object-contain" />
     ) : has("signature") ? (
      <p className="mb-3 text-sm text-green-700">Signature received.</p>
     ) : null}
     {!has("signature") && (
      <>
       {termsRequired && !session.termsAccepted && (
        <p className="mb-2 text-xs text-amber-700">Please accept the terms above before signing.</p>
       )}
       <SignaturePad ref={sigRef} onChange={setSigHasInk} height={200} disabled={termsRequired && !session.termsAccepted} />
       <button
        type="button"
        onClick={submitSignature}
        disabled={!sigHasInk || !!busy.signature || (termsRequired && !session.termsAccepted)}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-lime-700 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
       >
        {busy.signature ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
        Submit signature
       </button>
      </>
     )}
    </div>

    <p className="px-2 text-center text-xs text-gray-400">
     Photos are sent securely to the shop and are only used as a record of this sale.
    </p>
   </main>
  </div>
 );
}

export default function PhoneUploadPage() {
 return (
  <Suspense
   fallback={
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
     <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
    </div>
   }
  >
   <PhoneUploadInner />
  </Suspense>
 );
}
