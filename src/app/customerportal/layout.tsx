"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Receipt,
  ShoppingBag,
  User,
  LogOut,
  FileText,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  { title: "Account Statement", path: "/customerportal/dashboard", icon: Receipt },
  { title: "Invoices", path: "/customerportal/invoices", icon: ShoppingBag },
];

export default function CustomerPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [customer, setCustomer] = useState<{ name: string; email: string } | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Login page — render without sidebar/header
  const isLoginPage = pathname === "/customerportal";

  useEffect(() => {
    if (isLoginPage) return;
    const stored = localStorage.getItem("cp_customer");
    const token = localStorage.getItem("cp_token");
    if (!stored || !token) {
      router.push("/customerportal");
      return;
    }
    try {
      setCustomer(JSON.parse(stored));
    } catch {
      router.push("/customerportal");
    }
  }, [isLoginPage, router]);

  const handleLogout = () => {
    localStorage.removeItem("cp_token");
    localStorage.removeItem("cp_customer");
    router.push("/customerportal");
  };

  if (isLoginPage) return <>{children}</>;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          flex flex-col bg-white border-r border-gray-200 shadow-sm
          transition-all duration-200
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${collapsed ? "w-[72px]" : "w-64"}
        `}
      >
        {/* Sidebar header */}
        <div className={`flex items-center border-b border-gray-200 ${collapsed ? "justify-center px-2 py-4" : "px-4 py-4"}`}>
          {!collapsed && (
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center shrink-0">
                <FileText className="text-white" size={18} />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-bold text-gray-900 truncate">Customer Portal</h1>
                <p className="text-xs text-gray-500 truncate">{customer?.name || ""}</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center">
              <FileText className="text-white" size={18} />
            </div>
          )}
          {/* Close on mobile */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1 hover:bg-gray-100 rounded ml-2"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 rounded-lg transition-colors
                  ${collapsed ? "justify-center px-2 py-3" : "px-3 py-2.5"}
                  ${isActive
                    ? "bg-orange-50 text-orange-600 font-medium"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }
                `}
                title={collapsed ? item.title : undefined}
              >
                <Icon size={20} className={isActive ? "text-orange-500" : "text-gray-400"} />
                {!collapsed && <span className="text-sm">{item.title}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="border-t border-gray-200 p-2 space-y-1">
          {/* Collapse toggle - desktop only */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center w-full p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          {/* Logout */}
          <button
            onClick={handleLogout}
            className={`
              flex items-center gap-3 w-full rounded-lg text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors
              ${collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"}
            `}
            title={collapsed ? "Sign Out" : undefined}
          >
            <LogOut size={20} />
            {!collapsed && <span className="text-sm">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top header bar */}
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-1.5 hover:bg-gray-100 rounded-lg"
              >
                <Menu size={20} className="text-gray-600" />
              </button>
              <h2 className="text-base font-semibold text-gray-900">
                {NAV_ITEMS.find((n) => n.path === pathname)?.title || "Customer Portal"}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
                <User size={16} />
                <span>{customer?.name || ""}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
