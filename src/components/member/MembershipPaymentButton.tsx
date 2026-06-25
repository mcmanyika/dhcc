"use client";

import { useState } from "react";
import { CreditCard } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/Button";
import { needsMembershipPayment, canStartMembershipCheckout } from "@/lib/membership-payment";
import { formatCurrency } from "@/lib/utils";
import { MEMBERSHIP_TIERS, type Member } from "@/types";

type PaymentType = "one_time" | "subscription";

interface MembershipPaymentButtonProps {
  member: Member;
  compact?: boolean;
}

export function MembershipPaymentButton({
  member,
  compact = false,
}: MembershipPaymentButtonProps) {
  const { getIdToken } = useAuth();
  const [loading, setLoading] = useState<PaymentType | null>(null);
  const [error, setError] = useState("");

  if (!needsMembershipPayment(member)) {
    return null;
  }

  const canPay = canStartMembershipCheckout(member);
  const tier = MEMBERSHIP_TIERS.find((t) => t.value === member.membershipTier);
  const priceLabel = tier ? ` (${formatCurrency(tier.price)}/year)` : "";

  const paymentMessage = !canPay
    ? "Your membership must be approved before you can complete payment."
    : member.status === "expired"
      ? `Renew your ${member.membershipTier} membership${priceLabel} to restore access.`
      : member.status === "active"
        ? `Complete your ${member.membershipTier} membership payment${priceLabel} to stay active.`
        : `Complete payment to activate your ${member.membershipTier} membership${priceLabel}.`;

  const startCheckout = async (paymentType: PaymentType) => {
    setError("");
    setLoading(paymentType);

    try {
      const token = await getIdToken();
      if (!token) {
        throw new Error("You must be signed in to pay");
      }

      const res = await fetch("/api/stripe/checkout/me", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ paymentType }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to start payment");
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed to start");
      setLoading(null);
    }
  };

  return (
    <div
      className={
        compact
          ? ""
          : "mt-5 border-t border-gray-100 pt-5 dark:border-slate-700"
      }
    >
      {!compact && (
        <p className="text-sm text-gray-600 dark:text-slate-400">{paymentMessage}</p>
      )}

      {error && (
        <div
          className={`rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300 ${compact ? "" : "mt-3"}`}
        >
          {error}
        </div>
      )}

      {canPay && (
        <div className={`flex flex-wrap gap-3 ${compact ? "" : "mt-4"}`}>
          <Button
            onClick={() => startCheckout("one_time")}
            loading={loading === "one_time"}
            disabled={loading !== null}
            size={compact ? "sm" : "md"}
          >
            <CreditCard className="h-4 w-4" />
            Pay with Stripe
          </Button>
          <Button
            variant="outline"
            onClick={() => startCheckout("subscription")}
            loading={loading === "subscription"}
            disabled={loading !== null}
            size={compact ? "sm" : "md"}
          >
            Subscribe
          </Button>
        </div>
      )}
    </div>
  );
}
