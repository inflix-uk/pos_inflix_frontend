"use client";

import React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useCreateSingleProduct } from "./hooks/useCreateSingleProduct";
import { ProductTypeChoice } from "./components";
import { usePermissions } from "@/hooks/usePermissions";

const SingleProductForm = dynamic(
 () =>
 import("./components/SingleProductForm").then((m) => ({
 default: m.SingleProductForm,
 })),
 {
 loading: () => (
 <div className="p-4 space-y-3 animate-pulse" aria-busy="true" aria-label="Loading form">
 <div className="h-6 w-40 rounded bg-gray-100" />
 <div className="h-3 w-full max-w-md rounded bg-gray-100" />
 <div className="grid grid-cols-1 @[768px]:grid-cols-2 gap-3 pt-3">
  <div className="h-20 rounded-lg bg-gray-50" />
  <div className="h-20 rounded-lg bg-gray-50" />
 </div>
 </div>
 ),
 ssr: false,
 }
);

export default function CreateProductPage() {
 const { can } = usePermissions();
 const allowCreateVariantValues = can("variant_attribute.create");
 const {
 productAddMode,
 setProductAddMode,
 parcelData,
 updateParcelData,
 suppliers,
 serialData,
 nonSerialData,
 updateSerialData,
 updateNonSerialData,
 sendToOptions,
 taxCategories,
 typesSerial,
 typesNonSerial,
 categoryVariantAttributes,
 getVariantOptionsForAttributeIndex,
 addValueAtPath,
 currentImeiCount,
 isLoadingOptions,
 isCategoryTypesLoading,
 isSubmitting,
 message,
 submitSerial,
 submitNonSerial,
 resetSerial,
 resetNonSerial,
 goBackToChoice,
 } = useCreateSingleProduct();

 return (
 <div className="@container min-h-screen bg-gray-50 p-2 @[640px]:p-3 @[768px]:p-4">
 {message.text && (
 <div
  className={`fixed top-4 right-4 z-50 px-2.5 @[640px]:px-3 py-1.5 @[640px]:py-2 rounded-lg shadow-lg text-xs @[640px]:text-sm ${
  message.type === "success"
  ? "bg-green-100 text-green-700 border border-green-400"
  : "bg-red-100 text-red-700 border border-red-400"
  }`}
 >
  {message.text}
 </div>
 )}

 <div className="mb-2 @[640px]:mb-3 flex flex-col gap-1">
 <Link
  href="/inventory/products"
  className="inline-flex items-center gap-1 @[640px]:gap-1.5 text-xs @[640px]:text-sm text-gray-600 hover:text-gray-800"
 >
  <ArrowLeft className="h-3.5 w-3.5 @[640px]:h-4 @[640px]:w-4" />
  Back to products
 </Link>
 <p className="text-[11px] @[640px]:text-xs text-gray-500">
  To set customer group prices (e.g. Wholesale, VIP), save the item then edit it from the product list.
 </p>
 </div>

 <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 overflow-visible min-h-[24rem]">
 {productAddMode === null && (
  <ProductTypeChoice
  onSelect={(mode) => setProductAddMode(mode)}
  isLoading={isLoadingOptions}
  />
 )}

 {productAddMode === "serial" && (
  <SingleProductForm
  mode="serial"
  parcelData={parcelData}
  onParcelChange={updateParcelData}
  suppliers={suppliers}
  serialData={serialData}
  nonSerialData={nonSerialData}
  onSerialChange={updateSerialData}
  onNonSerialChange={updateNonSerialData}
  sendToOptions={sendToOptions}
  taxCategories={taxCategories}
  types={typesSerial}
  categoryVariantAttributes={categoryVariantAttributes}
  getVariantOptionsForAttributeIndex={getVariantOptionsForAttributeIndex}
  onAddValueAtPath={addValueAtPath}
  allowCreateVariantValues={allowCreateVariantValues}
  currentImeiCount={currentImeiCount}
  isCategoryTypesLoading={isCategoryTypesLoading}
  onSubmit={submitSerial}
  onReset={resetSerial}
  onBack={goBackToChoice}
  isSubmitting={isSubmitting}
  />
 )}

 {productAddMode === "non-serial" && (
  <SingleProductForm
  mode="non-serial"
  parcelData={parcelData}
  onParcelChange={updateParcelData}
  suppliers={suppliers}
  serialData={serialData}
  nonSerialData={nonSerialData}
  onSerialChange={updateSerialData}
  onNonSerialChange={updateNonSerialData}
  sendToOptions={sendToOptions}
  taxCategories={taxCategories}
  types={typesNonSerial}
  categoryVariantAttributes={categoryVariantAttributes}
  getVariantOptionsForAttributeIndex={getVariantOptionsForAttributeIndex}
  onAddValueAtPath={addValueAtPath}
  allowCreateVariantValues={allowCreateVariantValues}
  currentImeiCount={0}
  isCategoryTypesLoading={isCategoryTypesLoading}
  onSubmit={submitNonSerial}
  onReset={resetNonSerial}
  onBack={goBackToChoice}
  isSubmitting={isSubmitting}
  />
 )}
 </div>
 </div>
 );
}
