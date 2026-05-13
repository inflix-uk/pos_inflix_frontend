const STORAGE_KEY = "pos_sidebar_menu_visibility";

export interface SidebarMenuVisibility {
  hideCreateBulkSales: boolean;
}

const defaults: SidebarMenuVisibility = {
  hideCreateBulkSales: false,
};

export function getSidebarVisibility(): SidebarMenuVisibility {
  if (typeof window === "undefined") return defaults;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<SidebarMenuVisibility>;
    return {
      hideCreateBulkSales: !!parsed.hideCreateBulkSales,
    };
  } catch {
    return defaults;
  }
}

export function setSidebarVisibility(visibility: SidebarMenuVisibility): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visibility));
    window.dispatchEvent(new CustomEvent("pos-sidebar-visibility-change", { detail: visibility }));
  } catch {}
}
