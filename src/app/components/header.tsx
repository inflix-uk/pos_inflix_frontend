"use client";

import type React from "react";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Command, Menu, User, FileText, Settings, LogOut, PlusCircle, Wrench, Truck, RotateCcw, ShoppingBag, FileSpreadsheet, Boxes, Globe } from "lucide-react";
import { ProductHistoryModal } from "@/app/(routes)/inventory/product-history/ProductHistoryModal";
import { usePermissions } from "@/hooks/usePermissions";
import { globalSearch, type GlobalSearchResult } from "@/app/(routes)/dashboard/service/dashboardApi";
import { updateSalesMode } from "@/app/(routes)/settings/sales/service/generalSettingsApi";
import { updateMySalesMode } from "@/app/(routes)/settings/my-sales-mode/service/mySalesModeApi";
import { UserInitialsAvatar } from "@/lib/userAvatar";
import {
  getHeaderQuickActionsVisibility,
  fetchHeaderQuickActionsVisibility,
  type HeaderQuickActionsVisibility,
  HEADER_QUICK_ACTIONS_DEFAULTS,
} from "@/lib/header-quick-actions";

function useOutsideClick<T extends HTMLElement>(ref: React.RefObject<T | null>, callback: () => void) {
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) callback();
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ref, callback]);
}

