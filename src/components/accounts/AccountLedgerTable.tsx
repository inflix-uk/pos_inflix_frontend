"use client";

import React from "react";
import type { StatementLine } from "@/app/(routes)/accounts/service/accountsApi";
import {
 describeStatementLine,
 formatStatementBalance,
 type StatementAccountType,
} from "@/lib/accountStatementExport";

interface AccountLedgerTableProps {
 accountType: StatementAccountType;
 openingBalance: number;
 closingBalance: number;
 totals: { debit: number; credit: number };
 lines: StatementLine[];
 formatDate: (d: string) => string;
 formatMoney: (n: number) => string;
 /** When set, adds an Actions column rendered per line. */
 renderActions?: (line: StatementLine) => React.ReactNode;
 /** Tighter cell padding for side panels. */
 compact?: boolean;
}

/**
 * Ledger in Date / Description / Debit / Credit / Balance form, newest first, with opening and total rows.
 * `lines` arrive oldest first (the order the running balance is built in), so they are reversed for display
 * and the opening balance sits at the bottom, just before the oldest line.
 */
export function AccountLedgerTable({
 accountType,
 openingBalance,
 closingBalance,
 totals,
 lines,
 formatDate,
 formatMoney,
 renderActions,
 compact = false,
}: AccountLedgerTableProps) {
 const cell = compact ? "py-2 px-3" : "py-3 px-4";
 const num = `${cell} text-right tabular-nums whitespace-nowrap`;
 const showActions = !!renderActions;
 const newestFirst = [...lines].reverse();
 // The column that holds money received from / paid to the account.
 const paymentColumn = accountType === "Customer" ? "credit" : "debit";
 const balanceCell = (n: number) => (
  <span className={n < -0.004 ? "text-blue-700" : "text-gray-900"}>
   {formatStatementBalance(n, accountType, formatMoney)}
  </span>
 );
 const amountCell = (n: number, column: "debit" | "credit") =>
  n > 0.004 ? (
   <span className={column === paymentColumn ? "text-emerald-700" : "text-gray-900"}>{formatMoney(n)}</span>
  ) : null;

 return (
  <table className="w-full text-sm">
   <thead>
    <tr className="border-b border-gray-200 bg-gray-50">
     <th className={`${cell} text-left font-medium text-gray-700 whitespace-nowrap`}>Date</th>
     <th className={`${cell} text-left font-medium text-gray-700`}>Description</th>
     <th className={`${cell} text-left font-medium text-gray-700 min-w-[8rem]`}>Notes</th>
     <th className={`${cell} text-right font-medium text-gray-700`}>Debit</th>
     <th className={`${cell} text-right font-medium text-gray-700`}>Credit</th>
     <th className={`${cell} text-right font-medium text-gray-700`}>Balance</th>
     {showActions && <th className={`${cell} text-right font-medium text-gray-700 w-24`}>Actions</th>}
    </tr>
   </thead>
   <tbody>
    {newestFirst.length === 0 ? (
     <tr>
      <td colSpan={showActions ? 7 : 6} className="py-8 text-center text-gray-500">
       No entries in this period.
      </td>
     </tr>
    ) : (
     newestFirst.map((line) => (
      <tr key={line._id} className="border-b border-gray-100">
       <td className={`${cell} text-gray-600 whitespace-nowrap`}>{formatDate(line.date)}</td>
       <td className={`${cell} text-gray-900`}>{describeStatementLine(line)}</td>
       <td className={`${cell} text-gray-600 max-w-xs`}>
        {line.note?.trim() ? (
         <span className="whitespace-pre-wrap break-words" title={line.note.trim()}>
          {line.note.trim()}
         </span>
        ) : (
         <span className="text-gray-400">—</span>
        )}
       </td>
       <td className={num}>{amountCell(line.debit, "debit")}</td>
       <td className={num}>{amountCell(line.credit, "credit")}</td>
       <td className={`${num} font-medium`}>{balanceCell(line.balance)}</td>
       {showActions && <td className={`${cell} text-right`}>{renderActions(line)}</td>}
      </tr>
     ))
    )}
    <tr className="border-b border-gray-100 bg-gray-50/60">
     <td className={cell} />
     <td className={`${cell} font-medium text-gray-700`}>Opening balance</td>
     <td className={cell} />
     <td className={num} />
     <td className={num} />
     <td className={`${num} font-medium`}>{balanceCell(openingBalance)}</td>
     {showActions && <td className={cell} />}
    </tr>
   </tbody>
   <tfoot>
    <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
     <td className={cell} />
     <td className={`${cell} text-gray-900`}>Total</td>
     <td className={cell} />
     <td className={num}>{formatMoney(totals.debit)}</td>
     <td className={num}>{formatMoney(totals.credit)}</td>
     <td className={num}>{balanceCell(closingBalance)}</td>
     {showActions && <td className={cell} />}
    </tr>
   </tfoot>
  </table>
 );
}
