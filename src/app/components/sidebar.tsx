"use client";

import type React from "react";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ChevronRight,
  ChevronLeft,
  LayoutDashboard,
  Users,
  Package,
  PlusSquare,
  TrendingDown,
  Grid,
  FolderTree,
  FileText,
  Barcode,
  QrCode,
  X,
  Menu,
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/useIsMobile";
import { getSidebarVisibility, type SidebarMenuVisibility } from "@/lib/sidebar-visibility";
import { usePermissions } from "@/hooks/usePermissions";
import { useEntitlements } from "@/hooks/useEntitlements";
import { usePlatformAuth } from "@/contexts/PlatformAuthContext";
import { NAV_CONFIG, type NavItem } from "@/lib/route-permissions";

const SIDEBAR_SECTIONS_STORAGE_KEY = "sidebar-sections-expanded";
const SIDEBAR_COLLAPSED_STORAGE_KEY = "sidebar-collapsed-state";
/** Main stays open so Dashboard / Create Sales are always one click away. */
const MAIN_SECTION_LABEL = "Main";

type StoredCollapsed = { collapsed: boolean; userToggled: boolean };

function getStoredCollapsed(): StoredCollapsed | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredCollapsed>;
    if (typeof parsed.collapsed !== "boolean" || typeof parsed.userToggled !== "boolean") return null;
    return { collapsed: parsed.collapsed, userToggled: parsed.userToggled };
  } catch {
    return null;
  }
}

