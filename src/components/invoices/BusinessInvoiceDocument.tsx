"use client";

import React from "react";

/** Sample / default invoice payload (replace with live sale data when wiring to POS). */
export interface BusinessInvoiceDocumentData {
  company: {
    name: string;
    logoText?: string;
    addressLines: string[];
    phone?: string;
    email?: string;
    companyNumber?: string;
    vatNumber?: string;
  };
  invoice: {
    number: string;
    date: string;
    title?: string;
    qrPayload?: string;
  };
  billTo: { name: string; addressLines?: string[] };
  from: { name: string; addressLines?: string[] };
  lineItems: Array<{
    description: string;
    qty: number;
    unitPrice: number;
    amount: number;
  }>;
  totals: {
    netExVat: number;
    vatLabel: string;
    vatAmount: number;
    totalIncVat: number;
  };
  accountSummary?: {
    previousBalance: number;
    invoicePlusPrevious: number;
    paymentsReceived: number;
    balanceDue: number;
  };
  payments: Array<{ method: string; amount: number }>;
  terms: string;
}

export const SAMPLE_BUSINESS_INVOICE: BusinessInvoiceDocumentData = {
  company: {
    name: "Inflix",
    logoText: "inflix",
    addressLines: ["27 Church Street", "St Helens", "WA10 1AX"],
    phone: "0333 334 78599",
    email: "demo@inflix.co.uk",
    companyNumber: "12331231",
    vatNumber: "789465",
  },
  invoice: {
    number: "INVC-000012",
    date: "27 May 2026",
    title: "INVOICE",
    qrPayload: "INVC-000012",
  },
  billTo: {
    name: "Walk-in Customer",
    addressLines: ["United Kingdom"],
  },
  from: {
    name: "Inflix",
    addressLines: ["27 Church Street", "St Helens", "WA10 1AX"],
  },
  lineItems: [
    {
      description: "iPhone 6 Cover",
      qty: 1,
      unitPrice: 4.99,
      amount: 4.99,
    },
    {
      description: "Phone Case · Samsung · Galaxy S21 · Black",
      qty: 1,
      unitPrice: 7.99,
      amount: 7.99,
    },
  ],
  totals: {
    netExVat: 12.98,
    vatLabel: "Marginal VAT @ 0%",
    vatAmount: 0,
    totalIncVat: 12.98,
  },
  payments: [],
  terms:
    "30 Days Limited Warranty.\nAll Stock is Tested by Professionals.",
};

const NAVY = "#1a2340";
const MUTED = "#64748b";
const BORDER = "#e2e8f0";
const PANEL = "#f7f8fa";
const GREEN = "#059669";
const GREEN_BG = "#ecfdf5";
function formatMoney(n: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
  }).format(n);
}

function InflixLogoMark({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2">
      <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden>
        <rect width="40" height="40" rx="10" fill={NAVY} />
        <path
          d="M12 28V12h4.2l5.8 9.2V12H26v16h-4.2l-5.8-9.4V28H12z"
          fill="#fff"
        />
      </svg>
      <span
        className="text-2xl font-bold tracking-tight"
        style={{ color: NAVY, fontFamily: "Inter, system-ui, sans-serif" }}
      >
        {text}
      </span>
    </div>
  );
}

function QrPlaceholder({ label }: { label: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-white p-2"
      style={{ width: 88, height: 88 }}
      title={label}
    >
      <div
        className="grid grid-cols-5 gap-0.5 opacity-80"
        style={{ width: 56, height: 56 }}
      >
        {Array.from({ length: 25 }).map((_, i) => (
          <div
            key={i}
            className="rounded-sm"
            style={{
              backgroundColor: (i + Math.floor(i / 5)) % 2 === 0 ? NAVY : "transparent",
              border: `1px solid ${BORDER}`,
            }}
          />
        ))}
      </div>
      <span className="mt-1 text-[8px] font-medium uppercase tracking-wider text-slate-400">
        QR
      </span>
    </div>
  );
}

function Divider() {
  return <hr className="my-5 border-0 border-t border-slate-200" />;
}

export interface BusinessInvoiceDocumentProps {
  data?: BusinessInvoiceDocumentData;
  className?: string;
}

/**
 * Professional A4 business invoice — screen preview & print (use with window.print()).
 */
