"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { RotateCcw, Save, Pencil, X, Package, AlertTriangle, Loader2 } from "lucide-react";
import { useAddPurchase } from "./hooks/useAddPurchase";
import {
 PageHeader,
 ParcelForm,
 QuantityForm,
 ItemForm,
 ParcelDetailsSummary,
} from "./components";
import { HelpTip } from "@/components/HelpTip";
import { AddAccountModal } from "../../customers/components/AddAccountModal";

const NOOP = () => {};

const AddPurchasePage = () => {
 const searchParams = useSearchParams();
 const importSerialByCategory = searchParams.get("import") === "serial-by-category";
 const [importBannerDismissed, setImportBannerDismissed] = useState(false);

 const {
 detailsSaved,
 handleSaveDetails,
 handleEditDetails,
 parcelData,
 quantityData,
 itemData,
 currencies,
 accountOptions,
 addAccountModalOpen,
 setAddAccountModalOpen,
 addAccountSaving,
 createCustomerFromParcel,
 createSupplierFromParcel,
 sendToOptions,
 taxCategories,
 types,
 typesForNonSerial,
 optionsError,
 optionsLoading,
 retryFailedOptions,
 makes,
 grades,
 brands,
 brandModels,
 capacities,
 colours,
 showGradeImei,
 showBrandImei,
 showStorageImei,
 showColorImei,
 showGradeOther,
 showBrandOther,
 showStorageOther,
 showColorOther,
 totalIMEIs,
 savedItems,
 savedIMEICount,
 handleParcelChange,
 handleQuantityChange,
 handleItemChange,
 handleItemSubmit,
 handleAddItem,
 handleRemoveItem,
 handleEditItem,
 handleBack,
 handleReset,
 currencySymbol,
 isSubmitting,
 submitMessage,
 itemMode,
 setItemMode,
 otherItemData,
 savedOtherItems,
 savedOtherQuantity,
 totalOtherQuantity,
 handleOtherItemChange,
 handleAddOtherItem,
 handleRemoveOtherItem,
 handleEditOtherItem,
 searchNonSerialProducts,
 selectNonSerialProduct,
 searchSerialProducts,
 selectSerialProduct,
 addBrand,
 addModelUnderBrand,
 addCapacity,
 addColour,
 addGrade,
 categoryVariantAttributesImei,
 categoryVariantAttributesOther,
 handleItemVariantChange,
 handleItemVariantModelChange,
 handleOtherItemVariantChange,
 handleOtherItemVariantModelChange,
 addValueForAttribute,
 addModelForAttribute,
 addChildForModelAttribute,
 addValueAtPath,
 updateVariantValueAtPath,
 deleteVariantValueAtPath,
 getVariantOptionsForAttributeIndex,
 canAddSerialItem,
 } = useAddPurchase();

 useEffect(() => {
 if (importSerialByCategory) setItemMode("imei");
 }, [importSerialByCategory, setItemMode]);

 // Stable callback: syncs date/note to both parcel and quantity forms
 const handleParcelAndQuantityChange = useCallback(
 (field: string, value: string) => {
 handleParcelChange(field as never, value);
 if (field === "date" || field === "note") handleQuantityChange(field as never, value);
 },
 [handleParcelChange, handleQuantityChange]
 );

 const closeAccountModal = useCallback(() => setAddAccountModalOpen(false), [setAddAccountModalOpen]);
 const openAccountModal = useCallback(() => setAddAccountModalOpen(true), [setAddAccountModalOpen]);

 const imeiQuantity = useMemo(() => parseInt(quantityData.imeiQuantity) || 0, [quantityData.imeiQuantity]);
 const otherQuantityLimit = useMemo(() => parseInt(quantityData.otherQuantity) || 0, [quantityData.otherQuantity]);

 return (
 <div className="min-h-screen bg-gray-50 p-6">
 <AddAccountModal
 open={addAccountModalOpen}
 onClose={closeAccountModal}
 onCreateCustomer={createCustomerFromParcel}
 onCreateSupplier={createSupplierFromParcel}
 isLoading={addAccountSaving}
 />
 <div className="mb-4">
 <PageHeader onBack={handleBack} />
 </div>

 {importSerialByCategory && !importBannerDismissed && (
 <div className="max-w-6xl mx-auto mb-4 flex items-start gap-3 p-4 rounded-lg bg-orange-50 border border-orange-200">
  <Package className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
  <div className="flex-1 min-w-0 flex flex-wrap items-center gap-2">
  <p className="text-sm font-medium text-orange-900">Import purchase (category-wise for serial items)</p>
  <HelpTip
  ariaLabel="How category-wise import works"
  contentClassName="border-orange-200 bg-orange-50/95 text-orange-950"
  iconClassName="h-4 w-4 text-orange-700"
  >
  <p>
  Save purchase details above, then select a category in <strong>IMEI Items</strong>, add your IMEIs/serials (one per line or comma-separated). Change category to add another group of serials, then submit.
  </p>
  </HelpTip>
  </div>
  <button
  type="button"
  onClick={() => setImportBannerDismissed(true)}
  className="p-1.5 text-orange-600 hover:bg-orange-100 rounded"
  aria-label="Dismiss"
  >
  <X className="h-4 w-4" />
  </button>
 </div>
 )}

 {(optionsError.sendTo || optionsError.tax || optionsError.categories) && (
 <div className="max-w-6xl mx-auto mb-4 flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
  <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
  <div className="flex-1 min-w-0 text-sm text-red-900">
  <span className="font-medium">Couldn&apos;t load some options:</span>{" "}
  {[
   optionsError.sendTo && "Send To",
   optionsError.tax && "Tax",
   optionsError.categories && "Category",
  ].filter(Boolean).join(", ")}
  . Check your connection and retry.
  </div>
  <button
  type="button"
  onClick={retryFailedOptions}
  disabled={optionsLoading}
  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-medium disabled:opacity-50"
  >
  {optionsLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
  Retry
  </button>
 </div>
 )}

 <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
 {/* Parcel + Quantity: one compact block */}
 <div className="p-3 border-b border-gray-200 space-y-3">
  <div className="flex items-center justify-between gap-3 flex-wrap">
  <h2 className="text-sm font-semibold text-gray-800">Purchase &amp; quantity</h2>
  {detailsSaved ? (
  <button
  type="button"
  onClick={handleEditDetails}
  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-medium rounded-lg transition-colors"
  >
  <Pencil className="w-3.5 h-3.5 mr-1.5" />
  Edit
  </button>
  ) : null}
  </div>
  {detailsSaved ? (
  <ParcelDetailsSummary
  parcelData={parcelData}
  quantityData={quantityData}
  accountOptions={accountOptions}
  enteredImeiQty={totalIMEIs}
  enteredOtherQty={totalOtherQuantity}
  />
  ) : (
  <>
  <ParcelForm
  variant="inline"
  data={parcelData}
  currencies={currencies}
  accountOptions={accountOptions}
  onChange={handleParcelAndQuantityChange}
  onSubmit={handleSaveDetails}
  onReset={handleReset}
  readOnly={false}
  onAddAccount={openAccountModal}
  addAccountDisabled={addAccountSaving}
  />
  <QuantityForm
  variant="inline"
  data={quantityData}
  onChange={handleQuantityChange}
  onSubmit={NOOP}
  onReset={handleReset}
  readOnly={false}
  inlineEnd={
   <button
   type="button"
   onClick={() => handleSaveDetails()}
   disabled={
   !parcelData.account ||
   !String(quantityData.imeiQuantity || "").trim() ||
   !String(quantityData.otherQuantity || "").trim()
   }
   className="inline-flex w-full items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
   >
   <Save className="w-3.5 h-3.5 shrink-0" />
   Save
   </button>
  }
  />
  </>
  )}
 </div>

 {/* Item Entry - enabled only after details saved */}
 <div
  className={`p-3 border-b border-gray-200 relative ${!detailsSaved ? "opacity-60 pointer-events-none" : ""}`}
 >
  {!detailsSaved && (
  <div className="absolute inset-0 flex items-center justify-center bg-white rounded z-10 pointer-events-none">
  <div className="flex items-center gap-2 px-4 text-sm font-medium text-gray-600">
  <span>Item entry locked</span>
  <span className="pointer-events-auto">
   <HelpTip ariaLabel="Why item entry is locked" contentClassName="font-normal text-slate-700">
   Save purchase details and quantities above first. Then you can add IMEI/serial or non-serial lines.
   </HelpTip>
  </span>
  </div>
  </div>
  )}
  <ItemForm
  variant="inline"
  data={itemData}
  currencySymbol={currencySymbol}
  totalIMEIs={totalIMEIs}
  imeiQuantity={imeiQuantity}
  savedItems={savedItems}
  allSavedIMEICount={savedIMEICount}
  sendToOptions={sendToOptions}
  taxCategories={taxCategories}
  types={types}
  typesForNonSerial={typesForNonSerial}
  optionsLoading={optionsLoading}
  optionsError={optionsError}
  onRetryOptions={retryFailedOptions}
  makes={makes}
  grades={grades}
  brands={brands}
  brandModels={brandModels}
  capacities={capacities}
  colours={colours}
  showGradeImei={showGradeImei}
  showBrandImei={showBrandImei}
  showStorageImei={showStorageImei}
  showColorImei={showColorImei}
  showGradeOther={showGradeOther}
  showBrandOther={showBrandOther}
  showStorageOther={showStorageOther}
  showColorOther={showColorOther}
  onChange={handleItemChange}
  onSubmit={handleItemSubmit}
  onReset={handleReset}
  onAddItem={handleAddItem}
  canAddSerialItem={canAddSerialItem}
  onRemoveItem={handleRemoveItem}
  onEditItem={handleEditItem}
  mode={itemMode}
  onModeChange={setItemMode}
  otherItemData={otherItemData}
  otherQuantityLimit={otherQuantityLimit}
  savedOtherItems={savedOtherItems}
  savedOtherQuantity={savedOtherQuantity}
  totalOtherQuantity={totalOtherQuantity}
  onOtherItemChange={handleOtherItemChange}
  onAddOtherItem={handleAddOtherItem}
  onRemoveOtherItem={handleRemoveOtherItem}
  onEditOtherItem={handleEditOtherItem}
  onSearchNonSerialProducts={searchNonSerialProducts}
  onSelectNonSerialProduct={selectNonSerialProduct}
  onSearchSerialProducts={searchSerialProducts}
  onSelectSerialProduct={selectSerialProduct}
  onAddBrand={addBrand}
  onAddModel={addModelUnderBrand}
  onAddCapacity={addCapacity}
  onAddColour={addColour}
  onAddGrade={addGrade}
  categoryVariantAttributesImei={categoryVariantAttributesImei}
  categoryVariantAttributesOther={categoryVariantAttributesOther}
  onVariantChange={handleItemVariantChange}
  onVariantModelChange={handleItemVariantModelChange}
  onOtherVariantChange={handleOtherItemVariantChange}
  onOtherVariantModelChange={handleOtherItemVariantModelChange}
  onAddValueForAttribute={addValueForAttribute}
  onAddModelForAttribute={addModelForAttribute}
  onAddChildForModelAttribute={addChildForModelAttribute}
  onAddValueAtPath={addValueAtPath}
  onEditVariantAtPath={updateVariantValueAtPath}
  onDeleteVariantAtPath={deleteVariantValueAtPath}
  getVariantOptionsForAttributeIndex={getVariantOptionsForAttributeIndex}
  />
 </div>

 {/* Single footer: Reset + Submit parcel */}
 <div className="p-3 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
  <button
  type="button"
  onClick={handleReset}
  className="inline-flex items-center px-3 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium rounded-lg transition-colors"
  >
  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
  Reset
  </button>
  <div className="flex items-center gap-2">
  {submitMessage.text && (
  <span
  className={`text-xs font-medium ${
   submitMessage.type === "success" ? "text-green-600" : submitMessage.type === "error" ? "text-red-600" : ""
  }`}
  >
  {submitMessage.text}
  </span>
  )}
  <button
  onClick={handleItemSubmit}
  disabled={isSubmitting || !detailsSaved || !parcelData.account}
  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
  >
  <Save className="w-3.5 h-3.5 mr-1.5" />
  {isSubmitting ? "Submitting…" : "Add purchase to inventory"}
  </button>
  </div>
 </div>
 </div>
 </div>
 );
};

export default AddPurchasePage;
