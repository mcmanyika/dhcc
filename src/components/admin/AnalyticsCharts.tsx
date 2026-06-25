import { cn } from "@/lib/utils";
import type { ChartDataPoint } from "@/types";

const DOUGHNUT_COLORS = [
  "#0d9488",
  "#14b8a6",
  "#2dd4bf",
  "#0f766e",
  "#115e59",
  "#5eead4",
];

interface HorizontalBarChartProps {
  data: ChartDataPoint[];
  formatValue?: (value: number) => string;
  emptyMessage?: string;
  className?: string;
}

export function HorizontalBarChart({
  data,
  formatValue = (v) => String(v),
  emptyMessage = "No data to display.",
  className,
}: HorizontalBarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const hasData = data.some((d) => d.value > 0);

  if (!hasData) {
    return (
      <p className={cn("py-4 text-center text-sm text-gray-500 dark:text-slate-400", className)}>
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {data.map((item) => (
        <div key={item.label}>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-gray-600 dark:text-slate-400">{item.label}</span>
            <span className="font-medium text-gray-900 dark:text-slate-100">
              {formatValue(item.value)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-slate-700">
            <div
              className="h-full rounded-full bg-teal-600 transition-all dark:bg-teal-500"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

interface DoughnutChartProps {
  data: ChartDataPoint[];
  formatValue?: (value: number) => string;
  emptyMessage?: string;
  className?: string;
}

export function DoughnutChart({
  data,
  formatValue = (v) => String(v),
  emptyMessage = "No data to display.",
  className,
}: DoughnutChartProps) {
  const segments = data.filter((d) => d.value > 0);
  const total = segments.reduce((sum, d) => sum + d.value, 0);

  if (total <= 0) {
    return (
      <p className={cn("py-4 text-center text-sm text-gray-500 dark:text-slate-400", className)}>
        {emptyMessage}
      </p>
    );
  }

  const size = 148;
  const strokeWidth = 26;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let cumulative = 0;

  return (
    <div
      className={cn(
        "flex h-full flex-col items-center justify-center gap-4 sm:flex-row sm:items-center sm:justify-center sm:gap-6",
        className
      )}
    >
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
          aria-hidden
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            className="stroke-gray-100 dark:stroke-slate-700"
            strokeWidth={strokeWidth}
          />
          {segments.map((item, index) => {
            const length = (item.value / total) * circumference;
            const offset = cumulative;
            cumulative += length;
            return (
              <circle
                key={item.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={DOUGHNUT_COLORS[index % DOUGHNUT_COLORS.length]}
                strokeWidth={strokeWidth}
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={-offset}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-base font-semibold text-gray-900 dark:text-slate-100">
            {formatValue(total)}
          </span>
          <span className="text-xs text-gray-500 dark:text-slate-400">Total</span>
        </div>
      </div>

      <ul className="w-full space-y-2 sm:w-auto">
        {segments.map((item, index) => {
          const pct = Math.round((item.value / total) * 100);
          return (
            <li key={item.label} className="flex items-center gap-2 text-sm">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: DOUGHNUT_COLORS[index % DOUGHNUT_COLORS.length] }}
              />
              <span className="text-gray-600 dark:text-slate-400">{item.label}</span>
              <span className="ml-auto font-medium text-gray-900 dark:text-slate-100 sm:ml-2">
                {formatValue(item.value)}
              </span>
              <span className="w-9 text-right text-xs text-gray-500 dark:text-slate-400">
                {pct}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
