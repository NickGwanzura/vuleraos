"use client";

import dynamic from "next/dynamic";
import { Users } from "lucide-react";

const WorkspacePlaceholder = dynamic(
  () =>
    import("@/components/layout/workspace-placeholder").then(
      (m) => m.WorkspacePlaceholder
    ),
  { ssr: false }
);

export function HrWorkspace() {
  return (
    <WorkspacePlaceholder
      title="Human Resources"
      description="Manage employees, attendance, leaves, and payroll"
      icon={<Users className="h-full w-full" />}
      moduleKey="hr"
    />
  );
}
