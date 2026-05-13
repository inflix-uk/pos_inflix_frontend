"use client";

import React from "react";
import { Plus, X } from "lucide-react";
import { ProductImage } from "../types";

const labelClass = "block text-sm font-medium text-gray-700 mb-2";

interface ImagesSectionProps {
 images: ProductImage[];
 uploadedImages: File[];
 addImages: (files: FileList | null) => void;
 removeImage: (id: number) => void;
 isExpanded?: boolean;
 onToggle?: () => void;
}

export default function ImagesSection({
 images,
 uploadedImages,
 addImages,
 removeImage,
 isExpanded = true,
 onToggle,
}: ImagesSectionProps) {
 return (
 <div>
 <label className={labelClass}>IMAGES</label>
 <div className="flex gap-4 items-start flex-wrap">
 <label className="w-28 h-36 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-orange-300 hover:text-orange-500 cursor-pointer bg-gray-50 transition-colors">
  <Plus className="w-8 h-8 mb-2" />
  <span className="text-xs font-medium">Add images</span>
  <input
  type="file"
  multiple
  accept="image/*"
  onChange={(e) => addImages(e.target.files)}
  className="hidden"
  />
 </label>

 {images.map((image, index) => {
  const uploadedImage = uploadedImages[index];
  return (
  <div key={image.id} className="relative group">
  <div className="w-28 h-36 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
  {uploadedImage ? (
   <img
   src={URL.createObjectURL(uploadedImage)}
   alt={`Product ${index + 1}`}
   className="w-full h-full object-cover"
   />
  ) : image.url ? (
   <img
   src={image.url}
   alt={`Product ${index + 1}`}
   className="w-full h-full object-cover"
   />
  ) : (
   <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
   No image
   </div>
  )}
  </div>
  <button
  type="button"
  onClick={() => removeImage(image.id)}
  className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-sm"
  >
  <X className="w-3.5 h-3.5" />
  </button>
  </div>
  );
 })}
 </div>
 </div>
 );
}
