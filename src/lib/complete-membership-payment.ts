import type { Firestore } from "firebase-admin/firestore";
import type Stripe from "stripe";

export async function applyMembershipPayment(
  db: Firestore,
  memberId: string,
  session: Stripe.Checkout.Session
): Promise<boolean> {
  if (session.metadata?.memberId && session.metadata.memberId !== memberId) {
    throw new Error("Session does not belong to this member");
  }

  const isComplete =
    session.status === "complete" &&
    (session.payment_status === "paid" ||
      session.payment_status === "no_payment_required" ||
      (session.mode === "subscription" && !!session.subscription));

  if (!isComplete) {
    throw new Error(
      `Payment has not been completed (status: ${session.status}, payment_status: ${session.payment_status})`
    );
  }

  const paymentRef = db.collection("payments").doc(session.id);
  const existingPayment = await paymentRef.get();

  if (existingPayment.exists) {
    return false;
  }

  const memberRef = db.collection("members").doc(memberId);
  const now = new Date();
  const endDate = new Date(now);
  endDate.setFullYear(endDate.getFullYear() + 1);

  const updates: Record<string, unknown> = {
    paymentStatus:
      session.mode === "subscription" ? "subscription_active" : "paid",
    status: "active",
    membershipStartDate: now.toISOString(),
    membershipEndDate: endDate.toISOString(),
    updatedAt: now.toISOString(),
  };

  if (session.subscription) {
    updates.stripeSubscriptionId = session.subscription as string;
  }

  await memberRef.update(updates);

  await paymentRef.set({
    memberId,
    stripeSessionId: session.id,
    amount: session.amount_total ?? 0,
    currency: session.currency ?? "usd",
    paymentType: session.mode,
    status: "completed",
    createdAt: now.toISOString(),
  });

  return true;
}
