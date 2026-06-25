import type { Firestore } from "firebase-admin/firestore";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { applyMembershipPayment } from "@/lib/complete-membership-payment";

export async function syncMemberPaymentsFromStripe(
  db: Firestore,
  memberId: string,
  stripeCustomerId: string
): Promise<boolean> {
  const sessions = await getStripe().checkout.sessions.list({
    customer: stripeCustomerId,
    limit: 20,
  });

  let applied = false;

  for (const session of sessions.data) {
    const sessionMemberId = session.metadata?.memberId;
    if (sessionMemberId && sessionMemberId !== memberId) {
      continue;
    }

    try {
      const didApply = await applyMembershipPayment(db, memberId, session);
      if (didApply) {
        applied = true;
      }
    } catch {
      // Skip sessions that are not complete yet.
    }
  }

  return applied;
}

export async function retrieveCheckoutSession(
  sessionId: string
): Promise<Stripe.Checkout.Session> {
  return getStripe().checkout.sessions.retrieve(sessionId);
}
