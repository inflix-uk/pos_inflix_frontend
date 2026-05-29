"use client";

import { use } from "react";
import { InvoiceFlowPage } from "../../create-invoice/InvoiceFlowPage";

export default function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
 const { id } = use(params);
 return <InvoiceFlowPage editInvoiceId={id} />;
}
