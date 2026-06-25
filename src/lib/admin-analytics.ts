import type { ChartDataPoint } from "@/types";
import { MEMBER_STATUSES } from "@/types";

type MemberRecord = { status?: string };
type PaymentRecord = {
  amount?: number;
  paymentType?: string;
  stripeSessionId?: string;
};

export function buildMembersByStatusChart(
  members: MemberRecord[]
): ChartDataPoint[] {
  return MEMBER_STATUSES.map((status) => ({
    label: status.charAt(0).toUpperCase() + status.slice(1),
    value: members.filter((m) => m.status === status).length,
  }));
}

function formatPaymentCategory(type: string): string {
  if (type === "subscription") return "Subscription";
  if (type === "payment") return "One-time";
  if (type === "event") return "Event";
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function buildRevenueByCategoryChart(
  payments: PaymentRecord[]
): ChartDataPoint[] {
  const seenSessions = new Set<string>();
  const totals = new Map<string, number>();

  for (const payment of payments) {
    const sessionId = payment.stripeSessionId;
    if (sessionId) {
      if (seenSessions.has(sessionId)) continue;
      seenSessions.add(sessionId);
    }

    const type = payment.paymentType ?? "other";
    totals.set(type, (totals.get(type) ?? 0) + (payment.amount ?? 0) / 100);
  }

  return Array.from(totals.entries())
    .map(([type, value]) => ({
      label: formatPaymentCategory(type),
      value: Math.round(value * 100) / 100,
    }))
    .sort((a, b) => b.value - a.value);
}
