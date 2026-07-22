import type { Metadata } from "next";
import { TrialBalanceReport } from "./client";

export const metadata: Metadata = { title: "Trial Balance" };

export default function TrialBalancePage() {
  return <TrialBalanceReport />;
}
