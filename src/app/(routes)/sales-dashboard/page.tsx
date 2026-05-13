import { redirect } from "next/navigation";

/** Redirect legacy /sales-dashboard to /create-sales. Page removed in favor of Create Bulk Sales. */
export default function SalesDashboardRedirect() {
 redirect("/create-sales");
}
