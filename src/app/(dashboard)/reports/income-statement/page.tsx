import type { Metadata } from "next";
import { IncomeStatementReport } from "./client";

export const metadata: Metadata = { title: "Income Statement" };

export default function IncomeStatementPage() {
  return <IncomeStatementReport />;
}
