"use client";

import { DashboardViewToggle } from "@/components/admin/DashboardViewToggle";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function AdminTopBar() {
  return (
    <div className="flex shrink-0 items-center justify-end gap-2 border-b border-gray-200 bg-white px-4 py-2 dark:border-slate-700 dark:bg-slate-900">
      <ThemeToggle />
      <DashboardViewToggle variant="header" />
    </div>
  );
}
