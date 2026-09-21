"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { productApi } from "../service";
import {
 ProductFormData,
 PricingData,
 CustomFieldsData,
 ProductImage,
 SelectOption,
 CreateProductPayload,
} from "../types";
import {
 QuickStoreFormData,
 QuickWarehouseFormData,
 QuickCategoryFormData,
 QuickSubCategoryFormData,
 QuickUnitFormData,
 QuickBrandFormData,
} from "../components/QuickAddModals";
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

export const useCreateProductForm = () => {
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
 const [isLoading, setIsLoading] = useState(false);
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
   const storesData = await productApi.getStores();
   setStores(storesData);
  } catch {
   // Silently fail
  }
 }, []);

 const refreshWarehouses = useCallback(async () => {
  try {
   const warehousesData = await productApi.getWarehouses();
   setWarehouses(warehousesData);
  } catch {
   // Silently fail
  }
 }, []);

 const refreshCategories = useCallback(async () => {
  try {
   const categoriesData = await productApi.getCategories();
   setCategories(categoriesData);
  } catch {
   // Silently fail
  }
 }, []);

 const refreshSubCategories = useCallback(async (categoryId?: string) => {
  try {
   const subCategoriesData = await productApi.getSubCategories(categoryId);
   setSubCategories(subCategoriesData);
  } catch {
   // Silently fail
  }
 }, []);

 const refreshUnits = useCallback(async () => {
  try {
   const unitsData = await productApi.getUnits();
   setUnits(unitsData);
  } catch {
   // Silently fail
  }
 }, []);

 const refreshBrands = useCallback(async () => {
  try {
   const brandsData = await productApi.getBrands();
   setBrands(brandsData);
  } catch {
   // Silently fail
  }
 }, []);

 // Create functions for quick add modals
 const createStore = useCallback(async (data: QuickStoreFormData) => {
  setModalLoading("store");
  try {
   const newStore = await productApi.createStore(data);
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
   const newWarehouse = await productApi.createWarehouse(data);
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
   const newCategory = await productApi.createCategory(data);
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
   const newSubCategory = await productApi.createSubCategory(data);
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
   const newUnit = await productApi.createUnit(data);
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
   const newBrand = await productApi.createBrand(data);
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

 // Fetch dropdown options on mount
 useEffect(() => {
  const fetchOptions = async () => {
   setIsLoading(true);
   try {
    const [
     categoriesData,
     brandsData,
     storesData,
     warehousesData,
     warrantiesData,
     unitsData,
    ] = await Promise.all([
     productApi.getCategories(),
     productApi.getBrands(),
     productApi.getStores(),
     productApi.getWarehouses(),
     productApi.getWarranties(),
     productApi.getUnits(),
    ]);

    setCategories(categoriesData);
    setBrands(brandsData);
    setStores(storesData);
    setWarehouses(warehousesData);
    setWarranties(warrantiesData);
    setUnits(unitsData);
   } catch {
    // Silently fail - dropdowns will be empty
   } finally {
    setIsLoading(false);
   }
  };

  fetchOptions();
 }, []);

 // Fetch sub-categories when category changes
 useEffect(() => {
  const fetchSubCategories = async () => {
   if (formData.category) {
    const subCategoriesData = await productApi.getSubCategories(formData.category);
    setSubCategories(subCategoriesData);
   } else {
    setSubCategories([]);
   }
  };

  fetchSubCategories();
 }, [formData.category]);

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

 // Generate SKU
 const generateSku = useCallback(async () => {
  const sku = await productApi.generateSku();
  updateFormData({ sku });
 }, [updateFormData]);

 // Generate Barcode
 const generateBarcode = useCallback(async () => {
  const barcode = await productApi.generateBarcode();
  updateFormData({ itemBarcode: barcode });
 }, [updateFormData]);

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

 // Reset form
 const resetForm = useCallback(() => {
  setFormData(defaultFormData);
  setPricingData(defaultPricingData);
  setCustomFields(defaultCustomFields);
  setImages([]);
  setUploadedImages([]);
 }, []);

 // Submit form
 const submitForm = useCallback(async () => {
  setIsSubmitting(true);

  try {
   // Upload images first if any
   let imageUrl: string | undefined;
   let imageUrls: string[] = [];

   if (uploadedImages.length > 0) {
    try {
     const uploadedResults = await productApi.uploadImages(uploadedImages);
     imageUrls = uploadedResults.map((img) => img.url);
     imageUrl = imageUrls[0]; // First image as main image
    } catch (uploadError) {
     console.error("Image upload failed:", uploadError);
     // Continue without images if upload fails
    }
   }

   const payload: CreateProductPayload = {
    // Basic info
    name: formatProductName(formData.productName),
    slug: formData.slug || undefined,
    sku: formData.sku,
    barcode: formData.itemBarcode || undefined,
    barcodeSymbology: formData.barcodeSymbology || undefined,
    description: formData.description || undefined,

    // Categories & relations
    category: formData.category,
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
    quantity: parseInt(pricingData.quantity) || 0,
    minStockLevel: parseInt(pricingData.minStockLevel) || 10,
    unit: formData.unit || "piece",

    // Images
    image: imageUrl,
    images: imageUrls.length > 0 ? imageUrls : undefined,

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
   ) as CreateProductPayload;

   await productApi.create(cleanPayload);
   showMessage("success", "Product created successfully");
   resetForm();
   router.push("/products");
  } catch (error) {
   showMessage("error", error instanceof Error ? error.message : "Failed to create product");
  } finally {
   setIsSubmitting(false);
  }
 }, [formData, pricingData, customFields, uploadedImages, showMessage, resetForm, router]);

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
  generateSku,
  generateBarcode,
  generateSlug,

  // Image handlers
  addImages,
  removeImage,

  // Section toggle
  toggleSection,

  // Form actions
  resetForm,
  submitForm,
  showMessage,
 };
};

export default useCreateProductForm;
