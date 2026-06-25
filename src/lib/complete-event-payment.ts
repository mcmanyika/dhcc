import type { Firestore } from "firebase-admin/firestore";
import type Stripe from "stripe";
import { normalizeEmail } from "@/lib/event-registrations";
import { validateEventRegistration } from "@/lib/event-registration-checkout";

export interface EventPaymentResult {
  eventId: string;
  registrationId: string;
  created: boolean;
}

export async function applyEventRegistrationPayment(
  db: Firestore,
  session: Stripe.Checkout.Session
): Promise<EventPaymentResult | null> {
  const paymentKind = session.metadata?.paymentKind;
  const eventId = session.metadata?.eventId;

  if (paymentKind !== "event" || !eventId) {
    return null;
  }

  const isComplete =
    session.status === "complete" && session.payment_status === "paid";

  if (!isComplete) {
    throw new Error(
      `Event payment has not been completed (status: ${session.status})`
    );
  }

  const paymentRef = db.collection("payments").doc(session.id);
  const existingPayment = await paymentRef.get();

  if (existingPayment.exists) {
    const data = existingPayment.data()!;
    return {
      eventId: data.eventId as string,
      registrationId: data.registrationId as string,
      created: false,
    };
  }

  const name = session.metadata?.registrantName ?? "";
  const email = normalizeEmail(session.metadata?.registrantEmail ?? "");
  const phone = session.metadata?.registrantPhone ?? "";
  const userId = session.metadata?.userId || undefined;

  if (!name || !email) {
    throw new Error("Missing registrant details on payment session");
  }

  const existingReg = await db
    .collection("events")
    .doc(eventId)
    .collection("registrations")
    .where("stripeSessionId", "==", session.id)
    .limit(1)
    .get();

  if (!existingReg.empty) {
    const regId = existingReg.docs[0].id;
    await paymentRef.set({
      eventId,
      registrationId: regId,
      memberId: "",
      stripeSessionId: session.id,
      amount: session.amount_total ?? 0,
      currency: session.currency ?? "usd",
      paymentType: "event",
      status: "completed",
      createdAt: new Date().toISOString(),
    });
    return { eventId, registrationId: regId, created: false };
  }

  const duplicate = await db
    .collection("events")
    .doc(eventId)
    .collection("registrations")
    .where("email", "==", email)
    .get();

  const activeDuplicate = duplicate.docs.find(
    (doc) => doc.data().status !== "cancelled"
  );

  if (activeDuplicate) {
    const regId = activeDuplicate.id;
    await activeDuplicate.ref.update({
      paymentStatus: "paid",
      stripeSessionId: session.id,
      amountPaid: (session.amount_total ?? 0) / 100,
    });
    await paymentRef.set({
      eventId,
      registrationId: regId,
      memberId: "",
      stripeSessionId: session.id,
      amount: session.amount_total ?? 0,
      currency: session.currency ?? "usd",
      paymentType: "event",
      status: "completed",
      createdAt: new Date().toISOString(),
    });
    return { eventId, registrationId: regId, created: false };
  }

  const validation = await validateEventRegistration(db, eventId, email);
  if (!validation.ok) {
    throw new Error(validation.error);
  }

  const now = new Date().toISOString();
  const registration = {
    name,
    email,
    phone,
    ...(userId ? { userId } : {}),
    status: "registered" as const,
    registeredAt: now,
    paymentStatus: "paid" as const,
    stripeSessionId: session.id,
    amountPaid: (session.amount_total ?? 0) / 100,
  };

  const regRef = await db
    .collection("events")
    .doc(eventId)
    .collection("registrations")
    .add(registration);

  let memberId = "";
  if (userId) {
    const memberSnap = await db
      .collection("members")
      .where("userId", "==", userId)
      .limit(1)
      .get();
    if (!memberSnap.empty) {
      memberId = memberSnap.docs[0].id;
    }
  } else {
    const memberSnap = await db
      .collection("members")
      .where("email", "==", email)
      .limit(1)
      .get();
    if (!memberSnap.empty) {
      memberId = memberSnap.docs[0].id;
    }
  }

  await paymentRef.set({
    eventId,
    registrationId: regRef.id,
    memberId,
    stripeSessionId: session.id,
    amount: session.amount_total ?? 0,
    currency: session.currency ?? "usd",
    paymentType: "event",
    status: "completed",
    createdAt: now,
  });

  return { eventId, registrationId: regRef.id, created: true };
}
