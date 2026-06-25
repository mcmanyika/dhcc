"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardViewToggleProps {
  className?: string;
  variant?: "sidebar" | "hero" | "header";
}

export function DashboardViewToggle({
  className,
  variant = "sidebar",
}: DashboardViewToggleProps) {
  const pathname = usePathname();
  const isAdminView = pathname.startsWith("/admin");
  const isMemberView = pathname === "/dashboard";

  const baseLink =
    variant === "hero"
      ? "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors"
      : "flex items-center justify-center gap-1.5 rounded px-2 py-1.5 text-xs font-medium transition-colors whitespace-nowrap";

  const activeAdmin =
    variant === "hero"
      ? "bg-white/20 text-white ring-1 ring-white/30"
      : "bg-teal-700 text-white shadow-sm";

  const inactiveAdmin =
    variant === "hero"
      ? "text-white/80 hover:bg-white/10 hover:text-white"
      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100";

  const activeMember =
    variant === "hero"
      ? "bg-white/20 text-white ring-1 ring-white/30"
      : "bg-teal-700 text-white shadow-sm";

  const inactiveMember = inactiveAdmin;

  const containerClass =
    variant === "hero"
      ? "inline-flex rounded-lg bg-black/10 p-0.5 ring-1 ring-white/20 backdrop-blur-sm"
      : variant === "header"
        ? "inline-flex rounded-md border border-gray-200 bg-gray-50 p-0.5 dark:border-slate-700 dark:bg-slate-800/50"
        : "flex rounded-md border border-gray-200 bg-gray-50 p-0.5 dark:border-slate-700 dark:bg-slate-800/50";

  return (
    <div className={cn(containerClass, className)}>
      <Link
        href="/admin"
        className={cn(baseLink, isAdminView ? activeAdmin : inactiveAdmin)}
        aria-current={isAdminView ? "page" : undefined}
      >
        <LayoutDashboard className="h-4 w-4 shrink-0" />
        <span className="truncate">Admin</span>
      </Link>
      <Link
        href="/dashboard"
        className={cn(baseLink, isMemberView ? activeMember : inactiveMember)}
        aria-current={isMemberView ? "page" : undefined}
      >
        <User className="h-4 w-4 shrink-0" />
        <span className="truncate">My Dashboard</span>
      </Link>
    </div>
  );
}
