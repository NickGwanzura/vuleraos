import type { Metadata } from "next";
import { ReportsWorkspace } from "./client";

export const metadata: Metadata = { title: "Reports" };

export default function ReportsPage() {
  return <ReportsWorkspace />;
}
