import { getAdminDb } from "@/lib/firebase/admin";
import { findRegistrationsForEmail } from "@/lib/event-registrations";
import {
  canStartMembershipCheckout,
  needsMembershipPayment,
} from "@/lib/membership-payment";
import { MEMBERSHIP_TIERS, type Event, type Member, type PaymentRecord } from "@/types";

export type ChatUser = { uid: string; email: string } | null;

function sanitizeMember(member: Member) {
  return {
    name: `${member.firstName} ${member.lastName}`,
    businessName: member.businessName,
    email: member.email,
    phone: member.phone,
    businessCategory: member.businessCategory,
    membershipTier: member.membershipTier,
    status: member.status,
    paymentStatus: member.paymentStatus,
    membershipStartDate: member.membershipStartDate ?? null,
    membershipEndDate: member.membershipEndDate ?? null,
    needsPayment: needsMembershipPayment(member),
    canPayOnline: canStartMembershipCheckout(member),
    isAdmin: member.isAdmin === true,
  };
}

export async function getMemberProfileForChat(user: ChatUser) {
  if (!user) return { error: "Not signed in" };

  const db = await getAdminDb();
  const snap = await db
    .collection("members")
    .where("userId", "==", user.uid)
    .limit(1)
    .get();

  if (snap.empty) {
    return {
      hasProfile: false,
      message:
        "No membership profile found. The user may need to complete an application at /apply.",
    };
  }

  const member = { id: snap.docs[0].id, ...snap.docs[0].data() } as Member;
  return { hasProfile: true, member: sanitizeMember(member) };
}

export async function getMyRegistrationsForChat(user: ChatUser) {
  if (!user?.email) return { error: "Not signed in" };

  const db = await getAdminDb();
  const registrations = await findRegistrationsForEmail(db, user.email);

  return {
    count: registrations.length,
    registrations: registrations.map(({ event, registration }) => ({
      eventTitle: event.title,
      date: event.date,
      time: event.time,
      location: event.location,
      status: registration.status,
      registeredAt: registration.registeredAt,
    })),
  };
}

export async function getMyPaymentsForChat(user: ChatUser) {
  if (!user) return { error: "Not signed in" };

  const db = await getAdminDb();
  const memberSnap = await db
    .collection("members")
    .where("userId", "==", user.uid)
    .limit(1)
    .get();

  if (memberSnap.empty) return { payments: [] };

  const memberId = memberSnap.docs[0].id;
  const paymentsSnap = await db
    .collection("payments")
    .where("memberId", "==", memberId)
    .get();

  const payments = paymentsSnap.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }) as PaymentRecord)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 10)
    .map((p) => ({
      amount: p.amount / 100,
      currency: p.currency,
      status: p.status,
      type: p.paymentType,
      createdAt: p.createdAt,
    }));

  return { payments };
}

export async function getUpcomingEventsForChat() {
  const db = await getAdminDb();
  const snapshot = await db.collection("events").orderBy("date", "asc").get();
  const today = new Date(new Date().toDateString());

  const events: Event[] = snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }) as Event)
    .filter((e) => new Date(e.date) >= today);

  return {
    count: events.length,
    events: events.slice(0, 10).map((e) => ({
      title: e.title,
      date: e.date,
      time: e.time,
      location: e.location,
      price: e.price,
      capacity: e.capacity,
      description: e.description,
    })),
  };
}

export function getMembershipTiersForChat() {
  return {
    tiers: MEMBERSHIP_TIERS.map((t) => ({
      name: t.label,
      tier: t.value,
      pricePerYear: t.price,
    })),
    howToJoin:
      "Sign in, then complete the membership application at /apply. After approval, pay online from the member dashboard.",
  };
}

export async function executeChatTool(
  name: string,
  user: ChatUser
): Promise<unknown> {
  switch (name) {
    case "get_member_profile":
      return getMemberProfileForChat(user);
    case "get_my_event_registrations":
      return getMyRegistrationsForChat(user);
    case "get_my_payments":
      return getMyPaymentsForChat(user);
    case "get_upcoming_events":
      return getUpcomingEventsForChat();
    case "get_membership_tiers":
      return getMembershipTiersForChat();
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

export const MEMBER_CHAT_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "get_member_profile",
      description:
        "Get the signed-in member's profile, membership tier, status, and payment state.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_my_event_registrations",
      description: "List events the signed-in member is registered for.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_my_payments",
      description: "Get recent membership payment history for the signed-in member.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_upcoming_events",
      description: "List upcoming chamber events open to members and the public.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_membership_tiers",
      description: "List membership tiers, annual pricing, and how to join.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
];

export const PUBLIC_CHAT_TOOLS = MEMBER_CHAT_TOOLS.filter(
  (t) =>
    t.function.name === "get_upcoming_events" ||
    t.function.name === "get_membership_tiers"
);
