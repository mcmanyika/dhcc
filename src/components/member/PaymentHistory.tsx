"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { PaymentRecord } from "@/types";

const PAGE_SIZE = 2;

interface PaymentHistoryProps {
  payments: PaymentRecord[];
  loading?: boolean;
}

function formatPaymentType(type: string) {
  if (type === "subscription") return "Subscription";
  if (type === "payment") return "One-time";
  if (type === "event") return "Event";
  return type.replace(/_/g, " ");
}

export function PaymentHistory({ payments, loading }: PaymentHistoryProps) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(payments.length / PAGE_SIZE));

  const paginatedPayments = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return payments.slice(start, start + PAGE_SIZE);
  }, [payments, page]);

  useEffect(() => {
    setPage(1);
  }, [payments.length]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-teal-700 border-t-transparent" />
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-slate-400">
        No payments recorded yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {paginatedPayments.map((payment) => (
          <div
            key={payment.id}
            className="flex flex-col gap-2 rounded-lg border border-gray-100 bg-gray-50/50 p-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-900/40"
          >
            <div>
              <p className="font-medium text-gray-900 dark:text-slate-100">
                {formatCurrency(payment.amount / 100)}
              </p>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                {formatPaymentType(payment.paymentType)} ·{" "}
                {formatDate(payment.createdAt)}
              </p>
            </div>
            <span className="inline-flex w-fit rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium capitalize text-green-800 dark:bg-green-950/50 dark:text-green-300">
              {payment.status}
            </span>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-100 pt-4 dark:border-slate-700">
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
