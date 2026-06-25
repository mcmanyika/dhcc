import type { DocumentSnapshot } from "firebase-admin/firestore";
import Stripe from "stripe";
import { getStripe, getTierPrice, getTierPriceId } from "@/lib/stripe";
import type { MembershipTier } from "@/types";

export type PaymentType = "one_time" | "subscription";

interface CheckoutUrls {
  successUrl: string;
  cancelUrl: string;
}

export async function createMembershipCheckoutSession(
  memberDoc: DocumentSnapshot,
  paymentType: PaymentType,
  urls?: Partial<CheckoutUrls>
): Promise<string> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const successUrl =
    urls?.successUrl ??
    `${appUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = urls?.cancelUrl ?? `${appUrl}/payment/cancel`;

  const member = memberDoc.data()!;
  const memberId = memberDoc.id;
  const tier = member.membershipTier as MembershipTier;

  let customerId = member.stripeCustomerId as string | undefined;

  if (!customerId) {
    const customer = await getStripe().customers.create({
      email: member.email,
      name: `${member.firstName} ${member.lastName}`,
      metadata: { memberId, businessName: member.businessName },
    });
    customerId = customer.id;
    await memberDoc.ref.update({ stripeCustomerId: customerId });
  }

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

  if (paymentType === "subscription") {
    const priceId = getTierPriceId(tier);
    if (!priceId) {
      throw new Error(`No Stripe price configured for tier: ${tier}`);
    }
    lineItems.push({ price: priceId, quantity: 1 });
  } else {
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: {
          name: `DHCC ${tier} Membership`,
          description: `One-year membership for ${member.businessName}`,
        },
        unit_amount: getTierPrice(tier) * 100,
      },
      quantity: 1,
    });
  }

  const session = await getStripe().checkout.sessions.create({
    customer: customerId,
    mode: paymentType === "subscription" ? "subscription" : "payment",
    line_items: lineItems,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      memberId,
      paymentType,
    },
  });

  if (!session.url) {
    throw new Error("Failed to create checkout session");
  }

  return session.url;
}
