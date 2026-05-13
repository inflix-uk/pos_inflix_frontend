"use client";

import React from "react";
import { Check } from "lucide-react";
import { Step } from "../types";

interface StepItem {
 key: Step;
 label: string;
 number: number;
}

interface StepIndicatorProps {
 steps: StepItem[];
 currentStepIndex: number;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ steps, currentStepIndex }) => {
 return (
 <div className="flex items-center justify-center mt-8 mb-8">
 {steps.map((step, index) => (
 <React.Fragment key={step.key}>
  <div className="flex items-center">
  <div
  className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm transition-colors ${
  index < currentStepIndex
   ? "bg-green-500 text-white"
   : index === currentStepIndex
   ? "bg-orange-500 text-white"
   : "bg-gray-200 text-gray-500"
  }`}
  >
  {index < currentStepIndex ? <Check size={18} /> : step.number}
  </div>
  <span
  className={`ml-2 text-sm font-medium ${
  index === currentStepIndex
   ? "text-orange-500"
   : index < currentStepIndex
   ? "text-green-600"
   : "text-gray-400"
  }`}
  >
  {step.label}
  </span>
  </div>
  {index < steps.length - 1 && (
  <div
  className={`w-16 h-0.5 mx-4 ${
  index < currentStepIndex ? "bg-green-500" : "bg-gray-200"
  }`}
  />
  )}
 </React.Fragment>
 ))}
 </div>
 );
};
