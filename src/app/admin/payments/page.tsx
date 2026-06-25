"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, DollarSign, Search } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Input } from "@/components/ui/Input";
import { StatsCard } from "@/components/ui/StatsCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { AdminPaymentRecord } from "@/types";

const PAGE_SIZE = 10;

type SortKey = "date" | "member" | "business" | "amount" | "type" | "status";
type SortDir = "asc" | "desc";

function formatPaymentType(type: string) {
  if (type === "subscription") return "Subscription";
  if (type === "payment") return "One-time";
  return type.replace(/_/g, " ");
}

function sortPayments(
  items: AdminPaymentRecord[],
  key: SortKey,
  dir: SortDir
): AdminPaymentRecord[] {
  const sorted = [...items].sort((a, b) => {
    let cmp = 0;

    switch (key) {
      case "date":
        cmp =
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case "member":
        cmp = (a.memberName ?? "").localeCompare(b.memberName ?? "");
        break;
      case "business":
        cmp = (a.businessName ?? "").localeCompare(b.businessName ?? "");
        break;
      case "amount":
        cmp = a.amount - b.amount;
        break;
      case "type":
        cmp = a.paymentType.localeCompare(b.paymentType);
        break;
      case "status":
        cmp = a.status.localeCompare(b.status);
        break;
    }

    return dir === "asc" ? cmp : -cmp;
  });

  return sorted;
}

function SortableHeader({
  label,
  sortKey,
  activeKey,
  dir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  dir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const active = activeKey === sortKey;
  const Icon = active ? (dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;

  return (
    <TableHeader>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "inline-flex items-center gap-1 transition-colors hover:text-teal-700 dark:hover:text-teal-400",
          active && "text-teal-700 dark:text-teal-400"
        )}
      >
        {label}
        <Icon className="h-3.5 w-3.5" />
      </button>
    </TableHeader>
  );
}

export default function AdminPaymentsPage() {
  const { getIdToken } = useAuth();
  const [payments, setPayments] = useState<AdminPaymentRecord[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "date" || key === "amount" ? "desc" : "asc");
    }
    setPage(1);
  };

  const fetchPayments = useCallback(async () => {
    const token = await getIdToken();
    if (!token) return;

    const res = await fetch("/api/admin/payments", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      const data = await res.json();
      setPayments(data.payments);
      setTotalRevenue(data.totalRevenue);
    }
    setLoading(false);
  }, [getIdToken]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return payments;

    return payments.filter(
      (p) =>
        p.memberName?.toLowerCase().includes(q) ||
        p.memberEmail?.toLowerCase().includes(q) ||
        p.businessName?.toLowerCase().includes(q) ||
        p.stripeSessionId.toLowerCase().includes(q)
    );
  }, [payments, search]);

  const sorted = useMemo(
    () => sortPayments(filtered, sortKey, sortDir),
    [filtered, sortKey, sortDir]
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">
          Payments
        </h1>
        <p className="mt-1 text-gray-500 dark:text-slate-400">
          All membership payments processed through Stripe.
        </p>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
          icon={DollarSign}
        />
        <StatsCard
          title="Total Payments"
          value={payments.length}
          icon={DollarSign}
          description="Unique Stripe sessions"
        />
        <StatsCard
          title="This Page"
          value={filtered.length}
          icon={Search}
          description={search ? "matching search" : "all payments"}
        />
      </div>

      <div className="mb-4 max-w-md">
        <Input
          id="payment-search"
          placeholder="Search by member, email, or business..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-700 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-8 text-center text-gray-500 dark:text-slate-400">
          No payments found.
        </p>
      ) : (
        <>
          <Table>
            <TableHead>
              <TableRow>
                <SortableHeader
                  label="Date"
                  sortKey="date"
                  activeKey={sortKey}
                  dir={sortDir}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Member"
                  sortKey="member"
                  activeKey={sortKey}
                  dir={sortDir}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Business"
                  sortKey="business"
                  activeKey={sortKey}
                  dir={sortDir}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Amount"
                  sortKey="amount"
                  activeKey={sortKey}
                  dir={sortDir}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Type"
                  sortKey="type"
                  activeKey={sortKey}
                  dir={sortDir}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Status"
                  sortKey="status"
                  activeKey={sortKey}
                  dir={sortDir}
                  onSort={handleSort}
                />
              </TableRow>
            </TableHead>
            <TableBody>
              {paginated.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{formatDate(payment.createdAt)}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {payment.memberName || "—"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        {payment.memberEmail || payment.memberId}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{payment.businessName || "—"}</TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(payment.amount / 100)}
                  </TableCell>
                  <TableCell className="capitalize">
                    {formatPaymentType(payment.paymentType)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={payment.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-gray-500 dark:text-slate-400">
              <span>
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 disabled:opacity-40 dark:border-slate-600"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 disabled:opacity-40 dark:border-slate-600"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
