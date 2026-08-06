/**
 * Single source of truth: route ↔ permission mapping for POS (wholesale + inventory).
 * Used by: sidebar (nav visibility), frontend route guards, and must match backend API protection.
 * Default DENY: if permission is missing, deny access.
 */

import type React from "react";
import {
  LayoutDashboard,
  Users,
  Package,
  PlusSquare,
  TrendingDown,
  Grid,
  FileText,
  QrCode,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Landmark,
  ArrowLeftRight,
  Calculator,
  Scale,
  Banknote,
  FileSpreadsheet,
  MapPin,
  Settings,
  Info,
  Mail,
  Receipt,
  Smile,
  History,
  Wrench,
  Shield,
  Layers,
  Tags,
  Printer,
} from "lucide-react";

/** Path → required permissions. Empty array = any authenticated user. No entry = treat as protected by parent or deny. */
export const ROUTE_PERMISSIONS: Record<string, string[]> = {
  // Public (no auth) - handled in guard by path
  "/login": [],

  // Main - any authenticated user can land on /dashboard. Without `dashboard.view`
  // the page renders a minimal profile view (name, email, role, locations) instead
  // of the full KPI dashboard.
  "/dashboard": [],
  "/sales-dashboard": ["sale.create"], // redirects to /create-sales
  "/create-sales": ["sale.create"],

  // Notebooks
  "/notebooks": ["sale.view"],

  // Sales
  "/sales-online-orders": ["sale.view"],
  "/sales-online-orders/edit": ["sale.view", "sale.edit"],
  "/sales-item-wise-orders": ["sale.view"],

  // Invoices (own flow, mirrors sales but gated by invoice.* perms)
  "/create-invoice": ["invoice.create"],
  "/edit-invoice": ["invoice.edit"],
  "/invoice-online-order": ["invoice.view"],
  "/sales-return": ["return.create", "refund.issue", "sale.view"],
  "/sales-return/start": ["return.create", "refund.issue", "sale.view"],

  // Repairs
  "/repairs": ["repair.view"],
  "/repairs/add": ["repair.create"],

  // Customers / People
  "/customers": ["customer.view"],
  "/customers/": ["customer.view"],
  "/peoples/customers": ["customer.view"],
  "/pricing-groups": ["customer.view", "product.view"],
  "/pricing-groups/": ["customer.view", "product.view"],
  "/account-statement": ["accounts.view"],
  "/peoples/suppliers": ["customer.view"],
  "/peoples/locations": ["settings.view", "settings.edit"],

  // Inventory
  "/inventory": ["product.view"],
  "/inventory/products": ["product.view"],
  "/inventory/create-product": ["product.create"],
  "/inventory/low-stocks": ["product.view", "stock.view"],
  "/inventory/expired-products": ["product.view", "stock.view"],
  "/inventory/category": ["product.view"],
  "/inventory/sub-category": ["product.view"],
  "/inventory/variant-attributes": ["variant_attribute.create"],
  "/inventory/print-qr-code": ["inventory.print_labels"],
  "/inventory/serials/": ["product.view"],
  "/scan": [],
  "/inventory/product-history": ["product.view"],
  "/edit-product": ["product.edit"],
  "/product-detail": ["product.view"],

  // Stock
  "/stock": ["stock.view"],
  "/stock/view": ["stock.view"],
  "/stock/stock-1": ["stock.view"],
  "/stock/manage": ["stock.view", "stock.adjust"],
  "/stock/adjustment": ["stock_adjustment.view"],
  "/stock/adjustment/add": ["stock_adjustment.create"],
  "/stock/adjustment/": ["stock_adjustment.view"],
  "/stock-transfers": ["stock_transfer.view"],
  "/stock-transfers/add": ["stock_transfer.create"],
  "/stock-transfers/": ["stock_transfer.view"],

  // Purchases
  "/purchases": ["purchase.view"],
  "/purchases/list": ["purchase.view"],
  "/purchases/add": ["purchase.create", "parcel.create"],
  "/purchases/import": ["purchase.create", "parcel.create"],
  "/purchases/return": ["purchase.return"],
  "/purchases/view": ["purchase.view"],
  "/purchases/edit": ["purchase.edit"],

  // Finance
  "/expenses": ["expense.view", "report.view"],
  "/expenses-list": ["expense.view"],
  "/expenses-list/add": ["expense.create"],
  "/expenses-list/edit": ["expense.view", "expense.edit_draft"],
  "/expense-category": ["expense_category.view"],
  "/bank-accounts": ["report.view", "settings.view", "settings.edit"],
  "/settings/bank-account-details": ["report.view", "settings.view", "settings.edit"],
  "/money-transfer": ["report.view"],
  "/balance-sheet": ["report.view"],
  "/debtors-creditors": ["report.view"],
  "/trial-balance": ["report.view"],
  "/profit-and-loss": ["report.view"],
  "/cash-flow": ["report.view"],

  // Promo
  "/promo": ["sale.view"],
  "/promo/coupons": ["sale.view"],
  "/promo/gift-cards": ["sale.view"],
  "/promo/discount-plan": ["sale.view"],
  "/promo/discount-list": ["sale.view"],

  // Invoices / Reports
  "/invoices": ["sale.view"],
  "/quotation": ["sale.view"],

  // Reports (report.view)
  "/reports": ["report.view"],
  "/reports/dashboard": ["report.view"],
  "/reports/dashboard/locations": ["report.view"],
  "/reports/takings": ["report.view"],
  "/reports/z-read": ["report.zread"],

  // Settings - require at least one admin/settings permission
  "/settings": ["audit.view", "user.manage", "role.manage", "settings.view", "settings.printing"],
  "/settings/general": ["settings.view", "settings.edit"],
  "/settings/sales": ["settings.view"],
  "/settings/header-actions": ["settings.view"],
  "/settings/printing": ["settings.view", "settings.printing", "settings.manage"],
  "/settings/my-sales-mode": ["settings.sales_mode", "settings.manage"],
  "/settings/about": ["settings.view", "settings.edit"],
  "/settings/notes-terms": ["settings.view", "settings.edit"],
  "/settings/email": ["settings.view", "settings.edit"],
  "/settings/tax": ["settings.view", "settings.edit"],
  "/settings/icons": ["settings.view", "settings.edit"],
  "/settings/activity-log": ["audit.view"],
  "/settings/admin": ["user.manage", "role.manage", "audit.view"],
  "/settings/billing": ["settings.manage", "user.manage", "role.manage", "audit.view"],

  // Platform (guard by isPlatformAdmin in layout; backend returns 403 for non-admins)
  "/platform": [],
  "/platform/feature-catalog": [],
  "/platform/plan-catalog": [],
  "/platform/tenants": [],
  "/platform/tenants/": [],

  // Profile (any authenticated)
  "/dashboard/profile": [],
  "/403": [],
};

