"use client";

import { useRouter } from "next/navigation";
import { ShieldX, Mail, LogOut } from "lucide-react";

const INFLIX_EMAIL = "hello@inflix.co.uk";

export default function SuspendedPage() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.replace("/");
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center animate-in fade-in zoom-in duration-300">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-5">
          <ShieldX className="w-8 h-8 text-red-600" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Account Suspended
        </h1>

        {/* Message */}
        <p className="text-gray-600 mb-6 leading-relaxed">
          Your account has been suspended by the platform administrator.
          All features are currently disabled. Please contact support to
          resolve this issue.
        </p>

        {/* Contact info */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-1">
            <Mail className="w-4 h-4" />
            <span>Contact Support</span>
          </div>
          <a
            href={`mailto:${INFLIX_EMAIL}`}
            className="text-orange-600 font-semibold hover:text-orange-700 transition-colors"
          >
            {INFLIX_EMAIL}
          </a>
        </div>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-xl transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
