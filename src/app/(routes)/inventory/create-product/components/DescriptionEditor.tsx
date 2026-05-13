"use client";
import React from "react";
import {
 Bold,
 Italic,
 Underline,
 Link as LinkIcon,
 Image as ImageIcon,
 List,
 AlignLeft,
 Code,
 ChevronDown,
} from "lucide-react";

interface DescriptionEditorProps {
 value: string;
 onChange: (value: string) => void;
}

export default function DescriptionEditor({ value, onChange }: DescriptionEditorProps) {
 return (
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-2">DESCRIPTION</label>

 {/* Rich Text Editor Toolbar */}
 <div className="border border-gray-200 rounded-t-lg bg-gray-50 px-3 py-2 flex items-center space-x-1">
 <ToolbarButton icon={<SettingsIcon />} />
 <Divider />
 <ToolbarButton icon={<Bold className="w-4 h-4" />} />
 <ToolbarButton icon={<Italic className="w-4 h-4" />} />
 <ToolbarButton icon={<Underline className="w-4 h-4" />} />
 <ToolbarButton icon={<PenIcon />} />
 <Divider />
 <div className="relative">
  <select className="text-sm text-gray-600 bg-transparent border-none focus:outline-none pr-6 appearance-none">
  <option>Nuntito</option>
  </select>
  <ChevronDown className="absolute right-0 top-1 w-3 h-3 text-gray-400 pointer-events-none" />
 </div>
 <Divider />
 <ToolbarButton icon={<HighlightIcon />} className="text-yellow-500" />
 <Divider />
 <ToolbarButton icon={<List className="w-4 h-4" />} />
 <ToolbarButton icon={<ListNumberedIcon />} />
 <ToolbarButton icon={<AlignLeft className="w-4 h-4" />} />
 <Divider />
 <ToolbarButton icon={<TableIcon />} />
 <ToolbarButton icon={<LinkIcon className="w-4 h-4" />} />
 <ToolbarButton icon={<ImageIcon className="w-4 h-4" />} />
 <ToolbarButton icon={<AttachmentIcon />} />
 <ToolbarButton icon={<ClearIcon />} />
 <ToolbarButton icon={<Code className="w-4 h-4" />} />
 <ToolbarButton icon={<HelpIcon />} />
 </div>

 {/* Text Area */}
 <textarea
 className="w-full h-32 px-3 py-2 border border-gray-300 border-t-0 rounded-b-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none text-gray-800"
 value={value}
 onChange={(e) => onChange(e.target.value)}
 />

 <p className="text-xs text-gray-500 mt-1">Maximum 60 Words</p>
 </div>
 );
}

// Helper components
function ToolbarButton({ icon, className = "" }: { icon: React.ReactNode; className?: string }) {
 return (
 <button
 type="button"
 className={`p-1.5 text-gray-600 hover:bg-gray-200 rounded ${className}`}
 >
 {icon}
 </button>
 );
}

function Divider() {
 return <div className="w-px h-6 bg-gray-300 mx-1" />;
}

// Custom icons
function SettingsIcon() {
 return (
 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path
 strokeLinecap="round"
 strokeLinejoin="round"
 strokeWidth={2}
 d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
 />
 </svg>
 );
}

function PenIcon() {
 return (
 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path
 strokeLinecap="round"
 strokeLinejoin="round"
 strokeWidth={2}
 d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
 />
 </svg>
 );
}

function HighlightIcon() {
 return (
 <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
 <path d="M7 14l3-3 3 3z" />
 </svg>
 );
}

function ListNumberedIcon() {
 return (
 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path
 strokeLinecap="round"
 strokeLinejoin="round"
 strokeWidth={2}
 d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
 />
 </svg>
 );
}

function TableIcon() {
 return (
 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path
 strokeLinecap="round"
 strokeLinejoin="round"
 strokeWidth={2}
 d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
 />
 </svg>
 );
}

function AttachmentIcon() {
 return (
 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path
 strokeLinecap="round"
 strokeLinejoin="round"
 strokeWidth={2}
 d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
 />
 </svg>
 );
}

function ClearIcon() {
 return (
 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
 </svg>
 );
}

function HelpIcon() {
 return (
 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path
 strokeLinecap="round"
 strokeLinejoin="round"
 strokeWidth={2}
 d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
 />
 </svg>
 );
}
