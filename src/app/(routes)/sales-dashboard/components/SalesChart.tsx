"use client";

import React, { useEffect, useRef } from "react";
import type { SalesChartData } from "../types";
import type { Chart } from "chart.js";

declare global {
 interface Window {
 Chart: typeof Chart;
 }
}

interface SalesChartProps {
 data: SalesChartData;
 title?: string;
 periodLabel?: string;
}

export const SalesChart: React.FC<SalesChartProps> = ({
 data,
 title = "Sales Overview",
 periodLabel = "Last 7 days",
}) => {
 const chartRef = useRef<HTMLCanvasElement>(null);
 const chartInstance = useRef<Chart | null>(null);

 useEffect(() => {
 let mounted = true;

 const loadChart = () => {
 if (typeof window === "undefined" || !chartRef.current || !mounted) return;
 if (!window.Chart) {
 const script = document.createElement("script");
 script.src = "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js";
 script.async = true;
 script.onload = createChart;
 document.head.appendChild(script);
 return;
 }
 createChart();
 };

 const createChart = () => {
 if (!chartRef.current || !mounted) return;
 const ctx = chartRef.current.getContext("2d");
 if (!ctx || !window.Chart) return;

 if (chartInstance.current) {
 chartInstance.current.destroy();
 chartInstance.current = null;
 }

 chartInstance.current = new window.Chart(ctx, {
 type: "bar",
 data: {
  labels: data.labels,
  datasets: [
  {
  label: "Sales",
  data: data.dailySales,
  backgroundColor: "rgba(249, 115, 22, 0.8)",
  borderRadius: 6,
  borderSkipped: false,
  },
  ],
 },
 options: {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
  legend: { display: false },
  },
  scales: {
  x: {
  grid: { display: false },
  border: { display: false },
  ticks: {
  maxRotation: 45,
  minRotation: 0,
  font: { size: 10 },
  },
  },
  y: {
  grid: { color: "#f1f5f9" },
  border: { display: false },
  ticks: { font: { size: 10 } },
  },
  },
 },
 });
 };

 loadChart();
 return () => {
 mounted = false;
 if (chartInstance.current) {
 chartInstance.current.destroy();
 chartInstance.current = null;
 }
 };
 }, [data.labels, data.dailySales]);

 return (
 <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
 <h2 className="text-base sm:text-lg font-semibold text-gray-800">
  {title}
 </h2>
 {periodLabel && (
  <span className="text-gray-500 text-sm">{periodLabel}</span>
 )}
 </div>
 <div className="h-56 sm:h-64 md:h-72 w-full" style={{ minHeight: "224px" }}>
 <canvas ref={chartRef} className="w-full h-full" />
 </div>
 </div>
 );
};