/** Paths that do not require login (e.g. login page, logout page). */
export const PUBLIC_PATHS = ["/", "/login", "/logout", "/platform-login", "/auth/platform-callback"];

export type NavItem = {
  title: string;
  path: string;
  icon: React.ElementType;
  /** At least one required to see this item. Empty = any authenticated. */
  requiredPermsAnyOf: string[];
  /** If set, item is hidden when this feature is disabled for the tenant. */
  featureKey?: string;
  /** If true, section/item only shown when user is platform admin. */
  platformAdminOnly?: boolean;
  submenu?: { title: string; path: string; icon: React.ElementType; requiredPermsAnyOf: string[]; featureKey?: string }[];
};

export type NavSection = {
  label: string;
  items: NavItem[];
};

/** Sidebar NAV config: sections and items with requiredPermsAnyOf. Filter by can(perm) on frontend. */
export const NAV_CONFIG: NavSection[] = [
  {
    label: "Main",
    items: [
      { title: "Dashboard", path: "/dashboard", icon: LayoutDashboard, requiredPermsAnyOf: [] },
      { title: "Create Sales", path: "/create-sales", icon: LayoutDashboard, requiredPermsAnyOf: ["sale.create"], featureKey: "sales" },
      { title: "Notebooks", path: "/notebooks", icon: FileText, requiredPermsAnyOf: ["sale.view"] },
    ],
  },
  {
    label: "Sales",
    items: [
      { title: "Sales", path: "/sales-online-orders", icon: Grid, requiredPermsAnyOf: ["sale.view"], featureKey: "sales" },
      { title: "Sales Item-wise", path: "/sales-item-wise-orders", icon: Package, requiredPermsAnyOf: ["sale.view"], featureKey: "sales" },
      { title: "Sales Return", path: "/sales-return", icon: FileText, requiredPermsAnyOf: ["return.create", "refund.issue", "sale.view"], featureKey: "sales" },
    ],
  },
  {
    label: "Invoices",
    items: [
      { title: "Create Invoice", path: "/create-invoice", icon: PlusSquare, requiredPermsAnyOf: ["invoice.create"], featureKey: "invoices" },
      { title: "Invoices", path: "/invoice-online-order", icon: Receipt, requiredPermsAnyOf: ["invoice.view"], featureKey: "invoices" },
    ],
  },
  {
    label: "Repairs",
    items: [
      { title: "Repairs", path: "/repairs", icon: Wrench, requiredPermsAnyOf: ["repair.view"] },
    ],
  },
  {
    label: "Customers",
    items: [
      { title: "Customers", path: "/customers", icon: Users, requiredPermsAnyOf: ["customer.view"] },
      { title: "Pricing Groups", path: "/pricing-groups", icon: Tags, requiredPermsAnyOf: ["customer.view", "product.view"] },
      { title: "Account Statement", path: "/account-statement", icon: FileSpreadsheet, requiredPermsAnyOf: ["accounts.view"] },
    ],
  },
  {
    label: "Inventory",
    items: [
      { title: "Inventory", path: "/inventory", icon: Package, requiredPermsAnyOf: ["product.view"] },
      { title: "All Products", path: "/inventory/products", icon: Package, requiredPermsAnyOf: ["product.view"] },
      { title: "Serial Products", path: "/inventory/products?type=serial", icon: Package, requiredPermsAnyOf: ["product.view"] },
      { title: "Non-Serial Products", path: "/inventory/products?type=non-serial", icon: Package, requiredPermsAnyOf: ["product.view"] },
      { title: "Create Product", path: "/inventory/create-product", icon: PlusSquare, requiredPermsAnyOf: ["product.create"] },
      { title: "Low Stocks", path: "/inventory/low-stocks", icon: TrendingDown, requiredPermsAnyOf: ["product.view", "stock.view"] },
      { title: "Category", path: "/inventory/category", icon: Grid, requiredPermsAnyOf: ["product.view"] },
      {
        title: "Variant Attributes",
        path: "/inventory/variant-attributes",
        icon: FileText,
        requiredPermsAnyOf: ["variant_attribute.create"],
      },
      { title: "Print QR / Labels", path: "/inventory/print-qr-code", icon: QrCode, requiredPermsAnyOf: ["inventory.print_labels"] },
      { title: "Stock Adjustment", path: "/stock/adjustment", icon: TrendingDown, requiredPermsAnyOf: ["stock_adjustment.view"], featureKey: "stock_adjustment" },
      { title: "Stock Transfers", path: "/stock-transfers", icon: ArrowLeftRight, requiredPermsAnyOf: ["stock_transfer.view"], featureKey: "stock_transfer" },
      { title: "Product History", path: "/inventory/product-history", icon: History, requiredPermsAnyOf: ["product.view"] },
    ],
  },
  {
    label: "Purchases",
    items: [
      { title: "Purchases", path: "/purchases", icon: ShoppingCart, requiredPermsAnyOf: ["purchase.view"] },
      { title: "Purchase list", path: "/purchases/list", icon: ShoppingCart, requiredPermsAnyOf: ["purchase.view"] },
      { title: "Add purchase", path: "/purchases/add", icon: PlusSquare, requiredPermsAnyOf: ["purchase.create", "parcel.create"] },
      {
        title: "Purchase import",
        path: "/purchases/import",
        icon: FileSpreadsheet,
        requiredPermsAnyOf: ["purchase.create", "parcel.create"],
        submenu: [
          { title: "Import Serial Items", path: "/purchases/import?type=serial", icon: FileSpreadsheet, requiredPermsAnyOf: ["purchase.create", "parcel.create"] },
          { title: "Import Non-Serial Items", path: "/purchases/import?type=non-serial", icon: FileSpreadsheet, requiredPermsAnyOf: ["purchase.create", "parcel.create"] },
        ],
      },
      { title: "Purchase return", path: "/purchases/return", icon: History, requiredPermsAnyOf: ["purchase.return"] },
    ],
  },
  {
    label: "Reports",
    items: [
      { title: "Dashboard", path: "/reports/dashboard", icon: LayoutDashboard, requiredPermsAnyOf: ["report.view"], featureKey: "reports" },
      { title: "Takings Dashboard", path: "/reports/takings", icon: TrendingUp, requiredPermsAnyOf: ["report.view"] },
      { title: "Z-Report", path: "/reports/z-read", icon: Receipt, requiredPermsAnyOf: ["report.zread"] },
    ],
  },
  {
    label: "Finance & Accounts",
    items: [
      { title: "Expenses", path: "/expenses", icon: DollarSign, requiredPermsAnyOf: ["expense.view", "expense_category.view", "report.view"], submenu: [
        { title: "Expenses", path: "/expenses-list", icon: DollarSign, requiredPermsAnyOf: ["expense.view"] },
        { title: "Expense Category", path: "/expense-category", icon: Grid, requiredPermsAnyOf: ["expense_category.view"] },
      ]},
      { title: "Bank Accounts", path: "/bank-accounts", icon: Landmark, requiredPermsAnyOf: ["report.view"] },
      { title: "Money Transfer", path: "/money-transfer", icon: ArrowLeftRight, requiredPermsAnyOf: ["report.view"] },
      { title: "Balance Sheet", path: "/balance-sheet", icon: Calculator, requiredPermsAnyOf: ["report.view"] },
      { title: "Debtors & Creditors", path: "/debtors-creditors", icon: Users, requiredPermsAnyOf: ["report.view"] },
      { title: "Trial Balance", path: "/trial-balance", icon: Scale, requiredPermsAnyOf: ["report.view"] },
      { title: "Profit and Loss Statement", path: "/profit-and-loss", icon: FileText, requiredPermsAnyOf: ["report.view"] },
      { title: "Cash Flow", path: "/cash-flow", icon: Banknote, requiredPermsAnyOf: ["report.view"] },
    ],
  },
  {
    label: "Settings",
    items: [
      { title: "Settings", path: "/settings", icon: Settings, requiredPermsAnyOf: ["audit.view", "user.manage", "role.manage", "settings.view", "settings.printing"] },
      { title: "Printing", path: "/settings/printing", icon: Printer, requiredPermsAnyOf: ["settings.view", "settings.printing", "settings.manage"] },
      { title: "Billing & plan", path: "/settings/billing", icon: Receipt, requiredPermsAnyOf: ["settings.manage", "user.manage", "role.manage", "audit.view"] },
      { title: "About", path: "/settings/about", icon: Info, requiredPermsAnyOf: ["settings.view", "settings.edit"] },
      { title: "Notes & Terms", path: "/settings/notes-terms", icon: FileText, requiredPermsAnyOf: ["settings.view", "settings.edit"] },
      { title: "Email", path: "/settings/email", icon: Mail, requiredPermsAnyOf: ["settings.view", "settings.edit"] },
      { title: "Tax", path: "/settings/tax", icon: Receipt, requiredPermsAnyOf: ["settings.view", "settings.edit"] },
      { title: "Icons", path: "/settings/icons", icon: Smile, requiredPermsAnyOf: ["settings.view", "settings.edit"] },
      { title: "Locations", path: "/peoples/locations", icon: MapPin, requiredPermsAnyOf: ["settings.view", "settings.edit"] },
    ],
  },
  {
    label: "Platform",
    items: [
      { title: "Platform console", path: "/platform", icon: Shield, requiredPermsAnyOf: [], platformAdminOnly: true },
      { title: "Feature catalog", path: "/platform/feature-catalog", icon: Layers, requiredPermsAnyOf: [], platformAdminOnly: true },
      { title: "Plan catalog", path: "/platform/plan-catalog", icon: Package, requiredPermsAnyOf: [], platformAdminOnly: true },
      { title: "Tenants", path: "/platform/tenants", icon: Users, requiredPermsAnyOf: [], platformAdminOnly: true },
    ],
  },
];

