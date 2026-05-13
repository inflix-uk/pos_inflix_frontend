"use client";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEditProductForm } from "./hooks";
import {
 Header,
 ProductInformation,
 PricingStocks,
 ImagesSection,
 CustomFields,
} from "../../inventory/create-product/components";
import {
 QuickAddStoreModal,
 QuickAddWarehouseModal,
 QuickAddCategoryModal,
 QuickAddSubCategoryModal,
 QuickAddUnitModal,
 QuickAddBrandModal,
} from "../../inventory/create-product/components/QuickAddModals";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { pricingGroupApi } from "../../peoples/customers/service/pricingGroupApi";
import { editProductApi } from "./service";

type GroupPriceRow = { pricingGroupId: string; pricingGroupName: string; price: string };

export default function EditProductPage() {
 const params = useParams();
 const productId = (params?.id as string) ?? "";
 const [groupPriceRows, setGroupPriceRows] = useState<GroupPriceRow[]>([]);
 const [groupPricesLoading, setGroupPricesLoading] = useState(false);
 const [groupPricesSaving, setGroupPricesSaving] = useState(false);
 const [groupPricesMessage, setGroupPricesMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

 const loadGroupPrices = useCallback(async () => {
 if (!productId) return;
 setGroupPricesLoading(true);
 try {
 const [groupsRes, pricesRes] = await Promise.all([
 pricingGroupApi.getList(),
 editProductApi.getGroupPrices(productId),
 ]);
 const groups = groupsRes.success && Array.isArray(groupsRes.data) ? groupsRes.data : [];
 const existing = (pricesRes.success && Array.isArray(pricesRes.data) ? pricesRes.data : []) as Array<{ pricingGroupId: string; pricingGroupName?: string; price: number }>;
 const byGroupId: Record<string, number> = {};
 existing.forEach((e) => { byGroupId[e.pricingGroupId] = e.price; });
 setGroupPriceRows(
 groups.map((g) => ({
  pricingGroupId: g._id,
  pricingGroupName: g.name,
  price: byGroupId[g._id] != null ? String(byGroupId[g._id]) : "",
 }))
 );
 } catch {
 setGroupPriceRows([]);
 } finally {
 setGroupPricesLoading(false);
 }
 }, [productId]);

 const saveGroupPrices = useCallback(async () => {
 if (!productId) return;
 setGroupPricesSaving(true);
 setGroupPricesMessage(null);
 try {
 const toSave = groupPriceRows
 .map((r) => ({ pricingGroupId: r.pricingGroupId, price: parseFloat(r.price) }))
 .filter((r) => !Number.isNaN(r.price) && r.price >= 0);
 await editProductApi.putGroupPrices(productId, toSave);
 setGroupPricesMessage({ type: "success", text: "Group prices saved." });
 setTimeout(() => setGroupPricesMessage(null), 3000);
 } catch (e) {
 setGroupPricesMessage({ type: "error", text: e instanceof Error ? e.message : "Failed to save." });
 } finally {
 setGroupPricesSaving(false);
 }
 }, [productId, groupPriceRows]);

 const {
 // Form data
 formData,
 pricingData,
 customFields,
 images,
 uploadedImages,

 // Dropdown options
 categories,
 subCategories,
 brands,
 stores,
 warehouses,
 warranties,
 units,

 // UI state
 isLoading,
 productNotFound,
 productError,
 isSubmitting,
 message,
 sectionsExpanded,

 // Modal states and controls
 modalStates,
 modalLoading,
 openModal,
 closeModal,

 // Refresh functions
 refreshStores,
 refreshWarehouses,
 refreshCategories,
 refreshSubCategories,
 refreshUnits,
 refreshBrands,

 // Create functions
 createStore,
 createWarehouse,
 createCategory,
 createSubCategory,
 createUnit,
 createBrand,

 // Form data handlers
 updateFormData,
 updatePricingData,
 updateCustomFields,
 generateSlug,

 // Image handlers
 addImages,
 removeImage,

 // Section toggle
 toggleSection,

 // Form actions
 submitForm,
 } = useEditProductForm(productId);

 useEffect(() => {
 if (productId && !productNotFound) loadGroupPrices();
 }, [productId, productNotFound, loadGroupPrices]);

 if (!productId) {
 return (
 <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
 <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md text-center">
  <AlertCircle className="w-12 h-12 text-neutral-500 mx-auto mb-4" />
  <h1 className="text-lg font-semibold text-gray-800 mb-2">Invalid product</h1>
  <p className="text-gray-600 mb-6">No product ID in the URL.</p>
  <Link
  href="/inventory/products"
  className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
  >
  <ArrowLeft className="w-4 h-4" />
  Back to products
  </Link>
 </div>
 </div>
 );
 }

 if (isLoading) {
 return (
 <div className="min-h-screen bg-gray-50 flex items-center justify-center">
 <div className="flex items-center gap-3 text-gray-600">
  <Loader2 className="w-6 h-6 animate-spin" />
  <span>Loading product...</span>
 </div>
 </div>
 );
 }

 if (productNotFound) {
 return (
 <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
 <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md text-center">
  <AlertCircle className="w-12 h-12 text-neutral-500 mx-auto mb-4" />
  <h1 className="text-lg font-semibold text-gray-800 mb-2">Product not found</h1>
  <p className="text-gray-600 mb-6">
  {productError || "This product may have been removed or the link is incorrect."}
  </p>
  <Link
  href="/inventory/products"
  className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
  >
  <ArrowLeft className="w-4 h-4" />
  Back to products
  </Link>
 </div>
 </div>
 );
 }

 return (
 <div className="min-h-screen bg-gray-50">
 {/* Message Alert */}
 {message.text && (
 <div
  className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
  message.type === "success"
  ? "bg-green-100 text-green-700 border border-green-400"
  : "bg-red-100 text-red-700 border border-red-400"
  }`}
 >
  {message.text}
 </div>
 )}

 {/* Header */}
 <Header title="Edit Product" subtitle="Update product information" />

 {/* Main Content */}
 <div className="p-6">
 <div className="bg-white rounded-lg shadow-sm">
  {/* Product Information Section */}
  <ProductInformation
  formData={formData}
  updateFormData={updateFormData}
  generateSlug={generateSlug}
  generateSku={() => {}}
  generateBarcode={() => {}}
  isExpanded={sectionsExpanded.productInfo}
  onToggle={() => toggleSection("productInfo")}
  categories={categories}
  subCategories={subCategories}
  brands={brands}
  stores={stores}
  warehouses={warehouses}
  units={units}
  // Add new callbacks
  onAddStore={() => openModal("store")}
  onAddWarehouse={() => openModal("warehouse")}
  onAddCategory={() => openModal("category")}
  onAddSubCategory={() => openModal("subCategory")}
  onAddUnit={() => openModal("unit")}
  onAddBrand={() => openModal("brand")}
  // Refresh callbacks
  onRefreshStores={refreshStores}
  onRefreshWarehouses={refreshWarehouses}
  onRefreshCategories={refreshCategories}
  onRefreshSubCategories={refreshSubCategories}
  onRefreshUnits={refreshUnits}
  onRefreshBrands={refreshBrands}
  />

  {/* Pricing & Stocks Section */}
  <PricingStocks
  pricingData={pricingData}
  updatePricingData={updatePricingData}
  isExpanded={sectionsExpanded.pricingStocks}
  onToggle={() => toggleSection("pricingStocks")}
  />

  {/* Group prices (optional) — used when customer has a pricing group assigned */}
  <div className="border-b border-gray-200 last:border-b-0">
  <div className="px-6 py-4 flex items-center justify-between bg-gray-50 border-b border-gray-200">
  <h3 className="text-sm font-semibold text-gray-900">Group prices (optional)</h3>
  </div>
  <div className="px-6 py-4">
  {groupPricesLoading ? (
  <div className="flex items-center gap-2 text-gray-500 text-sm">
   <Loader2 className="w-4 h-4 animate-spin" />
   Loading…
  </div>
  ) : groupPriceRows.length === 0 ? (
  <p className="text-sm text-gray-500">No pricing groups. Create and manage groups from <Link href="/pricing-groups" className="text-orange-600 hover:underline">Pricing Groups</Link> in the sidebar.</p>
  ) : (
  <>
   <p className="text-sm text-gray-500 mb-3">When a customer is in a pricing group, this price is used instead of the default selling price (if set).</p>
   <div className="space-y-2 max-w-md">
   {groupPriceRows.map((row) => (
   <div key={row.pricingGroupId} className="flex items-center gap-3">
   <label className="text-sm font-medium text-gray-700 w-32 shrink-0">{row.pricingGroupName}</label>
   <div className="flex items-center gap-1 flex-1">
    <span className="text-gray-500">£</span>
    <input
    type="text"
    inputMode="decimal"
    value={row.price}
    onChange={(e) => {
    const v = e.target.value.replace(/[^0-9.]/g, "");
    setGroupPriceRows((prev) => prev.map((r) => (r.pricingGroupId === row.pricingGroupId ? { ...r, price: v } : r)));
    }}
    placeholder="Default"
    className="w-24 px-2 py-1.5 border border-gray-300 rounded text-sm"
    />
   </div>
   </div>
   ))}
   </div>
   {groupPricesMessage && (
   <p className={`mt-2 text-sm ${groupPricesMessage.type === "success" ? "text-green-600" : "text-red-600"}`}>{groupPricesMessage.text}</p>
   )}
   <button
   type="button"
   onClick={saveGroupPrices}
   disabled={groupPricesSaving}
   className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 disabled:opacity-50"
   >
   {groupPricesSaving ? "Saving..." : "Save group prices"}
   </button>
  </>
  )}
  </div>
  </div>

  {/* Images Section */}
  <ImagesSection
  images={images}
  uploadedImages={uploadedImages}
  addImages={addImages}
  removeImage={removeImage}
  isExpanded={sectionsExpanded.images}
  onToggle={() => toggleSection("images")}
  />

  {/* Custom Fields Section */}
  <CustomFields
  customFields={customFields}
  updateCustomFields={updateCustomFields}
  warranties={warranties}
  isExpanded={sectionsExpanded.customFields}
  onToggle={() => toggleSection("customFields")}
  />

  {/* Action Buttons */}
  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
  <button
  type="button"
  onClick={() => window.history.back()}
  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
  >
  Cancel
  </button>
  <button
  type="button"
  onClick={submitForm}
  disabled={isSubmitting}
  className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
  >
  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
  {isSubmitting ? "Updating..." : "Update Product"}
  </button>
  </div>
 </div>
 </div>

 {/* Quick Add Modals */}
 <QuickAddStoreModal
 open={modalStates.store}
 onClose={() => closeModal("store")}
 onAdd={createStore}
 isLoading={modalLoading === "store"}
 />

 <QuickAddWarehouseModal
 open={modalStates.warehouse}
 onClose={() => closeModal("warehouse")}
 onAdd={createWarehouse}
 isLoading={modalLoading === "warehouse"}
 />

 <QuickAddCategoryModal
 open={modalStates.category}
 onClose={() => closeModal("category")}
 onAdd={createCategory}
 isLoading={modalLoading === "category"}
 />

 <QuickAddSubCategoryModal
 open={modalStates.subCategory}
 onClose={() => closeModal("subCategory")}
 onAdd={createSubCategory}
 categories={categories}
 selectedCategory={formData.category}
 isLoading={modalLoading === "subCategory"}
 />

 <QuickAddUnitModal
 open={modalStates.unit}
 onClose={() => closeModal("unit")}
 onAdd={createUnit}
 isLoading={modalLoading === "unit"}
 />

 <QuickAddBrandModal
 open={modalStates.brand}
 onClose={() => closeModal("brand")}
 onAdd={createBrand}
 isLoading={modalLoading === "brand"}
 />
 </div>
 );
}
