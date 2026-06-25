import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

export function Table({ className, children, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-700">
      <table
        className={cn("min-w-full divide-y divide-gray-200 text-sm dark:divide-slate-700", className)}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

export function TableHead({ children }: { children: React.ReactNode }) {
  return <thead className="bg-gray-50 dark:bg-slate-800">{children}</thead>;
}

export function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-gray-200 bg-white dark:divide-slate-700 dark:bg-slate-900">{children}</tbody>;
}

export function TableRow({ className, children, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={cn("hover:bg-gray-50 dark:hover:bg-slate-800", className)} {...props}>
      {children}
    </tr>
  );
}

export function TableHeader({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400",
        className
      )}
      {...props}
    >
      {children}
    </th>
  );
}

export function TableCell({
  className,
  children,
  colSpan,
  ...props
}: HTMLAttributes<HTMLTableCellElement> & { colSpan?: number }) {
  return (
    <td
      colSpan={colSpan}
      className={cn("px-3 py-2 text-gray-700 dark:text-slate-300", className)}
      {...props}
    >
      {children}
    </td>
  );
}
