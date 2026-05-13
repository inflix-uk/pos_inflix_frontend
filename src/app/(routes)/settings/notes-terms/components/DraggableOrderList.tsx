"use client";

import React, { useState } from "react";
import { GripVertical } from "lucide-react";

export type DraggableOrderAccent = "orange" | "emerald" | "indigo" | "amber";

const SKIN = {
 ul: "rounded-lg border border-gray-200 bg-white p-2 shadow-sm",
 dragging: "border-orange-300 bg-orange-50 shadow-sm",
 hover: "hover:bg-gray-50",
 grip: "text-gray-400",
};

export function DraggableOrderList<T extends string>({
 ids,
 getLabel,
 onReorder,
 ariaLabel,
 accent: _accent,
}: {
 ids: readonly T[];
 getLabel: (id: T) => string;
 onReorder: (fromIndex: number, toIndex: number) => void;
 ariaLabel: string;
 accent?: DraggableOrderAccent;
}) {
 const [dragIndex, setDragIndex] = useState<number | null>(null);

 return (
 <ul className={`space-y-1 ${SKIN.ul}`} aria-label={ariaLabel}>
 {ids.map((id, index) => (
 <li
  key={id}
  draggable
  onDragStart={() => setDragIndex(index)}
  onDragOver={(e) => e.preventDefault()}
  onDrop={() => {
  if (dragIndex === null || dragIndex === index) return;
  onReorder(dragIndex, index);
  setDragIndex(null);
  }}
  onDragEnd={() => setDragIndex(null)}
  className={`flex cursor-grab items-center gap-2 rounded-lg border border-transparent px-2 py-1.5 text-sm text-gray-800 active:cursor-grabbing ${SKIN.hover} ${
  dragIndex === index ? SKIN.dragging : ""
  }`}
 >
  <GripVertical className={`h-4 w-4 shrink-0 ${SKIN.grip}`} aria-hidden />
  <span className="min-w-0 flex-1">{getLabel(id)}</span>
 </li>
 ))}
 </ul>
 );
}
