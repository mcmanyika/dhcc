import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { applyMembershipPayment } from "@/lib/complete-membership-payment";
import { applyEventRegistrationPayment } from "@/lib/complete-event-payment";
import { getStripe } from "@/lib/stripe";
import Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const db = await getAdminDb();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.metadata?.paymentKind === "event") {
        await applyEventRegistrationPayment(db, session);
        break;
      }

      const memberId = session.metadata?.memberId;
      if (!memberId) break;

      await applyMembershipPayment(db, memberId, session);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const snapshot = await db
        .collection("members")
        .where("stripeSubscriptionId", "==", subscription.id)
        .limit(1)
        .get();

      if (!snapshot.empty) {
        await snapshot.docs[0].ref.update({
          paymentStatus: "subscription_cancelled",
          status: "expired",
          updatedAt: new Date().toISOString(),
        });
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionRef =
        invoice.parent?.subscription_details?.subscription;
      const subscriptionId =
        typeof subscriptionRef === "string"
          ? subscriptionRef
          : subscriptionRef?.id;

      if (subscriptionId) {
        const snapshot = await db
          .collection("members")
          .where("stripeSubscriptionId", "==", subscriptionId)
          .limit(1)
          .get();

        if (!snapshot.empty) {
          await snapshot.docs[0].ref.update({
            paymentStatus: "failed",
            updatedAt: new Date().toISOString(),
          });
        }
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
