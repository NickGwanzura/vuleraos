"use client";

import dynamic from "next/dynamic";
import { BarChart3 } from "lucide-react";

const WorkspacePlaceholder = dynamic(
  () =>
    import("@/components/layout/workspace-placeholder").then(
      (m) => m.WorkspacePlaceholder
    ),
  { ssr: false }
);

export function ReportsWorkspace() {
  return (
    <WorkspacePlaceholder
      title="Reports"
      description="View and generate business reports and analytics"
      icon={<BarChart3 className="h-full w-full" />}
      moduleKey="reports"
    />
  );
}
