"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ImportParcelModal } from "../list/components";

type ImportType = "serial" | "non-serial" | null;

const ImportPurchasePage = () => {
 const searchParams = useSearchParams();
 const router = useRouter();
 const [importType, setImportType] = useState<ImportType>(null);

 useEffect(() => {
 const t = searchParams.get("type");
 if (t === "serial" || t === "non-serial") setImportType(t);
 else setImportType(null);
 }, [searchParams]);

 return (
 <div className="@container min-h-screen bg-gray-50 p-2 @[480px]:p-3 @[640px]:p-4 @[1024px]:p-6">
 <div className="mb-3 @[640px]:mb-4 flex flex-col @[640px]:flex-row @[640px]:items-center @[640px]:justify-between gap-2 @[640px]:gap-3">
  <div>
  <h1 className="text-base @[480px]:text-lg @[1024px]:text-xl font-semibold text-gray-900">
  {importType === "serial"
   ? "Import Serial Items"
   : importType === "non-serial"
   ? "Import Non-Serial Items"
   : "Import Purchase"}
  </h1>
  <p className="text-[11px] @[480px]:text-xs @[640px]:text-sm text-gray-500 mt-0.5">Upload a CSV or Excel file to bulk-create a purchase.</p>
  </div>
  <button
  type="button"
  onClick={() => router.push("/purchases/list")}
  className="px-2.5 @[640px]:px-3 @[1024px]:px-4 py-1.5 @[640px]:py-2 border border-gray-200 rounded-lg text-xs @[640px]:text-sm font-medium text-gray-700 hover:bg-white whitespace-nowrap"
  >
  Back to purchases
  </button>
 </div>

 <ImportParcelModal
  open
  displayMode="page"
  initialImportType={importType}
  onClose={() => router.push("/purchases/list")}
  onSuccess={() => router.push("/purchases/list")}
 />
 </div>
 );
};

export default ImportPurchasePage;
