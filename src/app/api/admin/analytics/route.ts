import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyAdminToken } from "@/lib/admin-auth";
import {
  buildMembersByStatusChart,
  buildRevenueByCategoryChart,
} from "@/lib/admin-analytics";
import type { AnalyticsSummary } from "@/types";

export async function GET(request: NextRequest) {
  const admin = await verifyAdminToken(
    request.headers.get("authorization")
  );
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = await getAdminDb();

    const [membersSnap, eventsSnap, feedbackSnap, paymentsSnap] =
      await Promise.all([
        db.collection("members").get(),
        db.collection("events").get(),
        db.collection("feedback").get(),
        db.collection("payments").get(),
      ]);

    const members = membersSnap.docs.map((d) => d.data());
    const feedback = feedbackSnap.docs.map((d) => d.data());
    const payments = paymentsSnap.docs.map((d) => {
      const data = d.data();
      return {
        amount: data.amount as number | undefined,
        paymentType: data.paymentType as string | undefined,
        stripeSessionId: (data.stripeSessionId as string | undefined) ?? d.id,
      };
    });

    let totalRegistrations = 0;
    for (const eventDoc of eventsSnap.docs) {
      const regs = await eventDoc.ref.collection("registrations").get();
      totalRegistrations += regs.size;
    }

    const avgRating =
      feedback.length > 0
        ? feedback.reduce((sum, f) => sum + (f.rating ?? 0), 0) /
          feedback.length
        : 0;

    const stripeRevenue = payments.reduce(
      (sum, p) => sum + (p.amount ?? 0),
      0
    );

    const summary: AnalyticsSummary = {
      totalMembers: members.length,
      pendingApplications: members.filter((m) => m.status === "pending").length,
      activeMembers: members.filter((m) => m.status === "active").length,
      expiredMembers: members.filter((m) => m.status === "expired").length,
      totalEvents: eventsSnap.size,
      eventRegistrations: totalRegistrations,
      averageFeedbackRating: Math.round(avgRating * 10) / 10,
      stripeRevenue: stripeRevenue / 100,
      membersByStatus: buildMembersByStatusChart(members),
      revenueByCategory: buildRevenueByCategoryChart(payments),
    };

    return NextResponse.json(summary);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load analytics";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
