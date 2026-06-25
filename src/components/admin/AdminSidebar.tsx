"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Calendar,
  CreditCard,
  Leaf,
  LogOut,
  MessageSquare,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/Button";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/members", label: "Members", icon: Users },
  { href: "/admin/events", label: "Events", icon: Calendar },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/feedback", label: "Feedback", icon: MessageSquare },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3 dark:border-slate-700">
        <div className="rounded-md bg-gray-100 p-1.5 dark:bg-slate-800">
          <Leaf className="h-4 w-4 text-gray-600 dark:text-slate-400" />
        </div>
        <div>
          <p className="font-bold text-gray-900 dark:text-slate-100">DHCC Admin</p>
          <p className="text-xs text-gray-500 dark:text-slate-400">Management Portal</p>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 p-3">
        {navItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-gray-100 text-gray-900 dark:bg-slate-800 dark:text-slate-100"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-gray-200 p-3 dark:border-slate-700">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => logout()}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
