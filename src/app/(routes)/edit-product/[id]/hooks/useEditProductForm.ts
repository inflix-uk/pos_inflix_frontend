"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { editProductApi } from "../service";
import {
 ProductFormData,
 PricingData,
 CustomFieldsData,
 ProductImage,
 SelectOption,
 UpdateProductPayload,
} from "../types";
import {
 QuickStoreFormData,
 QuickWarehouseFormData,
 QuickCategoryFormData,
 QuickSubCategoryFormData,
 QuickUnitFormData,
 QuickBrandFormData,
} from "../../../inventory/create-product/components/QuickAddModals";
import { formatProductName, formatProductNameInput } from "@/lib/formatProductName";

// Default values
const defaultFormData: ProductFormData = {
 store: "",
 warehouse: "",
 productName: "",
 slug: "",
 sku: "",
 sellingType: "",
 category: "",
 subCategory: "",
 brand: "",
 unit: "",
 barcodeSymbology: "",
 itemBarcode: "",
 description: "",
};

const defaultPricingData: PricingData = {
 quantity: "",
 costPrice: "",
 sellingPrice: "",
 taxType: "",
 tax: "",
 discountType: "",
 discountValue: "",
 minStockLevel: "10",
};

const defaultCustomFields: CustomFieldsData = {
 warranty: "",
 manufacturer: "",
 manufacturedDate: "",
 expiryDate: "",
 warrantiesChecked: true,
 manufacturerChecked: true,
 expiryChecked: false,
};

// Modal state type
interface ModalStates {
 store: boolean;
 warehouse: boolean;
 category: boolean;
 subCategory: boolean;
 unit: boolean;
 brand: boolean;
}

const defaultModalStates: ModalStates = {
 store: false,
 warehouse: false,
 category: false,
 subCategory: false,
 unit: false,
 brand: false,
};

