import type { Metadata } from "next";
import { ChartOfAccountsSettings } from "./client";

export const metadata: Metadata = { title: "Chart of Accounts" };

export default function ChartOfAccountsPage() {
  return <ChartOfAccountsSettings />;
}
