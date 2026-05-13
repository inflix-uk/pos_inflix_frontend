"use client";
import React from "react";
import { Plus } from "lucide-react";
import SearchableSelect from "./SearchableSelect";
import { SelectOption } from "../types";

interface BaseFieldProps {
 label: string;
 required?: boolean;
 className?: string;
}

interface InputFieldProps extends BaseFieldProps {
 type: "text" | "number" | "email";
 value: string;
 onChange: (value: string) => void;
 placeholder?: string;
 withButton?: {
 label: string;
 onClick: () => void;
 };
}

interface SelectFieldProps extends BaseFieldProps {
 type: "select";
 value: string;
 onChange: (value: string) => void;
 options: SelectOption[];
 placeholder?: string;
 withAddButton?: {
 onClick: () => void;
 };
 onFocus?: () => void;
}

interface TextareaFieldProps extends BaseFieldProps {
 type: "textarea";
 value: string;
 onChange: (value: string) => void;
 placeholder?: string;
 rows?: number;
 maxWords?: number;
}

type FormFieldProps = InputFieldProps | SelectFieldProps | TextareaFieldProps;

export default function FormField(props: FormFieldProps) {
 const { label, required, className = "" } = props;

 const renderField = () => {
 switch (props.type) {
 case "text":
 case "number":
 case "email":
 return (
  <div className={props.withButton ? "flex" : ""}>
  <input
  type={props.type}
  value={props.value}
  onChange={(e) => props.onChange(e.target.value)}
  placeholder={props.placeholder}
  className={`${props.withButton ? "flex-1 rounded-l-md" : "w-full rounded-md"} px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
  />
  {props.withButton && (
  <button
  type="button"
  onClick={props.withButton.onClick}
  className="px-4 py-2 bg-orange-400 text-white rounded-r-md text-sm font-medium hover:bg-orange-500"
  >
  {props.withButton.label}
  </button>
  )}
  </div>
 );

 case "select":
 return (
  <div className={props.withAddButton ? "flex items-center space-x-2" : ""}>
  <div className={props.withAddButton ? "flex-1" : ""}>
  <SearchableSelect
  value={props.value}
  onChange={props.onChange}
  options={props.options}
  placeholder={props.placeholder || "Select..."}
  onFocus={props.onFocus}
  />
  </div>
  {props.withAddButton && (
  <button
  type="button"
  onClick={props.withAddButton.onClick}
  className="flex items-center text-orange-400 text-sm font-medium hover:text-orange-500"
  >
  <Plus className="w-4 h-4 mr-1" />
  Add New
  </button>
  )}
  </div>
 );

 case "textarea":
 return (
  <>
  <textarea
  value={props.value}
  onChange={(e) => props.onChange(e.target.value)}
  placeholder={props.placeholder}
  rows={props.rows || 4}
  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
  />
  {props.maxWords && (
  <p className="text-xs text-gray-500 mt-1">Maximum {props.maxWords} Words</p>
  )}
  </>
 );

 default:
 return null;
 }
 };

 return (
 <div className={className}>
 <label className="block text-sm font-medium text-gray-700 mb-2">
 {label} {required && <span className="text-red-500">*</span>}
 </label>
 {renderField()}
 </div>
 );
}