export const useEditProductForm = (productId: string) => {
 const router = useRouter();

 // Form state
 const [formData, setFormData] = useState<ProductFormData>(defaultFormData);
 const [pricingData, setPricingData] = useState<PricingData>(defaultPricingData);
 const [customFields, setCustomFields] = useState<CustomFieldsData>(defaultCustomFields);
 const [images, setImages] = useState<ProductImage[]>([]);
 const [uploadedImages, setUploadedImages] = useState<File[]>([]);

 // Dropdown options
 const [categories, setCategories] = useState<SelectOption[]>([]);
 const [subCategories, setSubCategories] = useState<SelectOption[]>([]);
 const [brands, setBrands] = useState<SelectOption[]>([]);
 const [stores, setStores] = useState<SelectOption[]>([]);
 const [warehouses, setWarehouses] = useState<SelectOption[]>([]);
 const [warranties, setWarranties] = useState<SelectOption[]>([]);
 const [units, setUnits] = useState<SelectOption[]>([]);

 // Modal states
 const [modalStates, setModalStates] = useState<ModalStates>(defaultModalStates);
 const [modalLoading, setModalLoading] = useState<keyof ModalStates | null>(null);

 // UI state
 const [isLoading, setIsLoading] = useState(true);
 const [productNotFound, setProductNotFound] = useState(false);
 const [productError, setProductError] = useState<string | null>(null);
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [message, setMessage] = useState<{ type: "success" | "error"; text: string }>({ type: "success", text: "" });
 const [sectionsExpanded, setSectionsExpanded] = useState({
  productInfo: true,
  pricingStocks: true,
  images: true,
  customFields: true,
 });

 // Show message helper
 const showMessage = useCallback((type: "success" | "error", text: string) => {
  setMessage({ type, text });
  setTimeout(() => setMessage({ type: "success", text: "" }), 3000);
 }, []);

 // Modal controls
 const openModal = useCallback((modal: keyof ModalStates) => {
  setModalStates((prev) => ({ ...prev, [modal]: true }));
 }, []);

 const closeModal = useCallback((modal: keyof ModalStates) => {
  setModalStates((prev) => ({ ...prev, [modal]: false }));
 }, []);

 // Refresh functions for dropdowns - called when user clicks on dropdown
 const refreshStores = useCallback(async () => {
  try {
   const storesData = await editProductApi.getStores();
   setStores(storesData);
  } catch {
   // Silently fail
  }
 }, []);

 const refreshWarehouses = useCallback(async () => {
  try {
   const warehousesData = await editProductApi.getWarehouses();
   setWarehouses(warehousesData);
  } catch {
   // Silently fail
  }
 }, []);

 const refreshCategories = useCallback(async () => {
  try {
   const categoriesData = await editProductApi.getCategories();
   setCategories(categoriesData);
  } catch {
   // Silently fail
  }
 }, []);

 const refreshSubCategories = useCallback(async (categoryId?: string) => {
  try {
   const subCategoriesData = await editProductApi.getSubCategories(categoryId);
   setSubCategories(subCategoriesData);
  } catch {
   // Silently fail
  }
 }, []);

 const refreshUnits = useCallback(async () => {
  try {
   const unitsData = await editProductApi.getUnits();
   setUnits(unitsData);
  } catch {
   // Silently fail
  }
 }, []);

 const refreshBrands = useCallback(async () => {
  try {
   const brandsData = await editProductApi.getBrands();
   setBrands(brandsData);
  } catch {
   // Silently fail
  }
 }, []);

 // Create functions for quick add modals
 const createStore = useCallback(async (data: QuickStoreFormData) => {
  setModalLoading("store");
  try {
   const newStore = await editProductApi.createStore(data);
   await refreshStores();
   setFormData((prev) => ({ ...prev, store: newStore._id }));
   closeModal("store");
   showMessage("success", "Store created successfully");
  } catch (error) {
   showMessage("error", error instanceof Error ? error.message : "Failed to create store");
  } finally {
   setModalLoading(null);
  }
 }, [refreshStores, closeModal, showMessage]);

 const createWarehouse = useCallback(async (data: QuickWarehouseFormData) => {
  setModalLoading("warehouse");
  try {
   const newWarehouse = await editProductApi.createWarehouse(data);
   await refreshWarehouses();
   setFormData((prev) => ({ ...prev, warehouse: newWarehouse._id }));
   closeModal("warehouse");
   showMessage("success", "Warehouse created successfully");
  } catch (error) {
   showMessage("error", error instanceof Error ? error.message : "Failed to create warehouse");
  } finally {
   setModalLoading(null);
  }
 }, [refreshWarehouses, closeModal, showMessage]);

 const createCategory = useCallback(async (data: QuickCategoryFormData) => {
  setModalLoading("category");
  try {
   const newCategory = await editProductApi.createCategory(data);
   await refreshCategories();
   setFormData((prev) => ({ ...prev, category: newCategory._id, subCategory: "" }));
   closeModal("category");
   showMessage("success", "Category created successfully");
  } catch (error) {
   showMessage("error", error instanceof Error ? error.message : "Failed to create category");
  } finally {
   setModalLoading(null);
  }
 }, [refreshCategories, closeModal, showMessage]);

 const createSubCategory = useCallback(async (data: QuickSubCategoryFormData) => {
  setModalLoading("subCategory");
  try {
   const newSubCategory = await editProductApi.createSubCategory(data);
   await refreshSubCategories(formData.category);
   setFormData((prev) => ({ ...prev, subCategory: newSubCategory._id }));
   closeModal("subCategory");
   showMessage("success", "Sub-category created successfully");
  } catch (error) {
   showMessage("error", error instanceof Error ? error.message : "Failed to create sub-category");
  } finally {
   setModalLoading(null);
  }
 }, [refreshSubCategories, formData.category, closeModal, showMessage]);

 const createUnit = useCallback(async (data: QuickUnitFormData) => {
  setModalLoading("unit");
  try {
   const newUnit = await editProductApi.createUnit(data);
   await refreshUnits();
   setFormData((prev) => ({ ...prev, unit: newUnit._id }));
   closeModal("unit");
   showMessage("success", "Unit created successfully");
  } catch (error) {
   showMessage("error", error instanceof Error ? error.message : "Failed to create unit");
  } finally {
   setModalLoading(null);
  }
 }, [refreshUnits, closeModal, showMessage]);

 const createBrand = useCallback(async (data: QuickBrandFormData) => {
  setModalLoading("brand");
  try {
   const newBrand = await editProductApi.createBrand(data);
   await refreshBrands();
   setFormData((prev) => ({ ...prev, brand: newBrand._id }));
   closeModal("brand");
   showMessage("success", "Brand created successfully");
  } catch (error) {
   showMessage("error", error instanceof Error ? error.message : "Failed to create brand");
  } finally {
   setModalLoading(null);
  }
 }, [refreshBrands, closeModal, showMessage]);

 // Resolve ref: backend may return populated { _id, name } or raw ObjectId string
 const resolveId = (ref: { _id?: string } | string | null | undefined): string =>
  !ref ? "" : typeof ref === "string" ? ref : ref._id || "";

 // Fetch product by ID first, then dropdowns (resilient to missing APIs)
 useEffect(() => {
  const fetchData = async () => {
   if (!productId) {
    setIsLoading(false);
    return;
   }
   setIsLoading(true);
   setProductNotFound(false);
   setProductError(null);
   try {
    // 1) Fetch product first – required for page to be dynamic
    const product = await editProductApi.getById(productId);

    // 2) Fetch dropdown options in parallel; never fail the whole load if an API is missing
    const [
     categoriesResult,
     brandsResult,
     storesResult,
     warehousesResult,
     warrantiesResult,
     unitsResult,
    ] = await Promise.allSettled([
     editProductApi.getCategories(),
     editProductApi.getBrands(),
     editProductApi.getStores(),
     editProductApi.getWarehouses(),
     editProductApi.getWarranties(),
     editProductApi.getUnits(),
    ]);

    setCategories(categoriesResult.status === "fulfilled" ? categoriesResult.value : []);
    setBrands(brandsResult.status === "fulfilled" ? brandsResult.value : []);
    setStores(storesResult.status === "fulfilled" ? storesResult.value : []);
    setWarehouses(warehousesResult.status === "fulfilled" ? warehousesResult.value : []);
    setWarranties(warrantiesResult.status === "fulfilled" ? warrantiesResult.value : []);
    setUnits(unitsResult.status === "fulfilled" ? unitsResult.value : []);

    const categoryId = resolveId(product.category);

    // Populate form with product data (handle both populated refs and raw IDs)
    setFormData({
     store: resolveId(product.store),
     warehouse: resolveId(product.warehouse),
     productName: product.name || "",
     slug: product.slug || product.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "",
     sku: product.sku || "",
     sellingType: product.sellingType || "",
     category: categoryId,
     subCategory: resolveId(product.subCategory),
     brand: resolveId(product.brand),
     unit: product.unit || "",
     barcodeSymbology: product.barcodeSymbology || "",
     itemBarcode: product.barcode || "",
     description: product.description || "",
    });

    setPricingData({
     quantity: product.quantity?.toString() ?? "",
     costPrice: product.costPrice?.toString() ?? "",
     sellingPrice: product.sellingPrice?.toString() ?? "",
     taxType: product.taxType || "",
     tax: product.taxRate?.toString() ?? "",
     discountType: product.discountType || "",
     discountValue: product.discountValue?.toString() ?? "",
     minStockLevel: product.minStockLevel?.toString() ?? "10",
    });

    setCustomFields({
     warranty: product.warranty || "",
     manufacturer: product.manufacturer || "",
     manufacturedDate: product.manufacturedDate ? product.manufacturedDate.split("T")[0] : "",
     expiryDate: product.expiryDate ? product.expiryDate.split("T")[0] : "",
     warrantiesChecked: !!product.warranty,
     manufacturerChecked: !!product.manufacturer,
     expiryChecked: !!product.expiryDate,
    });

    const existingImages: ProductImage[] = [];
    if (product.image) {
     existingImages.push({ id: 1, type: "existing", url: product.image });
    }
    if (product.images?.length) {
     product.images.forEach((imgUrl: string, index: number) => {
      if (imgUrl !== product.image) {
       existingImages.push({ id: index + 2, type: "existing", url: imgUrl });
      }
     });
    }
    setImages(existingImages);

    if (categoryId) {
     const subCategoriesData = await editProductApi.getSubCategories(categoryId).catch(() => []);
     setSubCategories(subCategoriesData);
    }
   } catch (error) {
    setProductNotFound(true);
    setProductError(error instanceof Error ? error.message : "Failed to load product");
   } finally {
    setIsLoading(false);
   }
  };

  fetchData();
 }, [productId]);

 // Fetch sub-categories when category changes
 useEffect(() => {
  const fetchSubCategories = async () => {
   if (formData.category) {
    const subCategoriesData = await editProductApi.getSubCategories(formData.category);
    setSubCategories(subCategoriesData);
   } else {
    setSubCategories([]);
   }
  };

  // Only fetch if not initial load (to avoid duplicate fetch)
  if (!isLoading) {
   fetchSubCategories();
  }
 }, [formData.category, isLoading]);

 // Form data handlers
 const updateFormData = useCallback((data: Partial<ProductFormData>) => {
  setFormData((prev) => ({ ...prev, ...data }));
 }, []);

 const updatePricingData = useCallback((data: Partial<PricingData>) => {
  setPricingData((prev) => ({ ...prev, ...data }));
 }, []);

 const updateCustomFields = useCallback((data: Partial<CustomFieldsData>) => {
  setCustomFields((prev) => ({ ...prev, ...data }));
 }, []);

 // Auto-generate slug from product name
 const generateSlug = useCallback((name: string) => {
  const formatted = formatProductNameInput(name);
  const slug = formatted
   .toLowerCase()
   .replace(/[^a-z0-9]+/g, "-")
   .replace(/(^-|-$)/g, "");
  updateFormData({ productName: formatted, slug });
 }, [updateFormData]);

 // Image handlers
 const addImages = useCallback((files: FileList | null) => {
  if (!files) return;

  const newFiles = Array.from(files);
  setUploadedImages((prev) => [...prev, ...newFiles]);

  const newImageSlots = newFiles.map((file, index) => ({
   id: images.length + index + 1,
   type: `uploaded-${Date.now()}-${index}`,
   file,
   url: URL.createObjectURL(file),
  }));
  setImages((prev) => [...prev, ...newImageSlots]);
 }, [images.length]);

 const removeImage = useCallback((id: number) => {
  const imageIndex = images.findIndex((img) => img.id === id);
  setImages((prev) => prev.filter((img) => img.id !== id));

  if (imageIndex !== -1) {
   setUploadedImages((prev) => prev.filter((_, i) => i !== imageIndex));
  }
 }, [images]);

 // Section toggle
 const toggleSection = useCallback((section: keyof typeof sectionsExpanded) => {
  setSectionsExpanded((prev) => ({ ...prev, [section]: !prev[section] }));
 }, []);

 // Submit form
 const submitForm = useCallback(async () => {
  setIsSubmitting(true);

  try {
   // Upload new images first if any
   let newImageUrls: string[] = [];
   if (uploadedImages.length > 0) {
    try {
     const uploadedResults = await editProductApi.uploadImages(uploadedImages);
     newImageUrls = uploadedResults.map((img) => img.url);
    } catch (uploadError) {
     console.error("Image upload failed:", uploadError);
    }
   }

   // Combine existing and new images
   const existingImageUrls = images
    .filter((img) => img.type === "existing" && img.url)
    .map((img) => img.url as string);
   const allImageUrls = [...existingImageUrls, ...newImageUrls];

   const payload: UpdateProductPayload = {
    // Basic info
    name: formatProductName(formData.productName),
    slug: formData.slug || undefined,
    sku: formData.sku,
    barcode: formData.itemBarcode || undefined,
    barcodeSymbology: formData.barcodeSymbology || undefined,
    description: formData.description || undefined,

    // Categories & relations
    category: formData.category || undefined,
    subCategory: formData.subCategory || undefined,
    brand: formData.brand || undefined,
    store: formData.store || undefined,
    warehouse: formData.warehouse || undefined,
    sellingType: formData.sellingType || undefined,

    // Pricing
    costPrice: parseFloat(pricingData.costPrice) || 0,
    sellingPrice: parseFloat(pricingData.sellingPrice) || 0,
    taxType: pricingData.taxType || undefined,
    taxRate: parseFloat(pricingData.tax) || 0,
    discountType: pricingData.discountType || undefined,
    discountValue: parseFloat(pricingData.discountValue) || 0,

    // Stock
    minStockLevel: parseInt(pricingData.minStockLevel) || 10,
    unit: formData.unit || "piece",

    // Images
    image: allImageUrls[0] || undefined,
    images: allImageUrls.length > 0 ? allImageUrls : undefined,

    // Custom fields
    warranty: customFields.warranty || undefined,
    manufacturer: customFields.manufacturer || undefined,
    manufacturedDate: customFields.manufacturedDate || undefined,
    expiryDate: customFields.expiryDate || undefined,

    isActive: true,
   };

   // Remove undefined values
   const cleanPayload = Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined && value !== "")
   ) as UpdateProductPayload;

   await editProductApi.update(productId, cleanPayload);
   showMessage("success", "Product updated successfully");
   setTimeout(() => router.push("/products"), 1500);
  } catch (error) {
   showMessage("error", error instanceof Error ? error.message : "Failed to update product");
  } finally {
   setIsSubmitting(false);
  }
 }, [formData, pricingData, customFields, images, uploadedImages, productId, showMessage, router]);

 return {
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
  showMessage,
 };
};

export default useEditProductForm;