function saveCollapsedState(state: StoredCollapsed): void {
  try {
    localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function getStoredExpandedSections(): string[] {
  if (typeof window === "undefined") return ["Main"];
  try {
    const raw = localStorage.getItem(SIDEBAR_SECTIONS_STORAGE_KEY);
    if (raw === null) return ["Main"];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : ["Main"];
  } catch {
    return ["Main"];
  }
}

function saveExpandedSections(labels: string[]): void {
  try {
    localStorage.setItem(SIDEBAR_SECTIONS_STORAGE_KEY, JSON.stringify(labels));
  } catch {
    // ignore
  }
}

type MenuItem = {
  title: string;
  path: string;
  icon: React.ElementType;
  submenu?: { title: string; path: string; icon: React.ElementType }[];
};

function navItemToMenuItem(
  item: NavItem,
  can: (p: string) => boolean,
  enabledFeatures: Record<string, boolean> | null,
  isPlatformAdmin: boolean
): MenuItem | null {
  if (item.platformAdminOnly && !isPlatformAdmin) return null;
  const allowed = item.requiredPermsAnyOf.length === 0 || item.requiredPermsAnyOf.some(can);
  if (!allowed) return null;
  if (item.featureKey != null && enabledFeatures != null && enabledFeatures[item.featureKey] === false) return null;
  const submenu = item.submenu
    ? item.submenu
        .filter((s) => {
          if (s.featureKey != null && enabledFeatures != null && enabledFeatures[s.featureKey] === false) return false;
          return s.requiredPermsAnyOf.length === 0 || s.requiredPermsAnyOf.some(can);
        })
        .map((s) => ({ title: s.title, path: s.path, icon: s.icon }))
    : undefined;
  return { title: item.title, path: item.path, icon: item.icon, submenu };
}

type FilteredSection = { label: string; items: MenuItem[] };

/**
 * Left accent stripe per section — a bit wider + deeper hue so it reads clearly
 * without overpowering the menu.
 */
const SECTION_ACCENT: Record<string, string> = {
  Main: "border-l-[6px] border-l-emerald-600",
  Sales: "border-l-[6px] border-l-sky-600",
  Repairs: "border-l-[6px] border-l-violet-600",
  Customers: "border-l-[6px] border-l-teal-600",
  Inventory: "border-l-[6px] border-l-amber-600",
  Purchases: "border-l-[6px] border-l-blue-600",
  Reports: "border-l-[6px] border-l-indigo-600",
  "Finance & Accounts": "border-l-[6px] border-l-rose-600",
  Settings: "border-l-[6px] border-l-slate-600",
  Platform: "border-l-[6px] border-l-purple-700",
};

/** Section header chips — tinted backgrounds so groups read as colorful but stay professional. */
const SECTION_HEADER_CHIP: Record<string, string> = {
  Main: "bg-emerald-100/80 text-emerald-900 ring-1 ring-emerald-200/70",
  Sales: "bg-sky-100/80 text-sky-900 ring-1 ring-sky-200/60",
  Repairs: "bg-violet-100/80 text-violet-900 ring-1 ring-violet-200/60",
  Customers: "bg-teal-100/80 text-teal-900 ring-1 ring-teal-200/60",
  Inventory: "bg-amber-100/80 text-amber-950 ring-1 ring-amber-200/60",
  Purchases: "bg-blue-100/80 text-blue-900 ring-1 ring-blue-200/60",
  Reports: "bg-indigo-100/80 text-indigo-900 ring-1 ring-indigo-200/60",
  "Finance & Accounts": "bg-rose-100/80 text-rose-900 ring-1 ring-rose-200/60",
  Settings: "bg-slate-200/80 text-slate-800 ring-1 ring-slate-300/70",
  Platform: "bg-purple-100/80 text-purple-900 ring-1 ring-purple-200/60",
};

/** Inactive row icons pick up a hint of their section color (active state still uses theme primary). */
const SECTION_ITEM_ICON: Record<string, string> = {
  Main: "text-emerald-600/85 group-hover:text-emerald-700",
  Sales: "text-sky-600/85 group-hover:text-sky-700",
  Repairs: "text-violet-600/85 group-hover:text-violet-700",
  Customers: "text-teal-600/85 group-hover:text-teal-700",
  Inventory: "text-amber-700/90 group-hover:text-amber-800",
  Purchases: "text-blue-600/85 group-hover:text-blue-700",
  Reports: "text-indigo-600/85 group-hover:text-indigo-700",
  "Finance & Accounts": "text-rose-600/85 group-hover:text-rose-700",
  Settings: "text-slate-600/90 group-hover:text-slate-800",
  Platform: "text-purple-600/85 group-hover:text-purple-700",
};

/** Submenu bullet matches section accent. */
const SECTION_SUBMENU_DOT: Record<string, string> = {
  Main: "bg-emerald-400",
  Sales: "bg-sky-400",
  Repairs: "bg-violet-400",
  Customers: "bg-teal-400",
  Inventory: "bg-amber-500",
  Purchases: "bg-blue-400",
  Reports: "bg-indigo-400",
  "Finance & Accounts": "bg-rose-400",
  Settings: "bg-slate-400",
  Platform: "bg-purple-500",
};

const sidebarShellClass =
  "h-full flex flex-col bg-white bg-gradient-to-b from-slate-50 via-white to-orange-50";

export function Sidebar() {
  const [collapsed, setCollapsedState] = useState(false);
  const userTogglledRef = useRef(false);

  useEffect(() => {
    const stored = getStoredCollapsed();
    if (stored) {
      userTogglledRef.current = stored.userToggled;
      if (stored.userToggled) setCollapsedState(stored.collapsed);
    }
  }, []);

  const setCollapsed = (next: boolean) => {
    setCollapsedState(next);
  };
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [expandedSections, setExpandedSectionsState] = useState<Set<string>>(() => new Set(getStoredExpandedSections()));
  const [menuVisibility, setMenuVisibility] = useState<SidebarMenuVisibility>({
    hideCreateBulkSales: false,
  });
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  const { can } = usePermissions();
  const { data: entitlements } = useEntitlements();
  const { platformUser } = usePlatformAuth();
  const enabledFeatures = entitlements?.enabledFeatures ?? null;
  const isPlatformAdmin = !!platformUser;

  const searchKey = searchParams?.toString() ?? "";

  const filteredSections: FilteredSection[] = useMemo(() => {
    return NAV_CONFIG.map((section) => {
      if (section.label === "Platform" && !isPlatformAdmin) return { ...section, items: [] };
      let items = section.items
        .map((item) => navItemToMenuItem(item, can, enabledFeatures, isPlatformAdmin))
        .filter((m): m is MenuItem => m !== null);
      if (section.label === "Main") {
        items = items.filter((item) => {
          if (item.path === "/create-sales" && menuVisibility.hideCreateBulkSales) return false;
          return true;
        });
      }
      return { label: section.label, items };
    }).filter((s) => s.items.length > 0);
  }, [can, enabledFeatures, isPlatformAdmin, menuVisibility.hideCreateBulkSales]);

  const hasMainSection = useMemo(
    () => filteredSections.some((s) => s.label === MAIN_SECTION_LABEL),
    [filteredSections]
  );

  // Check if a submenu link is active (pathname + query params match)
  const isSubItemActive = (subItem: NonNullable<MenuItem["submenu"]>[number]): boolean => {
    const [subBase, subQuery] = subItem.path.split("?");
    if (pathname !== subBase) return false;
    if (!subQuery) return true;
    const itemParams = new URLSearchParams(subQuery);
    return Array.from(itemParams.keys()).every((key) => itemParams.get(key) === searchParams.get(key));
  };

  // Check if a menu item or its submenu is active (supports paths with ?query)
  const isMenuActive = (item: MenuItem): boolean => {
    const [itemPathBase, itemQuery] = item.path.split("?");
    const pathMatches = pathname === itemPathBase;
    if (itemQuery) {
      const params = new URLSearchParams(itemQuery);
      const typeFromItem = params.get("type");
      const typeFromUrl = searchParams.get("type");
      return pathMatches && typeFromItem === typeFromUrl;
    }
    if (pathMatches) {
      // No-query item shouldn't compete with a sibling that explicitly matches the URL's `type` query
      if (searchParams.get("type")) return false;
      return true;
    }
    if (item.submenu) {
      return item.submenu.some((subItem) => isSubItemActive(subItem));
    }
    return false;
  };

  // Section-expansion match: ignores query string and matches nested sub-routes
  // (e.g. /inventory/products keeps Inventory open even though sidebar items use ?type=serial,
  // and /purchases/edit/123 keeps Purchases open even though that route isn't a sidebar item).
  const isMenuRouteInSection = (item: MenuItem): boolean => {
    const [itemBase] = item.path.split("?");
    if (pathname === itemBase) return true;
    if (itemBase !== "/" && pathname.startsWith(itemBase + "/")) return true;
    if (item.submenu) {
      return item.submenu.some((sub) => {
        const [subBase] = sub.path.split("?");
        if (pathname === subBase) return true;
        if (subBase !== "/" && pathname.startsWith(subBase + "/")) return true;
        return false;
      });
    }
    return false;
  };

  // Section that contains the currently active route — stays expanded like Main.
  const activeSectionLabel = useMemo<string | null>(() => {
    for (const section of filteredSections) {
      if (section.items.some((item) => isMenuRouteInSection(item))) return section.label;
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredSections, pathname, searchKey]);

  useEffect(() => {
    setMenuVisibility(getSidebarVisibility());
  }, []);
  useEffect(() => {
    const onVisibilityChange = (e: Event) => {
      const ev = e as CustomEvent<SidebarMenuVisibility>;
      if (ev.detail) setMenuVisibility(ev.detail);
      else setMenuVisibility(getSidebarVisibility());
    };
    window.addEventListener("pos-sidebar-visibility-change", onVisibilityChange);
    return () => window.removeEventListener("pos-sidebar-visibility-change", onVisibilityChange);
  }, []);

  const shouldExpandMenu = (item: MenuItem): boolean => expandedMenu === item.title;

  // Expand submenu parent when current route matches that item (query-aware); clear when leaf link active
  useEffect(() => {
    let found: MenuItem | null = null;
    for (const section of filteredSections) {
      const activeItem = section.items.find((item) => isMenuActive(item));
      if (activeItem) {
        found = activeItem;
        break;
      }
    }
    if (!found) {
      setExpandedMenu(null);
      return;
    }
    if (found.submenu && found.submenu.length > 0) {
      setExpandedMenu(found.title);
    } else {
      setExpandedMenu(null);
    }
  }, [pathname, searchKey, filteredSections]);

  // Ensure Main is in the expanded set whenever that section exists
  useEffect(() => {
    if (!hasMainSection) return;
    setExpandedSectionsState((prev) => {
      if (prev.has(MAIN_SECTION_LABEL)) return prev;
      const next = new Set(prev);
      next.add(MAIN_SECTION_LABEL);
      saveExpandedSections(Array.from(next));
      return next;
    });
  }, [hasMainSection]);

  // Sections: Main + the active route's section are pinned open. Manually-expanded
  // sections persist until the user collapses them OR navigates to another section.
  // We only react to route changes here — not to filteredSections re-references —
  // otherwise entitlement/permission re-fetches would wipe manual expansion state.
  const prevActiveSectionRef = useRef<string | null>(activeSectionLabel);
  useEffect(() => {
    setExpandedSectionsState((prev) => {
      const next = new Set(prev);
      if (hasMainSection) next.add(MAIN_SECTION_LABEL);

      const prevActive = prevActiveSectionRef.current;
      if (activeSectionLabel !== prevActive) {
        // Route moved into a different section — collapse the previously-active one
        // (only if it isn't manually pinned by being the new active or Main).
        if (prevActive && prevActive !== MAIN_SECTION_LABEL && prevActive !== activeSectionLabel) {
          next.delete(prevActive);
        }
        if (activeSectionLabel) next.add(activeSectionLabel);
      } else if (activeSectionLabel) {
        next.add(activeSectionLabel);
      }
      prevActiveSectionRef.current = activeSectionLabel;

      const same = prev.size === next.size && [...prev].every((l) => next.has(l));
      if (same) return prev;
      saveExpandedSections(Array.from(next));
      return next;
    });
  }, [activeSectionLabel, hasMainSection]);

  // Handle window resize
  useEffect(() => {
    if (!isMobile) {
      setMobileOpen(false);
    }
  }, [isMobile]);

  // Auto-collapse on tight desktop widths so content has more room.
  // User can still toggle manually — once they do, we stop overriding.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 1279px)");
    const apply = () => {
      if (userTogglledRef.current) return;
      setCollapsed(mq.matches);
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // Toggle sidebar on mobile
  const toggleMobileSidebar = () => {
    setMobileOpen(!mobileOpen);
  };

  // Toggle sidebar collapse
  const toggleCollapse = () => {
    userTogglledRef.current = true;
    const next = !collapsed;
    setCollapsed(next);
    saveCollapsedState({ collapsed: next, userToggled: true });
  };

  const isSectionExpanded = (label: string) => {
    if (label === MAIN_SECTION_LABEL && hasMainSection) return true;
    if (label === activeSectionLabel) return true;
    return expandedSections.has(label);
  };

  const toggleSection = (label: string) => {
    if (label === MAIN_SECTION_LABEL) return;
    // The section holding the current route is pinned open — clicking it is a no-op.
    if (label === activeSectionLabel) return;
    setExpandedSectionsState((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      if (hasMainSection) next.add(MAIN_SECTION_LABEL);
      if (activeSectionLabel) next.add(activeSectionLabel);
      saveExpandedSections(Array.from(next));
      return next;
    });
  };

  // Toggle menu expansion (accordion behavior)
  const toggleMenuExpansion = (menuTitle: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedMenu(expandedMenu === menuTitle ? null : menuTitle);
  };

  // Handle menu item click
  const handleMenuItemClick = (item: MenuItem, e: React.MouseEvent) => {
    if (item.submenu && item.submenu.length > 0) {
      toggleMenuExpansion(item.title, e);
    } else {
      // For mobile, close the sidebar when clicking a menu item
      if (isMobile) {
        setMobileOpen(false);
      }
    }
  };

  // Render menu item (MenuItem has submenu?: { title, path, icon }[])
  const renderMenuItem = (item: MenuItem, index: number, sectionLabel: string) => {
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isActive = isMenuActive(item);
    const isExpanded = shouldExpandMenu(item);
    const iconIdle = SECTION_ITEM_ICON[sectionLabel] ?? "text-slate-500 group-hover:text-slate-700";
    const subDot = SECTION_SUBMENU_DOT[sectionLabel] ?? "bg-gray-400";

    return (
      <div key={`${item.path}-${index}`} className="relative">
        <Link
          href={hasSubmenu ? "#" : item.path}
          onClick={(e) => handleMenuItemClick(item, e)}
          className={cn(
            "flex items-center py-1.5 xl:py-2 px-3 xl:px-4 text-gray-700 hover:bg-orange-50/90 rounded-md cursor-pointer group transition-colors",
            isActive && "bg-orange-50 text-orange-500 shadow-sm ring-1 ring-orange-200/50",
            collapsed && !isMobile && "justify-center px-2"
          )}
        >
          <item.icon
            className={cn(
              "h-4 w-4 xl:h-5 xl:w-5 mr-2.5 xl:mr-3 flex-shrink-0 transition-colors",
              isActive ? "text-orange-500" : iconIdle,
              collapsed && !isMobile && "mr-0"
            )}
          />
          {(!collapsed || isMobile) && (
            <>
              <span className="flex-grow">{item.title}</span>
              {hasSubmenu && (
                <ChevronRight
                  className={cn(
                    "h-4 w-4 transition-transform",
                    isExpanded && "transform rotate-90"
                  )}
                />
              )}
            </>
          )}
        </Link>

        {hasSubmenu && isExpanded && !collapsed && (
          <div className="ml-5 xl:ml-6 mt-1">
            {item.submenu?.map((subItem, subIndex) => (
              <Link
                key={subIndex}
                href={subItem.path}
                onClick={() => isMobile && setMobileOpen(false)}
                className={cn(
                  "flex items-center py-1 xl:py-1.5 px-3 xl:px-4 text-gray-700 hover:text-orange-500 rounded-md transition-colors",
                  isSubItemActive(subItem) ? "text-orange-500 font-medium" : ""
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full mr-2 flex-shrink-0", subDot)} />
                <span>{subItem.title}</span>
              </Link>
            ))}
          </div>
        )}

        {collapsed && !isMobile && hasSubmenu && (
          <div className="absolute left-full top-0 ml-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-300 hidden group-hover:block">
            <div className="py-1">
              <div className="px-4 py-2 text-sm font-medium text-gray-700">
                {item.title}
              </div>
              {item.submenu?.map((subItem, subIndex) => (
                <Link
                  key={subIndex}
                  href={subItem.path}
                  className={cn(
                    "flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100",
                    isSubItemActive(subItem)
                      ? "text-orange-500 font-medium"
                      : ""
                  )}
                >
                  <subItem.icon className="h-4 w-4 mr-2" />
                  <span>{subItem.title}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {collapsed && !isMobile && !hasSubmenu && (
          <div className="absolute left-full top-0 ml-2 px-2 py-1 bg-white rounded-md shadow-lg z-10 border hidden group-hover:block whitespace-nowrap">
            {item.title}
          </div>
        )}
      </div>
    );
  };

  // Mobile sidebar
  // Listen for "pos-sidebar-toggle" event from Header's left hamburger.
  useEffect(() => {
    const open = () => setMobileOpen(true);
    window.addEventListener("pos-sidebar-toggle", open);
    return () => window.removeEventListener("pos-sidebar-toggle", open);
  }, []);

  // Broadcast mobile open state so the Header can hide its own logo while sidebar is over the page.
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("pos-sidebar-state", { detail: { mobileOpen } })
    );
  }, [mobileOpen]);

  if (isMobile) {
    return (
      <>

        {/* Mobile sidebar */}
        <div
          className={cn(
            "fixed inset-0 z-40 transform transition-transform duration-200 ease-out",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />

          {/* Sidebar content */}
          <div className={cn("relative w-64 max-w-[85vw] shadow-xl flex flex-col bg-white", sidebarShellClass)}>
            {/* Header */}
            <div className="flex items-center justify-between gap-2 px-3 py-3 border-b border-gray-300">
              <div className="flex items-center min-w-0 flex-1 h-9 overflow-hidden">
                <img
                  src="/images/inflix-logo.png"
                  alt="Inflix"
                  className="h-8 w-auto max-w-full object-contain object-left"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    e.currentTarget.parentElement?.querySelector(".logo-fallback")?.classList.remove("hidden");
                  }}
                />
                <span className="logo-fallback hidden text-base font-semibold text-gray-800 truncate">Inflix</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-md text-gray-600 hover:bg-gray-100 shrink-0"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Menu sections - only sections user has permission for */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-0">
              {filteredSections.map((section) => {
                const sectionExpanded = isSectionExpanded(section.label);
                const isMain = section.label === MAIN_SECTION_LABEL;
                return (
                  <div
                    key={section.label}
                    className={cn(
                      "relative pl-2",
                      SECTION_ACCENT[section.label] ?? "border-l-[6px] border-l-transparent"
                    )}
                  >
                    {isMain ? (
                      <div
                        className={cn(
                          "flex w-full cursor-default select-none items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold shadow-sm",
                          SECTION_HEADER_CHIP[section.label] ?? "bg-slate-100/90 text-slate-800 ring-1 ring-slate-200/80"
                        )}
                        id={`sidebar-mobile-section-btn-${section.label.replace(/\s+/g, "-")}`}
                        aria-label={`${section.label} (always shown)`}
                      >
                        <ChevronRight className="h-4 w-4 shrink-0 rotate-90" aria-hidden />
                        <span className="truncate">{section.label}</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => toggleSection(section.label)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            toggleSection(section.label);
                          }
                        }}
                        aria-expanded={sectionExpanded}
                        aria-controls={`sidebar-mobile-section-${section.label.replace(/\s+/g, "-")}`}
                        id={`sidebar-mobile-section-btn-${section.label.replace(/\s+/g, "-")}`}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-gray-800 transition-colors",
                          "hover:bg-white/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-1",
                          sectionExpanded &&
                            (SECTION_HEADER_CHIP[section.label] ??
                              "bg-slate-100/90 text-slate-800 ring-1 ring-slate-200/80")
                        )}
                      >
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 shrink-0 transition-transform duration-200",
                            sectionExpanded && "rotate-90"
                          )}
                          aria-hidden
                        />
                        <span className="truncate">{section.label}</span>
                      </button>
                    )}
                    <div
                      id={`sidebar-mobile-section-${section.label.replace(/\s+/g, "-")}`}
                      role="region"
                      aria-labelledby={`sidebar-mobile-section-btn-${section.label.replace(/\s+/g, "-")}`}
                      hidden={!sectionExpanded}
                    >
                      {section.items.map((item, idx) => renderMenuItem(item, idx, section.label))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </>
    );
  }

  // Desktop sidebar
  return (
    <div
      className={cn(
        "h-screen flex flex-col border-r border-gray-200/80 transition-all duration-200 ease-out pt-4 md:flex shadow-sm text-[13px] xl:text-sm",
        sidebarShellClass,
        collapsed ? "w-14 xl:w-16" : "w-52 lg:w-56 xl:w-64"
      )}
    >
      {/* Header: Inflix logo. Expanded 140×40px, collapsed 44×44px. pt-4 on sidebar keeps logo clear of browser edge. */}
      <div
        className={cn(
          "flex border-b border-gray-300 shrink-0 min-h-[56px] items-center gap-2",
          collapsed ? "flex-col px-2 pb-3" : "flex-row justify-between pl-4 pr-3 pb-3"
        )}
      >
        <div
          className={cn(
            "flex items-center justify-center shrink-0 overflow-hidden bg-transparent",
            collapsed ? "w-11 h-11" : "w-[140px] h-10"
          )}
        >
          <img
            src="/images/inflix-logo.png"
            alt="Inflix"
            className={cn(
              "w-full h-full object-contain",
              collapsed ? "object-center" : "object-left object-top"
            )}
            style={{ minWidth: 0, minHeight: 0 }}
            onError={(e) => {
              e.currentTarget.style.display = "none";
              e.currentTarget.parentElement?.querySelector(".logo-fallback")?.classList.remove("hidden");
            }}
          />
          <span className="logo-fallback hidden text-base font-semibold text-gray-800 truncate">Inflix</span>
        </div>
        <button
          onClick={toggleCollapse}
          className="rounded-full bg-orange-500 text-white shrink-0 p-1.5 flex items-center justify-center"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Menu sections - only sections user has permission for */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-0">
        {filteredSections.map((section) => {
          const sectionExpanded = isSectionExpanded(section.label);
          const showSectionHeader = !collapsed;
          return (
            <div
              key={section.label}
              className={cn(
                "relative pl-2",
                SECTION_ACCENT[section.label] ?? "border-l-[6px] border-l-transparent"
              )}
            >
              {showSectionHeader ? (
                <>
                  {section.label === MAIN_SECTION_LABEL ? (
                    <div
                      className={cn(
                        "flex w-full cursor-default select-none items-center gap-2 rounded-lg px-2.5 xl:px-3 py-1.5 xl:py-2 text-left text-[13px] xl:text-sm font-semibold shadow-sm",
                        SECTION_HEADER_CHIP[section.label] ?? "bg-slate-100/90 text-slate-800 ring-1 ring-slate-200/80"
                      )}
                      id={`sidebar-section-btn-${section.label.replace(/\s+/g, "-")}`}
                      aria-label={`${section.label} (always shown)`}
                    >
                      <ChevronRight className="h-4 w-4 shrink-0 rotate-90" aria-hidden />
                      <span className="truncate">{section.label}</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => toggleSection(section.label)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggleSection(section.label);
                        }
                      }}
                      aria-expanded={sectionExpanded}
                      aria-controls={`sidebar-section-${section.label.replace(/\s+/g, "-")}`}
                      id={`sidebar-section-btn-${section.label.replace(/\s+/g, "-")}`}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg px-2.5 xl:px-3 py-1.5 xl:py-2 text-left text-[13px] xl:text-sm font-semibold text-gray-800 transition-colors",
                        "hover:bg-white/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-1",
                        sectionExpanded &&
                          (SECTION_HEADER_CHIP[section.label] ??
                            "bg-slate-100/90 text-slate-800 ring-1 ring-slate-200/80")
                      )}
                    >
                      <ChevronRight
                        className={cn(
                          "h-4 w-4 shrink-0 transition-transform duration-200",
                          sectionExpanded && "rotate-90"
                        )}
                        aria-hidden
                      />
                      <span className="truncate">{section.label}</span>
                    </button>
                  )}
                  <div
                    id={`sidebar-section-${section.label.replace(/\s+/g, "-")}`}
                    role="region"
                    aria-labelledby={`sidebar-section-btn-${section.label.replace(/\s+/g, "-")}`}
                    hidden={!sectionExpanded}
                  >
                    {section.items.map((item, idx) => renderMenuItem(item, idx, section.label))}
                  </div>
                </>
              ) : (
                section.items.map((item, idx) => renderMenuItem(item, idx, section.label))
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
