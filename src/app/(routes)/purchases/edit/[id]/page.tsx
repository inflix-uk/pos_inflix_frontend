"use client";

import React from "react";
import { Save, Pencil, RotateCcw, Loader2, ChevronDown } from "lucide-react";
import { useEditPurchase } from "./hooks/useEditPurchase";
import {
 PageHeader,
 ParcelForm,
 QuantityForm,
 ItemForm,
 ParcelDetailsSummary,
} from "../../add/components";
import { usePermissions } from "@/hooks/usePermissions";

const labelCls = "block text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1";

const EditPurchasePage = () => {
 const { can } = usePermissions();
 const allowCreateVariantValues = can("variant_attribute.create");
 const {
 detailsSaved,
 handleSaveDetails,
 handleEditDetails,
 parcelData,
 quantityData,
 itemData,
 currencies,
 accountOptions,
 sendToOptions,
 taxCategories,
 types,
 typesForNonSerial,
 makes,
 grades,
 brands,
 brandModels,
 capacities,
 colours,
 totalIMEIs,
 savedItems,
 savedIMEICount,
 status,
 setStatus,
 paymentStatus,
 setPaymentStatus,
 paid,
 setPaid,
 isLoadingData,
 loadError,
 isSubmitting,
 submitMessage,
 handleParcelChange,
 handleQuantityChange,
 handleItemChange,
 handleItemSubmit,
 handleAddItem,
 handleRemoveItem,
 handleEditItem,
 handleBack,
 handleReset,
 getCurrencySymbol,
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
 categoryVariantAttributesImei,
 categoryVariantAttributesOther,
 getVariantOptionsForAttributeIndex,
 addValueAtPath,
 updateVariantValueAtPath,
 deleteVariantValueAtPath,
 handleItemVariantChange,
 handleItemVariantModelChange,
 handleOtherItemVariantChange,
 handleOtherItemVariantModelChange,
 } = useEditPurchase();

 if (isLoadingData) {
 return (
 <div className="min-h-screen bg-gray-50 flex items-center justify-center">
 <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
 </div>
 );
 }

 if (loadError) {
 return (
 <div className="min-h-screen bg-gray-50 p-4">
 <div className="bg-red-100 text-red-700 px-3 py-2 rounded-lg text-sm">{loadError}</div>
 <button
  onClick={() => handleBack()}
  className="mt-3 inline-flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
 >
  Back to list
 </button>
 </div>
 );
 }

 return (
 <div className="min-h-screen bg-gray-50 p-4">
 {submitMessage.text && (
 <div
  className={`mb-3 px-3 py-2 rounded-lg text-sm ${
  submitMessage.type === "success"
  ? "bg-green-100 text-green-700"
  : "bg-red-100 text-red-700"
  }`}
 >
  {submitMessage.text}
 </div>
 )}

 <div className="mb-3">
 <PageHeader
  onBack={handleBack}
  title="Edit Purchase"
  subtitle="Update purchase details"
 />
 </div>

 <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
 {/* Status / Payment */}
 <div className="p-3 border-b border-gray-200">
  <h3 className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">Purchase Status</h3>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
  <div>
  <label className={labelCls}>Status</label>
  <div className="relative">
  <select
   value={status}
   onChange={(e) => setStatus(e.target.value as "Received" | "Pending" | "Ordered")}
   className="block w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
  >
   <option value="Received">Received</option>
   <option value="Pending">Pending</option>
   <option value="Ordered">Ordered</option>
  </select>
  <ChevronDown
   size={16}
   className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
  />
  </div>
  </div>
  <div>
  <label className={labelCls}>Payment status</label>
  <div className="relative">
  <select
   value={paymentStatus}
   onChange={(e) => setPaymentStatus(e.target.value as "Paid" | "Unpaid" | "Partial")}
   className="block w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
  >
   <option value="Paid">Paid</option>
   <option value="Unpaid">Unpaid</option>
   <option value="Partial">Partial</option>
  </select>
  <ChevronDown
   size={16}
   className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
  />
  </div>
  </div>
  <div>
  <label className={labelCls}>Paid amount</label>
  <div className="relative">
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
   <span className="text-gray-500 text-sm font-medium">{getCurrencySymbol()}</span>
  </div>
  <input
   type="number"
   value={paid}
   onChange={(e) => setPaid(e.target.value)}
   className="block w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
   min="0"
   step="0.01"
  />
  </div>
  </div>
  </div>
 </div>

 {/* Parcel & quantity */}
 <div className="p-3 border-b border-gray-200 space-y-3">
  <div className="flex items-center justify-between gap-3 flex-wrap">
  <h2 className="text-sm font-semibold text-gray-800">Purchase & quantity</h2>
  {detailsSaved ? (
  <button
  type="button"
  onClick={handleEditDetails}
  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 font-medium rounded-lg transition-colors"
  >
  <Pencil className="w-3.5 h-3.5 mr-1.5" />
  Edit
  </button>
  ) : (
  <button
  type="button"
  onClick={() => handleSaveDetails()}
  disabled={
   !parcelData.account ||
   !String(quantityData.imeiQuantity || "").trim() ||
   !String(quantityData.otherQuantity || "").trim()
  }
  className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
  >
  <Save className="w-3.5 h-3.5 mr-1.5" />
  Save
  </button>
  )}
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
  onChange={(field, value) => {
   handleParcelChange(field, value);
   if (field === "date" || field === "note") handleQuantityChange(field, value);
  }}
  onSubmit={() => { handleSaveDetails(); return true; }}
  onReset={handleReset}
  readOnly={false}
  />
  <QuantityForm
  variant="inline"
  data={quantityData}
  onChange={handleQuantityChange}
  onSubmit={() => {}}
  onReset={handleReset}
  readOnly={false}
  />
  </>
  )}
 </div>

 {/* Item entry */}
 <div className="p-3 border-b border-gray-200">
  <ItemForm
  variant="inline"
  data={itemData}
  currencySymbol={getCurrencySymbol()}
  totalIMEIs={totalIMEIs}
  imeiQuantity={parseInt(quantityData.imeiQuantity) || 0}
  savedItems={savedItems}
  allSavedIMEICount={savedIMEICount}
  sendToOptions={sendToOptions}
  taxCategories={taxCategories}
  types={types}
  typesForNonSerial={typesForNonSerial}
  makes={makes}
  grades={grades}
  brands={brands}
  brandModels={brandModels}
  capacities={capacities}
  colours={colours}
  onChange={handleItemChange}
  onSubmit={handleItemSubmit}
  onReset={handleReset}
  onAddItem={handleAddItem}
  canAddSerialItem={true}
  onRemoveItem={handleRemoveItem}
  onEditItem={handleEditItem}
  mode={itemMode}
  onModeChange={setItemMode}
  otherItemData={otherItemData}
  otherQuantityLimit={parseInt(quantityData.otherQuantity) || 0}
  savedOtherItems={savedOtherItems}
  savedOtherQuantity={savedOtherQuantity}
  totalOtherQuantity={totalOtherQuantity}
  onOtherItemChange={handleOtherItemChange}
  onAddOtherItem={handleAddOtherItem}
  onRemoveOtherItem={handleRemoveOtherItem}
  onEditOtherItem={handleEditOtherItem}
  categoryVariantAttributesImei={categoryVariantAttributesImei}
  categoryVariantAttributesOther={categoryVariantAttributesOther}
  onVariantChange={handleItemVariantChange}
  onVariantModelChange={handleItemVariantModelChange}
  onOtherVariantChange={handleOtherItemVariantChange}
  onOtherVariantModelChange={handleOtherItemVariantModelChange}
  allowCreateVariantValues={allowCreateVariantValues}
  onAddValueAtPath={addValueAtPath}
  onEditVariantAtPath={updateVariantValueAtPath}
  onDeleteVariantAtPath={deleteVariantValueAtPath}
  getVariantOptionsForAttributeIndex={getVariantOptionsForAttributeIndex}
  />
 </div>

 {/* Footer */}
 <div className="p-3 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
  <button
  type="button"
  onClick={handleReset}
  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 font-medium rounded-lg transition-colors"
  >
  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
  Reset
  </button>
  <button
  onClick={handleItemSubmit}
  disabled={isSubmitting || !detailsSaved || !parcelData.account}
  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
  >
  <Save className="w-3.5 h-3.5 mr-1.5" />
  {isSubmitting ? "Updating…" : "Update purchase"}
  </button>
 </div>
 </div>

 {isSubmitting && (
 <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
  <div className="bg-white rounded-lg px-4 py-3 flex items-center gap-2">
  <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
  <span className="text-sm text-gray-700">Updating purchase...</span>
  </div>
 </div>
 )}
 </div>
 );
};

export default EditPurchasePage;
