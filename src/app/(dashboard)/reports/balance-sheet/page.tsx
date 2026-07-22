import type { Metadata } from "next";
import { BalanceSheetReport } from "./client";

export const metadata: Metadata = { title: "Balance Sheet" };

export default function BalanceSheetPage() {
  return <BalanceSheetReport />;
}
