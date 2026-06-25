import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  className?: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  className,
}: StatsCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-slate-100">{value}</p>
          {description && (
            <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">{description}</p>
          )}
        </div>
        <div className="rounded-lg bg-teal-50 p-3 dark:bg-teal-950/50">
          <Icon className="h-6 w-6 text-teal-700" />
        </div>
      </div>
    </div>
  );
}
