"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import {
  LucideIcon,
  Laptop,
  Headphones,
  Footprints,
  Watch,
  Speaker,
  Armchair,
  ShoppingBag,
  Smartphone,
  Gamepad2,
  Backpack,
  Package,
  Monitor,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function getAuthHeaders(): HeadersInit {
  if (typeof window === "undefined") return { "Content-Type": "application/json" };
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/** API product shape (from GET /api/products) */
interface ApiProduct {
  _id: string;
  sku: string;
  name: string;
  category?: { _id: string; name: string } | string;
  brand?: { _id: string; name: string } | string;
  sellingPrice: number;
  quantity: number;
  unit?: string;
  barcode?: string;
  isActive?: boolean;
}

const CATEGORY_ICONS: Record<string, { icon: LucideIcon; color: string }> = {
  computers: { icon: Laptop, color: "text-purple-600" },
  electronics: { icon: Speaker, color: "text-gray-800" },
  phone: { icon: Smartphone, color: "text-gray-800" },
  shoe: { icon: Footprints, color: "text-red-600" },
  shoes: { icon: Footprints, color: "text-red-600" },
  furniture: { icon: Armchair, color: "text-gray-800" },
  furnitures: { icon: Armchair, color: "text-gray-800" },
  bags: { icon: ShoppingBag, color: "text-red-600" },
  default: { icon: Package, color: "text-gray-800" },
};

function getCategoryIcon(categoryName: string): { icon: LucideIcon; color: string } {
  const key = categoryName.toLowerCase().trim();
  return CATEGORY_ICONS[key] ?? CATEGORY_ICONS.default;
}

function mapApiProductToProduct(api: ApiProduct): Product {
  const categoryName = typeof api.category === "object" && api.category?.name
    ? api.category.name
    : "Uncategorized";
  const brandName = typeof api.brand === "object" && api.brand?.name
    ? api.brand.name
    : "";
  const { icon, color } = getCategoryIcon(categoryName);
  return {
    sku: api.sku,
    name: api.name,
    category: categoryName,
    brand: brandName,
    price: typeof api.sellingPrice === "number" ? `£${Number(api.sellingPrice).toFixed(2)}` : "£0.00",
    unit: api.unit || "piece",
    qty: typeof api.quantity === "number" ? api.quantity : 0,
    createdBy: { name: "POS", avatar: "👤", color: "bg-green-100" },
    icon,
    iconColor: color,
    serialNumber: api.barcode || undefined,
  };
}

async function fetchProductsFromApi(): Promise<Product[]> {
  const params = new URLSearchParams({ limit: "1000", isActive: "true" });
  const response = await fetch(`${API_URL}/api/products?${params}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Failed to load products");
  }
  const json = await response.json();
  const data = json.data ?? [];
  return Array.isArray(data) ? data.map((p: ApiProduct) => mapApiProductToProduct(p)) : [];
}

interface CreatedBy {
  name: string;
  avatar: string;
  color: string;
}

interface ProductImage {
  id: number;
  type: string;
  url?: string;
  file?: File;
}

interface Product {
  sku: string;
  name: string;
  category: string;
  brand: string;
  price: string;
  unit: string;
  qty: number;
  createdBy: CreatedBy;
  icon: LucideIcon;
  iconColor: string;
  images?: ProductImage[];
  /** Serial number for serialized items (e.g. electronics) */
  serialNumber?: string;
}

interface ProductsContextType {
  products: Product[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  addProduct: (
    product: Omit<Product, "createdBy" | "icon" | "iconColor">
  ) => void;
  updateProduct: (sku: string, product: Partial<Product>) => void;
  deleteProduct: (sku: string) => void;
}

const ProductsContext = createContext<ProductsContextType | undefined>(
  undefined
);

// Default products data
const defaultProducts: Product[] = [
  {
    sku: "PT001",
    name: "Lenovo IdeaPad 3",
    category: "Computers",
    brand: "Lenovo",
    price: "£600",
    unit: "Pc",
    qty: 100,
    createdBy: { name: "James Kirwin", avatar: "👨‍💼", color: "bg-red-100" },
    icon: Laptop,
    iconColor: "text-purple-600",
  },
  {
    sku: "PT002",
    name: "Beats Pro",
    category: "Electronics",
    brand: "Beats",
    price: "£160",
    unit: "Pc",
    qty: 140,
    createdBy: {
      name: "Francis Chang",
      avatar: "🏆",
      color: "bg-yellow-100",
    },
    icon: Headphones,
    iconColor: "text-red-600",
  },
  {
    sku: "PT003",
    name: "Nike Jordan",
    category: "Shoe",
    brand: "Nike",
    price: "£110",
    unit: "Pc",
    qty: 300,
    createdBy: {
      name: "Antonio Engle",
      avatar: "👨‍🎨",
      color: "bg-orange-100",
    },
    icon: Footprints,
    iconColor: "text-red-600",
  },
  {
    sku: "PT004",
    name: "Apple Series 5 Watch",
    category: "Electronics",
    brand: "Apple",
    price: "£120",
    unit: "Pc",
    qty: 450,
    createdBy: { name: "Leo Kelly", avatar: "👨‍💼", color: "bg-blue-100" },
    icon: Watch,
    iconColor: "text-gray-800",
  },
  {
    sku: "PT005",
    name: "Amazon Echo Dot",
    category: "Electronics",
    brand: "Amazon",
    price: "£80",
    unit: "Pc",
    qty: 320,
    createdBy: { name: "Annette Walker", avatar: "👩‍💼", color: "bg-red-100" },
    icon: Speaker,
    iconColor: "text-gray-800",
  },
  {
    sku: "PT006",
    name: "Sanford Chair Sofa",
    category: "Furnitures",
    brand: "Modern Wave",
    price: "£320",
    unit: "Pc",
    qty: 650,
    createdBy: { name: "John Weaver", avatar: "👨‍💼", color: "bg-blue-100" },
    icon: Armchair,
    iconColor: "text-gray-800",
  },
  {
    sku: "PT007",
    name: "Red Premium Satchel",
    category: "Bags",
    brand: "Dior",
    price: "£60",
    unit: "Pc",
    qty: 700,
    createdBy: { name: "Gary Hennessy", avatar: "👨‍💼", color: "bg-blue-100" },
    icon: ShoppingBag,
    iconColor: "text-red-600",
  },
  {
    sku: "PT008",
    name: "Iphone 14 Pro",
    category: "Phone",
    brand: "Apple",
    price: "£540",
    unit: "Pc",
    qty: 630,
    createdBy: { name: "Eleanor Panek", avatar: "👩‍💼", color: "bg-gray-100" },
    icon: Smartphone,
    iconColor: "text-gray-800",
  },
  {
    sku: "PT009",
    name: "Gaming Chair",
    category: "Furniture",
    brand: "Artime",
    price: "£200",
    unit: "Pc",
    qty: 410,
    createdBy: { name: "William Levy", avatar: "👨‍💼", color: "bg-cyan-100" },
    icon: Gamepad2,
    iconColor: "text-gray-800",
  },
  {
    sku: "PT010",
    name: "Borealis Backpack",
    category: "Bags",
    brand: "The North Face",
    price: "£45",
    unit: "Pc",
    qty: 550,
    createdBy: { name: "Charlotte Klotz", avatar: "👩‍💼", color: "bg-red-100" },
    icon: Backpack,
    iconColor: "text-gray-800",
  },
  {
    sku: "PT011",
    name: "MacBook Pro 14\" M3",
    category: "Computers",
    brand: "Apple",
    price: "£1,599",
    unit: "Pc",
    qty: 24,
    createdBy: { name: "Current User", avatar: "👤", color: "bg-green-100" },
    icon: Laptop,
    iconColor: "text-gray-800",
    serialNumber: "MBP14-M3-8A2K9X1",
  },
  {
    sku: "PT012",
    name: "Dell UltraSharp U2723QE",
    category: "Electronics",
    brand: "Dell",
    price: "£549",
    unit: "Pc",
    qty: 18,
    createdBy: { name: "Current User", avatar: "👤", color: "bg-green-100" },
    icon: Monitor,
    iconColor: "text-blue-600",
    serialNumber: "DEL-U2723QE-N4P7Q2",
  },
  {
    sku: "PT013",
    name: "Samsung Galaxy S24 Ultra",
    category: "Phone",
    brand: "Samsung",
    price: "£1,299",
    unit: "Pc",
    qty: 42,
    createdBy: { name: "Current User", avatar: "👤", color: "bg-green-100" },
    icon: Smartphone,
    iconColor: "text-gray-800",
    serialNumber: "SGS24U-VN901-3H7M",
  },
];

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(defaultProducts);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchProductsFromApi();
      if (list.length > 0) {
        setProducts(list);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load products");
      setProducts(defaultProducts);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const addProduct = (
    productData: Omit<Product, "createdBy" | "icon" | "iconColor">
  ) => {
    // Generate a unique SKU if not provided
    const sku =
      productData.sku || `PT${String(products.length + 1).padStart(3, "0")}`;

    // Default values for missing fields
    const newProduct: Product = {
      sku,
      name: productData.name || "New Product",
      category: productData.category || "General",
      brand: productData.brand || "Unknown",
      price: productData.price || "£0",
      unit: productData.unit || "Pc",
      qty: productData.qty || 0,
      images: productData.images || [],
      createdBy: {
        name: "Current User",
        avatar: "👤",
        color: "bg-green-100",
      },
      icon: Package,
      iconColor: "text-gray-800",
      ...(productData.serialNumber != null && { serialNumber: productData.serialNumber }),
    };

    setProducts((prev) => [...prev, newProduct]);
  };

  const updateProduct = (sku: string, productData: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((product) =>
        product.sku === sku ? { ...product, ...productData } : product
      )
    );
  };

  const deleteProduct = (sku: string) => {
    setProducts((prev) => prev.filter((product) => product.sku !== sku));
  };

  return (
    <ProductsContext.Provider
      value={{ products, loading, error, refetch: loadProducts, addProduct, updateProduct, deleteProduct }}
    >
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductsContext);
  if (context === undefined) {
    throw new Error("useProducts must be used within a ProductsProvider");
  }
  return context;
}
