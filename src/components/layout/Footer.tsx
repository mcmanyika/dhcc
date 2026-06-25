"use client";

import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();
  if (pathname === "/" || pathname.startsWith("/admin")) return null;

  return (
    <footer className="mt-auto border-t border-gray-200 bg-gray-50 dark:border-slate-700 dark:bg-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-5">
        <p className="text-center text-sm text-gray-500 dark:text-slate-400 sm:text-left">
          © {new Date().getFullYear()} Dallas Holistic Chamber of Commerce. All
          rights reserved.
        </p>
      </div>
    </footer>
  );
}
