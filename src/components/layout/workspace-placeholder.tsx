"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface WorkspacePlaceholderProps {
  title: string;
  description: string;
  icon: ReactNode;
  moduleKey: string;
}

const moduleGradients: Record<string, string> = {
  sales: "from-emerald-500/10 to-emerald-500/5",
  buying: "from-violet-500/10 to-violet-500/5",
  stock: "from-amber-500/10 to-amber-500/5",
  accounting: "from-sky-500/10 to-sky-500/5",
  hr: "from-rose-500/10 to-rose-500/5",
  reports: "from-indigo-500/10 to-indigo-500/5",
  settings: "from-slate-500/10 to-slate-500/5",
};

const moduleIconColors: Record<string, string> = {
  sales: "text-emerald-600 dark:text-emerald-400",
  buying: "text-violet-600 dark:text-violet-400",
  stock: "text-amber-600 dark:text-amber-400",
  accounting: "text-sky-600 dark:text-sky-400",
  hr: "text-rose-600 dark:text-rose-400",
  reports: "text-indigo-600 dark:text-indigo-400",
  settings: "text-slate-600 dark:text-slate-400",
};

const metrics: { label: string; icon: string }[] = [
  { label: "Total", icon: "hash" },
  { label: "Pending", icon: "clock" },
  { label: "Completed", icon: "check" },
  { label: "Drafts", icon: "file" },
];

const quickActions: string[] = [
  "Create New",
  "View All",
  "Generate Report",
  "Settings",
];

export function WorkspacePlaceholder({
  title,
  description,
  icon,
  moduleKey,
}: WorkspacePlaceholderProps) {
  const gradient =
    moduleGradients[moduleKey] ?? "from-gray-500/10 to-gray-500/5";
  const iconColor =
    moduleIconColors[moduleKey] ?? "text-gray-600 dark:text-gray-400";

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ring-1 ring-foreground/10",
              gradient
            )}
          >
            <div className={cn("h-5 w-5", iconColor)}>{icon}</div>
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-md bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground ring-1 ring-foreground/5">
            Coming Soon
          </span>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label} size="sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
              <button
                key={action}
                className={cn(
                  "flex items-center justify-center rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground transition-colors",
                  "hover:border-solid hover:border-foreground/20 hover:text-foreground",
                  "cursor-not-allowed opacity-60"
                )}
                disabled
              >
                {action}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Recent Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div
              className={cn(
                "mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ring-1 ring-foreground/10",
                gradient
              )}
            >
              <div className={cn("h-5 w-5", iconColor)}>{icon}</div>
            </div>
            <p className="text-sm font-medium text-foreground">
              No documents yet
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              This module is under development. Documents will appear here once
              the module is implemented.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
