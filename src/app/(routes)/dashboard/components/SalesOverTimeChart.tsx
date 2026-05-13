"use client";

import React, { useEffect, useRef } from "react";
import { TrendingUp } from "lucide-react";
import type { Chart } from "chart.js";
import type { SalesTimeSeriesPoint } from "../service/dashboardApi";
import { usePermissions } from "@/hooks/usePermissions";

declare global {
 interface Window {
 Chart: typeof Chart;
 }
}

interface SalesOverTimeChartProps {
 series: SalesTimeSeriesPoint[];
 periodLabel?: string;
}

const formatDayLabel = (yyyyMmDd: string): string => {
 // yyyy-mm-dd → "Mon DD" (e.g. "Mar 5"). Built locally to avoid TZ shifts.
 const [y, m, d] = yyyyMmDd.split("-").map(Number);
 if (!y || !m || !d) return yyyyMmDd;
 const date = new Date(Date.UTC(y, m - 1, d));
 return date.toLocaleDateString("en-GB", { month: "short", day: "numeric", timeZone: "UTC" });
};

export function SalesOverTimeChart({ series, periodLabel }: SalesOverTimeChartProps) {
 const { can } = usePermissions();
 const chartRef = useRef<HTMLCanvasElement>(null);
 const chartInstance = useRef<Chart | null>(null);

 useEffect(() => {
  let mounted = true;

  const createChart = () => {
   if (!chartRef.current || !mounted) return;
   const ctx = chartRef.current.getContext("2d");
   if (!ctx || !window.Chart) return;

   if (chartInstance.current) {
    chartInstance.current.destroy();
    chartInstance.current = null;
   }

   const labels = series.map((p) => formatDayLabel(p.date));
   const totals = series.map((p) => Number(p.total) || 0);
   const counts = series.map((p) => Number(p.count) || 0);

   chartInstance.current = new window.Chart(ctx, {
    type: "line",
    data: {
     labels,
     datasets: [
      {
       label: "Revenue (£)",
       data: totals,
       borderColor: "rgb(34, 197, 94)",
       backgroundColor: "rgba(34, 197, 94, 0.15)",
       fill: true,
       tension: 0.3,
       pointRadius: series.length > 30 ? 0 : 3,
       pointHoverRadius: 5,
       borderWidth: 2,
       yAxisID: "y",
      },
      {
       label: "Orders",
       data: counts,
       borderColor: "rgb(59, 130, 246)",
       backgroundColor: "rgba(59, 130, 246, 0.10)",
       borderDash: [4, 4],
       fill: false,
       tension: 0.3,
       pointRadius: series.length > 30 ? 0 : 2,
       pointHoverRadius: 4,
       borderWidth: 1.5,
       yAxisID: "y1",
      },
     ],
    },
    options: {
     responsive: true,
     maintainAspectRatio: false,
     interaction: { mode: "index", intersect: false },
     plugins: {
      legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 11 } } },
      tooltip: {
       callbacks: {
        label: (ctx) => {
         const v = Number(ctx.parsed.y) || 0;
         if (ctx.dataset.yAxisID === "y") {
          return ` ${ctx.dataset.label}: ${new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(v)}`;
         }
         return ` ${ctx.dataset.label}: ${v}`;
        },
       },
      },
     },
     scales: {
      x: {
       grid: { display: false },
       border: { display: false },
       ticks: {
        maxRotation: 45,
        minRotation: 0,
        autoSkip: true,
        maxTicksLimit: 12,
        font: { size: 10 },
       },
      },
      y: {
       position: "left",
       grid: { color: "#f1f5f9" },
       border: { display: false },
       ticks: {
        font: { size: 10 },
        callback: (val) => "£" + new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 }).format(Number(val) || 0),
       },
      },
      y1: {
       position: "right",
       grid: { display: false },
       border: { display: false },
       ticks: { font: { size: 10 }, precision: 0 },
      },
     },
    },
   });
  };

  if (typeof window !== "undefined" && !window.Chart) {
   const existing = document.querySelector('script[data-chartjs-cdn="true"]') as HTMLScriptElement | null;
   if (existing) {
    existing.addEventListener("load", createChart, { once: true });
   } else {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js";
    script.async = true;
    script.dataset.chartjsCdn = "true";
    script.onload = createChart;
    document.head.appendChild(script);
   }
  } else {
   createChart();
  }

  return () => {
   mounted = false;
   if (chartInstance.current) {
    chartInstance.current.destroy();
    chartInstance.current = null;
   }
  };
 }, [series]);

 if (!can("sale.view")) return null;

 const totalRevenue = series.reduce((sum, p) => sum + (Number(p.total) || 0), 0);
 const totalOrders = series.reduce((sum, p) => sum + (Number(p.count) || 0), 0);

 return (
 <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
 <div className="px-3 @[640px]:px-4 @[768px]:px-6 py-2.5 @[640px]:py-3 @[768px]:py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
 <div className="flex items-center gap-2">
 <TrendingUp className="h-4 w-4 @[768px]:h-5 @[768px]:w-5 text-green-600" />
 <h2 className="text-sm @[640px]:text-base @[768px]:text-lg font-semibold text-gray-900">Sales over time</h2>
 {periodLabel && <span className="text-[10px] @[640px]:text-xs text-gray-500">{periodLabel}</span>}
 </div>
 <div className="text-[10px] @[640px]:text-xs text-gray-600">
 <span className="font-semibold text-gray-900">
  {new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(totalRevenue)}
 </span>{" "}
 · {totalOrders} order{totalOrders === 1 ? "" : "s"}
 </div>
 </div>
 <div className="p-3 @[640px]:p-4 @[768px]:p-5">
 {series.length === 0 ? (
  <p className="text-[11px] @[640px]:text-xs @[768px]:text-sm text-gray-500 py-6 text-center">No sales data for this period.</p>
 ) : (
  <div className="h-56 @[768px]:h-64 @[1024px]:h-72 w-full" style={{ minHeight: "224px" }}>
  <canvas ref={chartRef} className="w-full h-full" />
  </div>
 )}
 </div>
 </div>
 );
}
