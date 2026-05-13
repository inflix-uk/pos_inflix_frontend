"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, Loader2, AlertTriangle } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function CustomerPortalLoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({ email: "", password: "", general: "" });
  const [invoicingEnabled, setInvoicingEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/customer-portal/feature-status`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setInvoicingEnabled(json.data.customerInvoicingEnabled);
        else setInvoicingEnabled(false);
      })
      .catch(() => setInvoicingEnabled(false));
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = { email: "", password: "", general: "" };
    if (!formData.email) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
      isValid = false;
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
      isValid = false;
    }
    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({ email: "", password: "", general: "" });

    try {
      const response = await fetch(`${API_BASE}/api/customer-portal/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, password: formData.password }),
      });
      const data = await response.json();

      if (data.success) {
        localStorage.setItem("cp_token", data.token);
        localStorage.setItem("cp_customer", JSON.stringify(data.data));
        router.push("/customerportal/dashboard");
      } else {
        setErrors((prev) => ({
          ...prev,
          general: data.message || "Invalid credentials",
        }));
      }
    } catch {
      setErrors((prev) => ({
        ...prev,
        general: "Unable to connect to server. Please try again.",
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-orange-400 to-orange-500 items-center justify-center p-12">
        <div className="max-w-lg w-full text-center flex flex-col items-center">
          <div className="mb-6 flex items-center justify-center">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl px-10 py-8 shadow-lg flex items-center justify-center min-h-[60px]">
              <img
                src="/images/inflix-logo-login.png"
                alt="Inflix"
                width={600}
                height={600}
                className="w-[600px] max-w-[92%] h-auto max-h-[160px] object-contain object-center"
              />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Customer Portal</h2>
          <p className="text-white/90 text-lg">
            View your account statement, transaction history, and outstanding balance.
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-2xl mb-4">
              <svg
                className="w-10 h-10 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Customer Sign In</h1>
            <p className="text-gray-500 mt-2">
              Access your account statement and transaction history
            </p>
          </div>

          {invoicingEnabled === false && (
            <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800">Customer Portal Unavailable</p>
                <p className="text-sm text-amber-600 mt-0.5">
                  The Customer Invoicing feature is not enabled for this account. Please contact your administrator.
                </p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {errors.general && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {errors.general}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`block w-full pl-10 pr-4 py-3 border ${
                      errors.email ? "border-red-300" : "border-gray-200"
                    } rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-800 placeholder-gray-400`}
                    placeholder="Enter your email"
                  />
                </div>
                {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`block w-full pl-10 pr-12 py-3 border ${
                      errors.password ? "border-red-300" : "border-gray-200"
                    } rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-800 placeholder-gray-400`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoading || invoicingEnabled === false}
                className={`w-full font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center disabled:cursor-not-allowed ${
                  invoicingEnabled === false
                    ? "bg-gray-300 text-gray-500"
                    : "bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-70"
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
          </div>

          {/* Staff Login Link */}
          <div className="mt-6 text-center">
            <a
              href="/"
              className="text-sm text-orange-500 hover:text-orange-600 font-medium"
            >
              &larr; Sign in as Staff
            </a>
          </div>

          <p className="mt-6 text-center text-xs text-gray-400">
            &copy; 2026 Inflix. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
