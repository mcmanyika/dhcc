import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-blue-100 text-blue-800",
  rejected: "bg-red-100 text-red-800",
  active: "bg-green-100 text-green-800",
  expired: "bg-gray-100 text-gray-800",
  registered: "bg-blue-100 text-blue-800",
  attended: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  unpaid: "bg-gray-100 text-gray-800",
  paid: "bg-green-100 text-green-800",
  subscription_active: "bg-teal-100 text-teal-800",
  subscription_cancelled: "bg-orange-100 text-orange-800",
  failed: "bg-red-100 text-red-800",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const label = status.replace(/_/g, " ");
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        statusStyles[status] ?? "bg-gray-100 text-gray-800",
        className
      )}
    >
      {label}
    </span>
  );
}