export function BusinessInvoiceDocument({
  data = SAMPLE_BUSINESS_INVOICE,
  className = "",
}: BusinessInvoiceDocumentProps) {
  const isPaid =
    (data.accountSummary?.balanceDue ?? data.totals.totalIncVat) <= 0.004;

  return (
    <article
      className={`mx-auto w-full max-w-[794px] bg-white text-slate-900 shadow-lg print:max-w-none print:shadow-none ${className}`}
      style={{ fontFamily: "Inter, DM Sans, system-ui, sans-serif" }}
    >
      {/* Top accent */}
      <div className="h-1" style={{ backgroundColor: NAVY }} />

      <div className="px-8 pb-8 pt-6 print:px-6">
        {/* Header */}
        <header className="relative flex flex-wrap items-start justify-between gap-6">
          {isPaid && (
            <span
              className="absolute right-0 top-0 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide text-white print:border print:border-emerald-700"
              style={{ backgroundColor: GREEN }}
            >
              Paid
            </span>
          )}

          <div className="min-w-0 flex-1 pr-24">
            <InflixLogoMark text={data.company.logoText ?? data.company.name} />
            <div className="mt-3 space-y-0.5 text-sm" style={{ color: MUTED }}>
              {data.company.addressLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
              {data.company.phone && <p>Tel: {data.company.phone}</p>}
              {data.company.email && <p>{data.company.email}</p>}
              {data.company.companyNumber && (
                <p className="font-semibold text-slate-700">
                  Company no. {data.company.companyNumber}
                </p>
              )}
              {data.company.vatNumber && (
                <p className="font-semibold text-slate-700">
                  VAT no. {data.company.vatNumber}
                </p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-3">
            <div
              className="rounded-lg px-5 py-4 text-right shadow-sm"
              style={{ backgroundColor: PANEL, border: `1px solid ${BORDER}` }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-[0.2em]"
                style={{ color: MUTED }}
              >
                {data.invoice.title ?? "INVOICE"}
              </p>
              <p
                className="mt-1 text-2xl font-extrabold tracking-tight"
                style={{ color: NAVY }}
              >
                {data.invoice.title ?? "INVOICE"}
              </p>
              <div className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between gap-6">
                  <span style={{ color: MUTED }}>Invoice no.</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {data.invoice.number}
                  </span>
                </div>
                <div className="flex justify-between gap-6">
                  <span style={{ color: MUTED }}>Date</span>
                  <span className="font-medium text-slate-800">{data.invoice.date}</span>
                </div>
              </div>
            </div>
            {data.invoice.qrPayload && (
              <QrPlaceholder label={data.invoice.qrPayload} />
            )}
          </div>
        </header>

        <Divider />

        {/* Bill To / From */}
        <section className="grid gap-4 sm:grid-cols-2">
          <div
            className="rounded-lg p-4"
            style={{ backgroundColor: PANEL, border: `1px solid ${BORDER}` }}
          >
            <p
              className="mb-2 text-[10px] font-bold uppercase tracking-wider"
              style={{ color: MUTED }}
            >
              Bill To
            </p>
            <p className="font-semibold text-slate-900">{data.billTo.name}</p>
            {data.billTo.addressLines?.map((line) => (
              <p key={line} className="mt-1 text-sm" style={{ color: MUTED }}>
                {line}
              </p>
            ))}
          </div>
          <div
            className="rounded-lg p-4"
            style={{ backgroundColor: PANEL, border: `1px solid ${BORDER}` }}
          >
            <p
              className="mb-2 text-[10px] font-bold uppercase tracking-wider"
              style={{ color: MUTED }}
            >
              From
            </p>
            <p className="font-semibold text-slate-900">{data.from.name}</p>
            {data.from.addressLines?.map((line) => (
              <p key={line} className="mt-1 text-sm" style={{ color: MUTED }}>
                {line}
              </p>
            ))}
          </div>
        </section>

        <Divider />

        {/* Line items */}
        <section>
          <p className="mb-1 text-xs italic" style={{ color: MUTED }}>
            Prices exclude VAT.
          </p>
          <div className="overflow-hidden rounded-lg border" style={{ borderColor: BORDER }}>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr style={{ backgroundColor: NAVY, color: "#fff" }}>
                  <th className="px-4 py-2.5 text-left font-semibold">Description</th>
                  <th className="px-3 py-2.5 text-right font-semibold w-16">Qty</th>
                  <th className="px-3 py-2.5 text-right font-semibold w-28">Unit price</th>
                  <th className="px-4 py-2.5 text-right font-semibold w-28">Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.lineItems.map((row, idx) => (
                  <tr
                    key={`${row.description}-${idx}`}
                    className="border-t"
                    style={{
                      borderColor: BORDER,
                      backgroundColor: idx % 2 === 1 ? PANEL : "#fff",
                    }}
                  >
                    <td className="px-4 py-2.5 font-medium text-slate-800">
                      {row.description}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{row.qty}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {formatMoney(row.unitPrice)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium tabular-nums">
                      {formatMoney(row.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Totals */}
        <div className="mt-6 flex justify-end">
          <div
            className="w-full max-w-xs rounded-lg p-4"
            style={{ backgroundColor: PANEL, border: `1px solid ${BORDER}` }}
          >
            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <span style={{ color: MUTED }}>Net amount (ex. VAT)</span>
                <span className="tabular-nums font-medium">
                  {formatMoney(data.totals.netExVat)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span style={{ color: MUTED }}>{data.totals.vatLabel}</span>
                <span className="tabular-nums font-medium">
                  {formatMoney(data.totals.vatAmount)}
                </span>
              </div>
              <hr className="border-slate-200" />
              <div className="flex justify-between gap-4 text-base">
                <span className="font-bold" style={{ color: NAVY }}>
                  Total (inc. VAT)
                </span>
                <span className="font-bold tabular-nums" style={{ color: NAVY }}>
                  {formatMoney(data.totals.totalIncVat)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Account summary */}
        {data.accountSummary && (
          <>
            <Divider />
            <section
              className="rounded-lg p-5"
              style={{ backgroundColor: PANEL, border: `1px solid ${BORDER}` }}
            >
              <p
                className="mb-4 text-[10px] font-bold uppercase tracking-wider"
                style={{ color: MUTED }}
              >
                Account summary
              </p>
              <div className="space-y-2 text-sm">
                <Row
                  label="Previous balance"
                  value={formatMoney(data.accountSummary.previousBalance)}
                />
                <Row
                  label="This invoice + previous balance"
                  value={formatMoney(data.accountSummary.invoicePlusPrevious)}
                />
                {data.accountSummary.paymentsReceived > 0 && (
                  <Row
                    label="Payments received"
                    value={`-${formatMoney(data.accountSummary.paymentsReceived)}`}
                    muted
                  />
                )}
                <hr className="border-slate-300" />
                <div className="flex justify-between gap-4 pt-1">
                  <span className="text-base font-bold" style={{ color: NAVY }}>
                    Balance due
                  </span>
                  <span
                    className="text-lg font-extrabold tabular-nums"
                    style={{ color: NAVY }}
                  >
                    {formatMoney(data.accountSummary.balanceDue)}
                  </span>
                </div>
              </div>
            </section>
          </>
        )}

        {data.payments.length > 0 && (
          <>
            <Divider />
            <section
              className="rounded-lg border-l-4 px-4 py-3"
              style={{
                borderLeftColor: GREEN,
                backgroundColor: GREEN_BG,
              }}
            >
              <p
                className="mb-2 text-[10px] font-bold uppercase tracking-wider"
                style={{ color: GREEN }}
              >
                Payments received
              </p>
              <ul className="space-y-1 text-sm font-medium" style={{ color: "#065f46" }}>
                {data.payments.map((p) => (
                  <li key={p.method} className="tabular-nums">
                    {p.method} — {formatMoney(p.amount)}
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}

        {/* Terms */}
        {data.terms.trim() && (
          <>
            <Divider />
            <section>
              <p
                className="mb-2 text-[10px] font-bold uppercase tracking-wider"
                style={{ color: MUTED }}
              >
                Terms &amp; conditions
              </p>
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">
                {data.terms}
              </p>
            </section>
          </>
        )}

        <footer
          className="mt-8 border-t pt-4 text-center text-[10px]"
          style={{ borderColor: BORDER, color: MUTED }}
        >
          {data.company.name}
          {data.company.companyNumber && ` · Company no. ${data.company.companyNumber}`}
          {data.company.vatNumber && ` · VAT no. ${data.company.vatNumber}`}
        </footer>
      </div>
    </article>
  );
}

function Row({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <span style={{ color: muted ? "#94a3b8" : MUTED }}>{label}</span>
      <span className={`tabular-nums font-medium ${muted ? "text-slate-600" : ""}`}>
        {value}
      </span>
    </div>
  );
}

export interface BusinessInvoicePreviewShellProps {
  data?: BusinessInvoiceDocumentData;
}

/** Invoice + print controls (for preview routes). */
export function BusinessInvoicePreviewShell({ data }: BusinessInvoicePreviewShellProps) {
  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
  };

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `@media print {
            body * { visibility: hidden; }
            #business-invoice-print-root,
            #business-invoice-print-root * { visibility: visible; }
            #business-invoice-print-root {
              position: absolute; left: 0; top: 0; width: 100%;
            }
            @page { size: A4; margin: 12mm; }
          }`,
        }}
      />
      <div className="min-h-screen bg-slate-100 py-8 print:bg-white print:py-0">
        <div className="mx-auto mb-6 flex max-w-[794px] justify-end gap-3 px-4 print:hidden">
          <button
            type="button"
            onClick={handlePrint}
            className="rounded-lg bg-[#1a2340] px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-[#243052]"
          >
            Print / Download PDF
          </button>
        </div>
        <div id="business-invoice-print-root" className="px-4 print:px-0">
          <BusinessInvoiceDocument data={data} />
        </div>
      </div>
    </>
  );
}

export default BusinessInvoiceDocument;
