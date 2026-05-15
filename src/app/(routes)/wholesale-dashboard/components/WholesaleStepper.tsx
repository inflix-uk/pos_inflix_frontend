"use client";

import React from "react";
import { User, Package, CheckCircle } from "lucide-react";

export type WholesaleStep = 1 | 2 | 3;

const STEPS: { num: WholesaleStep; label: string; short: string; Icon: React.ComponentType<{ className?: string }> }[] = [
 { num: 1, label: "Select customer", short: "Customer", Icon: User },
 { num: 2, label: "Add items (scan / search / paste IMEIs)", short: "Add items", Icon: Package },
 { num: 3, label: "Review & complete", short: "Complete", Icon: CheckCircle },
];

interface WholesaleStepperProps {
 currentStep: WholesaleStep;
 /** Step 1 valid when customer is selected */
 step1Valid: boolean;
 /** Step 2 valid when at least one item in cart */
 step2Valid: boolean;
 /** Step 3 valid when can complete (customer + items) */
 step3Valid: boolean;
 className?: string;
 /** Inline with page title — no second full-width card */
 embedded?: boolean;
}

export function WholesaleStepper({
 currentStep,
 step1Valid,
 step2Valid,
 step3Valid,
 className = "",
 embedded = false,
}: WholesaleStepperProps) {
 const shell = embedded
 ? "flex min-w-0 flex-1 items-center justify-center gap-1 @[640px]:gap-2 py-0.5 px-1.5 @[640px]:px-2 bg-slate-50/90 rounded-md border border-slate-100"
 : "flex items-center justify-center gap-2 @[640px]:gap-4 py-2 px-3 bg-white rounded-xl border border-gray-200 shadow-sm";
 return (
 <nav className={`${shell} ${className}`.trim()} aria-label="Order progress">
 {STEPS.map((step, idx) => {
 const isActive = currentStep === step.num;
 const isPast = currentStep > step.num;
 const valid = step.num === 1 ? step1Valid : step.num === 2 ? step2Valid : step3Valid;
 const done = isPast || (isActive && valid);
 return (
  <React.Fragment key={step.num}>
  <div
  className={`flex items-center gap-1.5 px-1.5 @[640px]:px-2 py-0.5 rounded ${
  isActive ? "bg-blue-50 ring-1 ring-blue-200" : done ? "bg-green-50 text-green-800" : "text-gray-500"
  }`}
  aria-current={isActive ? "step" : undefined}
  >
  <span
  className={`flex h-5 w-5 @[640px]:h-6 @[640px]:w-6 shrink-0 items-center justify-center rounded-full text-[10px] @[640px]:text-xs font-semibold ${
   done ? "bg-green-100 text-green-700" : isActive ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"
  }`}
  aria-hidden
  >
  {done ? <step.Icon className="h-3 w-3 @[640px]:h-3.5 @[640px]:w-3.5" /> : step.num}
  </span>
  <span className="hidden @[640px]:inline text-xs font-medium">
  {step.num}. {step.label}
  </span>
  <span className="@[640px]:hidden text-xs font-medium">{step.short}</span>
  </div>
  {idx < STEPS.length - 1 && (
  <div className="h-px w-2 @[640px]:w-4 bg-gray-200 shrink-0" aria-hidden />
  )}
  </React.Fragment>
 );
 })}
 </nav>
 );
}