/**
 * Get required permissions for a path. Checks exact match then prefix match (longest first).
 * Returns undefined if path is public, [] if any authenticated, string[] if specific perms required.
 */
export function getRequiredPermsForPath(path: string): string[] | undefined {
  if (PUBLIC_PATHS.includes(path)) return undefined;
  const exact = ROUTE_PERMISSIONS[path];
  if (exact !== undefined) return exact;
  const pathSegments = path.replace(/^\//, "").split("/");
  let best: { prefix: string; perms: string[] } | null = null;
  for (const key of Object.keys(ROUTE_PERMISSIONS)) {
    if (key === "/login" || key === "/403") continue;
    const keySegments = key.replace(/^\//, "").split("/");
    const keyPrefix = "/" + keySegments.slice(0, keySegments.length).join("/");
    if (path.startsWith(keyPrefix + "/") || path === keyPrefix) {
      const perms = ROUTE_PERMISSIONS[key];
      if (!best || keyPrefix.length > best.prefix.length) best = { prefix: keyPrefix, perms };
    }
  }
  return best ? best.perms : [];
}

/**
 * Returns true if path is public (no login required).
 */
export function isPublicPath(path: string): boolean {
  return PUBLIC_PATHS.includes(path);
}

/** Paths that use platform auth only; tenant auth guard (RequirePermission) should not run. */
export function isPlatformPath(path: string): boolean {
  if (!path) return false;
  return path === "/platform-login" || path === "/platform" || path.startsWith("/platform/");
}
