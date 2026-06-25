"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Leaf } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useAuth } from "@/components/providers/AuthProvider";
import { hasMemberDashboardAccess } from "@/lib/member-access";
import { useEffect, useState } from "react";
import type { Member } from "@/types";

const publicLinks = [{ href: "/events", label: "Events" }];

export function Header() {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");
  const isLanding = pathname === "/";
  const { user, loading, fetchMemberProfile } = useAuth();
  const [member, setMember] = useState<Member | null>(null);

  useEffect(() => {
    if (user) {
      fetchMemberProfile().then(setMember);
    } else {
      setMember(null);
    }
  }, [user, fetchMemberProfile]);

  if (isAdminRoute || isLanding) return null;

  const hasDashboard =
    member && hasMemberDashboardAccess(member.status);
  const isUserAdmin = member?.isAdmin === true;

  const logoHref = user ? "/dashboard" : "/";

  return (
    <header className="border-b border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href={logoHref} className="flex items-center gap-2">
          <div className="rounded-lg bg-teal-700 p-2">
            <Leaf className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold text-gray-900 dark:text-slate-100">DHCC</span>
            <span className="hidden text-sm text-gray-500 dark:text-slate-400 sm:inline">
              {" "}
              · Dallas Holistic Chamber
            </span>
          </div>
        </Link>
        <nav className="flex items-center gap-4 sm:gap-6">
          <ThemeToggle />
          {publicLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-teal-700 dark:hover:text-teal-400",
                pathname === link.href
                  ? "text-teal-700 dark:text-teal-400"
                  : "text-gray-600 dark:text-slate-300"
              )}
            >
              {link.label}
            </Link>
          ))}
          {!loading && (
            <>
              {hasDashboard ? (
                <Link
                  href="/dashboard"
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-teal-700 dark:hover:text-teal-400",
                    pathname === "/dashboard"
                      ? "text-teal-700 dark:text-teal-400"
                      : "text-gray-600 dark:text-slate-300"
                  )}
                >
                  Dashboard
                </Link>
              ) : user ? (
                <Link
                  href="/apply"
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-teal-700 dark:hover:text-teal-400",
                    pathname === "/apply"
                      ? "text-teal-700 dark:text-teal-400"
                      : "text-gray-600 dark:text-slate-300"
                  )}
                >
                  Membership
                </Link>
              ) : (
                <>
                  <Link
                    href="/"
                    className="text-sm font-medium text-gray-600 transition-colors hover:text-teal-700 dark:text-slate-300 dark:hover:text-teal-400"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-lg bg-teal-700 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-teal-800"
                  >
                    Join
                  </Link>
                </>
              )}
              {isUserAdmin && (
                <Link
                  href="/admin"
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-teal-700 dark:hover:text-teal-400",
                    pathname.startsWith("/admin")
                      ? "text-teal-700 dark:text-teal-400"
                      : "text-gray-600 dark:text-slate-300"
                  )}
                >
                  Admin
                </Link>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
