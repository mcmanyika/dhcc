import { getAdminDb } from "@/lib/firebase/admin";
import { needsMembershipPayment } from "@/lib/membership-payment";
import type { AnalyticsSummary, Event, EventFeedback, Member } from "@/types";

export async function getAnalyticsSummaryForChat(): Promise<AnalyticsSummary> {
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

  let totalRegistrations = 0;
  for (const eventDoc of eventsSnap.docs) {
    const regs = await eventDoc.ref.collection("registrations").get();
    totalRegistrations += regs.size;
  }

  const avgRating =
    feedback.length > 0
      ? feedback.reduce((sum, f) => sum + (f.rating ?? 0), 0) / feedback.length
      : 0;

  const stripeRevenue = paymentsSnap.docs.reduce(
    (sum, d) => sum + (d.data().amount ?? 0),
    0
  );

  return {
    totalMembers: members.length,
    pendingApplications: members.filter((m) => m.status === "pending").length,
    activeMembers: members.filter((m) => m.status === "active").length,
    expiredMembers: members.filter((m) => m.status === "expired").length,
    totalEvents: eventsSnap.size,
    eventRegistrations: totalRegistrations,
    averageFeedbackRating: Math.round(avgRating * 10) / 10,
    stripeRevenue: stripeRevenue / 100,
  };
}

function summarizeMember(member: Member) {
  return {
    name: `${member.firstName} ${member.lastName}`,
    businessName: member.businessName,
    email: member.email,
    tier: member.membershipTier,
    status: member.status,
    paymentStatus: member.paymentStatus,
    appliedAt: member.createdAt,
  };
}

export async function getPendingApplicationsForChat() {
  const db = await getAdminDb();
  const snap = await db
    .collection("members")
    .where("status", "==", "pending")
    .get();

  const members = snap.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }) as Member)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  return {
    count: members.length,
    applications: members.slice(0, 20).map(summarizeMember),
  };
}

export async function getUnpaidMembersForChat() {
  const db = await getAdminDb();
  const snap = await db.collection("members").get();

  const unpaid = snap.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }) as Member)
    .filter((m) => needsMembershipPayment(m))
    .map(summarizeMember);

  return { count: unpaid.length, members: unpaid.slice(0, 20) };
}

export async function getRecentPaymentsForChat() {
  const db = await getAdminDb();
  const [paymentsSnap, membersSnap] = await Promise.all([
    db.collection("payments").get(),
    db.collection("members").get(),
  ]);

  const memberMap = new Map(
    membersSnap.docs.map((doc) => {
      const data = doc.data();
      return [
        doc.id,
        `${data.firstName ?? ""} ${data.lastName ?? ""}`.trim(),
      ];
    })
  );

  const seenSessions = new Set<string>();
  const payments = [];

  for (const doc of paymentsSnap.docs) {
    const data = doc.data();
    const sessionId = data.stripeSessionId as string | undefined;
    if (sessionId && seenSessions.has(sessionId)) continue;
    if (sessionId) seenSessions.add(sessionId);

    payments.push({
      memberName: memberMap.get(data.memberId) ?? "Unknown",
      amount: (data.amount ?? 0) / 100,
      currency: data.currency ?? "usd",
      status: data.status ?? "completed",
      paymentType: data.paymentType ?? "payment",
      createdAt: data.createdAt ?? "",
    });
  }

  payments.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return { payments: payments.slice(0, 15) };
}

export async function getAllEventsForChat() {
  const db = await getAdminDb();
  const snapshot = await db.collection("events").orderBy("date", "desc").get();

  const events = snapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() }) as Event
  );

  return {
    count: events.length,
    events: events.slice(0, 15).map((e) => ({
      title: e.title,
      date: e.date,
      time: e.time,
      location: e.location,
      price: e.price,
      capacity: e.capacity,
    })),
  };
}

export async function getRecentFeedbackForChat() {
  const db = await getAdminDb();
  const snap = await db.collection("feedback").get();

  const feedback = snap.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }) as EventFeedback)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  const avgRating =
    feedback.length > 0
      ? feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length
      : 0;

  return {
    totalResponses: feedback.length,
    averageRating: Math.round(avgRating * 10) / 10,
    recent: feedback.slice(0, 10).map((f) => ({
      rating: f.rating,
      liked: f.liked,
      improvements: f.improvements,
      wouldAttendAgain: f.wouldAttendAgain,
      createdAt: f.createdAt,
    })),
  };
}

export async function searchMembersForChat(args: {
  query?: string;
  status?: string;
}) {
  const db = await getAdminDb();
  const snap = await db.collection("members").get();

  let members = snap.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() }) as Member
  );

  if (args.status) {
    members = members.filter((m) => m.status === args.status);
  }

  const q = args.query?.trim().toLowerCase();
  if (q) {
    members = members.filter(
      (m) =>
        m.firstName.toLowerCase().includes(q) ||
        m.lastName.toLowerCase().includes(q) ||
        m.businessName.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q)
    );
  }

  members.sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return {
    count: members.length,
    members: members.slice(0, 20).map(summarizeMember),
  };
}

export async function executeAdminChatTool(
  name: string,
  args: Record<string, unknown>
): Promise<unknown> {
  switch (name) {
    case "get_analytics_summary":
      return getAnalyticsSummaryForChat();
    case "get_pending_applications":
      return getPendingApplicationsForChat();
    case "get_unpaid_members":
      return getUnpaidMembersForChat();
    case "get_recent_payments":
      return getRecentPaymentsForChat();
    case "get_all_events":
      return getAllEventsForChat();
    case "get_recent_feedback":
      return getRecentFeedbackForChat();
    case "search_members":
      return searchMembersForChat({
        query: typeof args.query === "string" ? args.query : undefined,
        status: typeof args.status === "string" ? args.status : undefined,
      });
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

export const ADMIN_CHAT_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "get_analytics_summary",
      description:
        "Dashboard overview: total members, pending applications, active/expired counts, events, registrations, feedback rating, Stripe revenue.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_pending_applications",
      description: "List membership applications awaiting approval.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_unpaid_members",
      description:
        "List approved or active members who still need to complete membership payment.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_recent_payments",
      description: "Recent Stripe membership payments with member names.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_all_events",
      description: "List chamber events (most recent first).",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_recent_feedback",
      description: "Recent event feedback responses and average rating.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "search_members",
      description: "Search members by name, business, or email. Optionally filter by status.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search text for name, business, or email",
          },
          status: {
            type: "string",
            enum: ["pending", "approved", "rejected", "active", "expired"],
            description: "Optional membership status filter",
          },
        },
        additionalProperties: false,
      },
    },
  },
];
