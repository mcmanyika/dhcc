"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  Clock,
  DollarSign,
  Star,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";
import { StatsCard } from "@/components/ui/StatsCard";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  DoughnutChart,
  HorizontalBarChart,
} from "@/components/admin/AnalyticsCharts";
import { useAuth } from "@/components/providers/AuthProvider";
import { formatCurrency } from "@/lib/utils";
import type { AnalyticsSummary } from "@/types";

export default function AdminDashboardPage() {
  const { user, getIdToken } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;

    async function load() {
      try {
        const token = await getIdToken();
        if (!token) {
          setError("Not signed in");
          return;
        }

        const res = await fetch("/api/admin/analytics", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error ?? `Failed to load analytics (${res.status})`);
          return;
        }

        setAnalytics(await res.json());
      } catch {
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user, getIdToken]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-700 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">Dashboard</h1>
      <p className="mt-1 text-gray-500">
        Overview of membership, events, and revenue.
      </p>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Members"
          value={analytics?.totalMembers ?? 0}
          icon={Users}
        />
        <StatsCard
          title="Pending Applications"
          value={analytics?.pendingApplications ?? 0}
          icon={Clock}
        />
        <StatsCard
          title="Active Members"
          value={analytics?.activeMembers ?? 0}
          icon={UserCheck}
        />
        <StatsCard
          title="Expired Members"
          value={analytics?.expiredMembers ?? 0}
          icon={UserX}
        />
        <StatsCard
          title="Total Events"
          value={analytics?.totalEvents ?? 0}
          icon={Calendar}
        />
        <StatsCard
          title="Event Registrations"
          value={analytics?.eventRegistrations ?? 0}
          icon={Users}
        />
        <StatsCard
          title="Avg. Feedback Rating"
          value={analytics?.averageFeedbackRating ?? 0}
          icon={Star}
          description="Out of 5"
        />
        <StatsCard
          title="Stripe Revenue"
          value={formatCurrency(analytics?.stripeRevenue ?? 0)}
          icon={DollarSign}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="flex h-full flex-col">
          <CardHeader>
            <CardTitle>Members by Status</CardTitle>
          </CardHeader>
          <HorizontalBarChart
            className="flex flex-1 flex-col justify-center"
            data={analytics?.membersByStatus ?? []}
          />
        </Card>

        <Card className="flex h-full flex-col">
          <CardHeader>
            <CardTitle>Revenue by Category</CardTitle>
          </CardHeader>
          <DoughnutChart
            className="flex-1"
            data={analytics?.revenueByCategory ?? []}
            formatValue={(v) => formatCurrency(v)}
            emptyMessage="No revenue recorded yet."
          />
        </Card>
      </div>
    </div>
  );
}