export function Header() {
  const [searchValue, setSearchValue] = useState("");
  const [searchResults, setSearchResults] = useState<GlobalSearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showProductHistoryModal, setShowProductHistoryModal] = useState(false);
  const [productHistorySerial, setProductHistorySerial] = useState("");
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);

  useEffect(() => {
    const onSidebarState = (e: Event) => {
      const ev = e as CustomEvent<{ mobileOpen: boolean }>;
      setSidebarMobileOpen(!!ev.detail?.mobileOpen);
    };
    window.addEventListener("pos-sidebar-state", onSidebarState);
    return () => window.removeEventListener("pos-sidebar-state", onSidebarState);
  }, []);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useOutsideClick(profileRef, () => setShowProfileDropdown(false));
  useOutsideClick(searchRef, () => setSearchOpen(false));
  const router = useRouter();
  const { user, can, refreshUser } = usePermissions();
  const displayName = user?.name ?? "User";
  const displayRole = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : (user?.roles?.[0]?.name ?? "");
  const canSeeSettings =
    can("audit.view") ||
    can("user.manage") ||
    can("role.manage") ||
    can("settings.view") ||
    can("settings.printing") ||
    can("settings.sales_mode");
  const canManageSettings = can("settings.manage");
  const canSetOwnSalesMode = can("settings.sales_mode");
  const canSeeReports = can("report.view");
  const [retailModeEnabled, setRetailModeEnabled] = useState(false);
  const [salesModeToast, setSalesModeToast] = useState<string | null>(null);
  const [salesModeLoading, setSalesModeLoading] = useState(false);
  const [quickActions, setQuickActions] = useState<HeaderQuickActionsVisibility>(HEADER_QUICK_ACTIONS_DEFAULTS);

  useEffect(() => {
    if (typeof user?.effectiveRetailModeEnabled === "boolean") {
      setRetailModeEnabled(user.effectiveRetailModeEnabled);
    }
  }, [user?.effectiveRetailModeEnabled]);

  useEffect(() => {
    const onModeChange = (e: Event) => {
      const ev = e as CustomEvent<boolean>;
      if (typeof ev.detail === "boolean") setRetailModeEnabled(ev.detail);
    };
    window.addEventListener("pos-user-sales-mode-change", onModeChange);
    return () => window.removeEventListener("pos-user-sales-mode-change", onModeChange);
  }, []);

  useEffect(() => {
    setQuickActions(getHeaderQuickActionsVisibility());
    fetchHeaderQuickActionsVisibility().then(setQuickActions);
  }, []);
  useEffect(() => {
    const onQuickActionsChange = (e: Event) => {
      const ev = e as CustomEvent<HeaderQuickActionsVisibility>;
      if (ev.detail) setQuickActions(ev.detail);
      else setQuickActions(getHeaderQuickActionsVisibility());
    };
    window.addEventListener("pos-header-quick-actions-change", onQuickActionsChange);
    return () => window.removeEventListener("pos-header-quick-actions-change", onQuickActionsChange);
  }, []);

  const handleSalesModeToggle = useCallback(() => {
    if (salesModeLoading) return;
    if (!canManageSettings && !canSetOwnSalesMode) return;
    setSalesModeLoading(true);
    const next = !retailModeEnabled;
    const savePromise = canManageSettings
      ? updateSalesMode({ retailModeEnabled: next })
      : updateMySalesMode({ retailModeEnabled: next });
    savePromise
      .then(async (res) => {
        if (res.success && res.data) {
          const enabled = canManageSettings
            ? !!(res.data as { retailModeEnabled?: boolean }).retailModeEnabled
            : !!(res.data as { effectiveRetailModeEnabled?: boolean }).effectiveRetailModeEnabled;
          setRetailModeEnabled(enabled);
          try {
            sessionStorage.setItem("create-sales-retailMode", enabled ? "1" : "0");
          } catch {}
          window.dispatchEvent(new CustomEvent("pos-user-sales-mode-change", { detail: enabled }));
          await refreshUser();
          setSalesModeToast(next ? "Retail mode" : "Wholesale mode");
          setTimeout(() => setSalesModeToast(null), 2500);
        }
      })
      .finally(() => setSalesModeLoading(false));
  }, [canManageSettings, canSetOwnSalesMode, salesModeLoading, retailModeEnabled, refreshUser]);

  const runSearch = useCallback((q: string) => {
    if (q.length < 2) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }
    setSearchLoading(true);
    setSearchOpen(true);
    globalSearch(q)
      .then((results) => {
        setSearchResults(results);
      })
      .finally(() => setSearchLoading(false));
  }, []);

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    const q = searchValue.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setSearchOpen(false);
      return () => {};
    }
    searchDebounceRef.current = setTimeout(() => runSearch(q), 300);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchValue, runSearch]);

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchValue.trim();
    if (q.length >= 2 && searchResults.length > 0) {
      const first = searchResults[0];
      setSearchOpen(false);
      router.push(first.url);
      return;
    }
    if (q) {
      setProductHistorySerial(q);
      setShowProductHistoryModal(true);
    }
  };

  const handleSearchResultClick = (result: GlobalSearchResult) => {
    setSearchOpen(false);
    setSearchValue("");
    setSearchResults([]);
    router.push(result.url);
  };

  const showNewSale = quickActions.showNewSale && can("sale.create");
  const showNewRepair = quickActions.showNewRepair && can("repair.create");
  const showParcel = quickActions.showParcel && (can("purchase.create") || can("parcel.create"));
  const showReturn = quickActions.showReturn && (can("return.create") || can("refund.issue"));
  const showSalesModeToggle =
    quickActions.showSalesModeToggle &&
    can("sale.create") &&
    (canManageSettings || canSetOwnSalesMode);
  const showAccounts = quickActions.showAccounts && can("accounts.view");
  const showStockList = quickActions.showStockList && (can("product.view") || can("stock.view"));
  const showSalesOnline = quickActions.showSalesOnline && can("sale.view");
  const showAnyPrimaryQuickAction = showNewSale || showNewRepair || showParcel || showReturn || showAccounts || showStockList || showSalesOnline;

  return (
    <>
      {/* Desktop Header */}
      <header className="h-16 border-b border-gray-300 bg-white flex items-center justify-between px-4 gap-4 hidden md:flex">
        {/* Left: Global search + Quick actions */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div ref={searchRef} className="relative flex-shrink-0">
            <form onSubmit={handleGlobalSearch}>
              <div className="flex items-center h-9 w-[280px] rounded-md border border-gray-300 bg-gray-50 px-3">
                <Search className="h-4 w-4 text-gray-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search IMEI, invoice, customer, repair, purchase..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onFocus={() => searchValue.trim().length >= 2 && setSearchOpen(true)}
                  className="flex-1 min-w-0 bg-transparent px-2 py-1 text-sm outline-none placeholder:text-gray-400"
                />
                <div className="flex items-center rounded border border-gray-300 px-1.5 bg-white shrink-0">
                  <Command className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-400 ml-1">K</span>
                </div>
              </div>
            </form>
            {searchOpen && (searchValue.trim().length >= 2 || searchResults.length > 0) && (
              <div className="absolute left-0 top-full mt-1 w-[320px] max-h-72 overflow-y-auto bg-white rounded-lg border border-gray-200 shadow-lg z-50 py-1">
                {searchLoading ? (
                  <div className="px-4 py-3 text-sm text-gray-500">Searching…</div>
                ) : searchResults.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-500">No results. Try IMEI/serial for product history.</div>
                ) : (
                  searchResults.map((r) => (
                    <button
                      key={`${r.type}-${r.id}`}
                      type="button"
                      onClick={() => handleSearchResultClick(r)}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center justify-between gap-2"
                    >
                      <span className="truncate font-medium text-gray-900">{r.label}</span>
                      <span className="text-xs text-gray-500 shrink-0 capitalize">{r.type}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          {(showAnyPrimaryQuickAction || showSalesModeToggle) && (
            <div
              className={`flex items-center gap-2 ${showAnyPrimaryQuickAction ? "border-l border-gray-200 pl-4" : ""}`}
            >
              {showNewSale && (
                <Link
                  href="/create-sales"
                  className="inline-flex items-center gap-2 px-3 xl:px-4 py-2 xl:py-2.5 rounded-lg text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 active:bg-orange-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 transition-colors shadow-sm whitespace-nowrap"
                >
                  <PlusCircle className="h-4.5 w-4.5 shrink-0" />
                  <span className="hidden xl:inline">New Sale</span>
                </Link>
              )}
              {showNewRepair && (
                <Link
                  href="/repairs/add"
                  className="inline-flex items-center gap-2 px-2.5 xl:px-3.5 py-2 rounded-lg text-sm font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 active:bg-emerald-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 transition-colors whitespace-nowrap"
                >
                  <Wrench className="h-4.5 w-4.5 shrink-0 text-emerald-600" />
                  <span className="hidden xl:inline">New Repair</span>
                </Link>
              )}
              {showParcel && (
                <Link
                  href="/purchases/add"
                  className="inline-flex items-center gap-2 px-2.5 xl:px-3.5 py-2 rounded-lg text-sm font-semibold text-blue-800 bg-blue-50 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 active:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors whitespace-nowrap"
                >
                  <Truck className="h-4.5 w-4.5 shrink-0 text-blue-600" />
                  <span className="hidden xl:inline">Purchase</span>
                </Link>
              )}
              {showReturn && (
                <Link
                  href="/sales-return"
                  className="inline-flex items-center gap-2 px-2.5 xl:px-3.5 py-2 rounded-lg text-sm font-semibold text-amber-800 bg-amber-50 border border-amber-200 hover:bg-amber-100 hover:border-amber-300 active:bg-amber-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 transition-colors whitespace-nowrap"
                >
                  <RotateCcw className="h-4.5 w-4.5 shrink-0 text-amber-600" />
                  <span className="hidden xl:inline">Return</span>
                </Link>
              )}
              {showAccounts && (
                <Link
                  href="/account-statement"
                  className="inline-flex items-center gap-2 px-2.5 xl:px-3.5 py-2 rounded-lg text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 active:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 transition-colors whitespace-nowrap"
                >
                  <FileSpreadsheet className="h-4.5 w-4.5 shrink-0 text-slate-600" />
                  <span className="hidden xl:inline">Accounts</span>
                </Link>
              )}
              {showStockList && (
                <Link
                  href="/inventory/products?tab=stock-list"
                  className="inline-flex items-center gap-2 px-2.5 xl:px-3.5 py-2 rounded-lg text-sm font-semibold text-teal-800 bg-teal-50 border border-teal-200 hover:bg-teal-100 hover:border-teal-300 active:bg-teal-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 transition-colors whitespace-nowrap"
                >
                  <Boxes className="h-4.5 w-4.5 shrink-0 text-teal-600" />
                  <span className="hidden xl:inline">Stock List</span>
                </Link>
              )}
              {showSalesOnline && (
                <Link
                  href="/sales-online-orders"
                  className="inline-flex items-center gap-2 px-2.5 xl:px-3.5 py-2 rounded-lg text-sm font-semibold text-indigo-800 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300 active:bg-indigo-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 transition-colors whitespace-nowrap"
                >
                  <Globe className="h-4.5 w-4.5 shrink-0 text-indigo-600" />
                  <span className="hidden xl:inline">Sales</span>
                </Link>
              )}
              {showSalesModeToggle && (
                <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
                  <button
                    type="button"
                    onClick={handleSalesModeToggle}
                    disabled={salesModeLoading}
                    title={retailModeEnabled ? "Retail (Walk-in) mode – click to switch to Wholesale" : "Wholesale mode – click to switch to Retail"}
                    className="inline-flex items-center gap-2 px-2.5 xl:px-3.5 py-2 rounded-lg text-sm font-semibold text-violet-800 bg-violet-50 border border-violet-200 hover:bg-violet-100 hover:border-violet-300 active:bg-violet-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 disabled:opacity-60 transition-colors whitespace-nowrap"
                  >
                    <ShoppingBag className="h-4.5 w-4.5 shrink-0 text-violet-600" />
                    <span className="hidden xl:inline">{retailModeEnabled ? "Retail" : "Wholesale"}</span>
                  </button>
                  {salesModeToast && (
                    <span className="text-xs text-green-600 font-medium animate-pulse">{salesModeToast}</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right section - User profile */}
        <div ref={profileRef} className="relative flex items-center">
          <button
            type="button"
            className="rounded-full border-0 ring-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            aria-expanded={showProfileDropdown}
            aria-haspopup="true"
            title={displayName}
            aria-label={`Account menu, ${displayName}`}
          >
            <UserInitialsAvatar name={displayName} size="sm" />
          </button>
          {showProfileDropdown && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-300">
              <div className="p-3 border-b border-gray-200">
                <div className="flex items-center">
                  <div className="mr-3 shrink-0">
                    <UserInitialsAvatar name={displayName} size="md" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 truncate">{displayName}</div>
                    <div className="text-xs text-gray-500">{displayRole || "—"}</div>
                  </div>
                </div>
              </div>
              <div className="py-1">
                <Link
                  href="/dashboard/profile"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <User className="h-4 w-4 mr-2 text-gray-500 shrink-0" />
                  <span>My Profile</span>
                </Link>
                {canSeeReports && (
                  <Link
                    href="/reports"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <FileText className="h-4 w-4 mr-2 text-gray-500 shrink-0" />
                    <span>Reports</span>
                  </Link>
                )}
                {canSeeSettings && (
                  <Link
                    href="/settings"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Settings className="h-4 w-4 mr-2 text-gray-500 shrink-0" />
                    <span>Settings</span>
                  </Link>
                )}
              </div>
              <div className="py-1 border-t border-gray-200">
                <Link
                  href="/logout"
                  className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  <LogOut className="h-4 w-4 mr-2 text-red-500 shrink-0" />
                  <span>Logout</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      <ProductHistoryModal
        isOpen={showProductHistoryModal}
        onClose={() => setShowProductHistoryModal(false)}
        initialSerial={productHistorySerial}
      />

      {/* Mobile Header — hidden when sidebar drawer is open */}
      <header
        className={`h-14 border-b border-gray-300 bg-white flex items-center justify-between px-3 md:hidden ${
          sidebarMobileOpen ? "invisible" : ""
        }`}
      >
        {/* Left hamburger — opens sidebar */}
        <button
          className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
          onClick={() => window.dispatchEvent(new Event("pos-sidebar-toggle"))}
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Center logo */}
        <div className="flex items-center min-w-0">
          <img
            src="/images/inflix-logo.png"
            alt="Inflix"
            className="h-7 w-auto max-w-[120px] object-contain"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              e.currentTarget.parentElement?.querySelector(".logo-fallback")?.classList.remove("hidden");
            }}
          />
          <span className="logo-fallback hidden text-lg font-semibold text-gray-800 truncate">Inflix</span>
        </div>

        {/* Right profile menu */}
        <button
          className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          aria-label="Open profile menu"
        >
          <User className="h-5 w-5" />
        </button>

        {/* Mobile Menu Dropdown - Profile links */}
        {showMobileMenu && (
          <div className="absolute top-16 right-0 w-48 bg-white shadow-lg z-50 border border-gray-300 rounded-md">
            <div className="py-2">
              <Link href="/dashboard/profile" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                <User className="h-4 w-4 mr-2 text-gray-500" />
                <span>My Profile</span>
              </Link>
              {canSeeReports && (
                <Link href="/reports" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <FileText className="h-4 w-4 mr-2 text-gray-500" />
                  <span>Reports</span>
                </Link>
              )}
              {canSeeSettings && (
                <Link href="/settings" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <Settings className="h-4 w-4 mr-2 text-gray-500" />
                  <span>Settings</span>
                </Link>
              )}
              <div className="border-t border-gray-200 my-1" />
              <Link href="/logout" className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
                <LogOut className="h-4 w-4 mr-2 text-red-500" />
                <span>Logout</span>
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
