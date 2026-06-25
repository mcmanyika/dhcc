import Stripe from "stripe";
import { MEMBERSHIP_TIERS, type MembershipTier } from "@/types";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-05-27.dahlia",
      typescript: true,
    });
  }
  return stripeClient;
}

export function getTierPrice(tier: MembershipTier): number {
  const found = MEMBERSHIP_TIERS.find((t) => t.value === tier);
  return found?.price ?? 99;
}

export function getTierPriceId(tier: MembershipTier): string | undefined {
  const priceIds: Record<MembershipTier, string | undefined> = {
    basic: process.env.STRIPE_PRICE_BASIC,
    standard: process.env.STRIPE_PRICE_STANDARD,
    premium: process.env.STRIPE_PRICE_PREMIUM,
    corporate: process.env.STRIPE_PRICE_CORPORATE,
  };
  return priceIds[tier];
}
