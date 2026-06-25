import type { Member, PaymentStatus } from "@/types";

const PAID_STATUSES: PaymentStatus[] = ["paid", "subscription_active"];

export function isMembershipPaid(member: Member): boolean {
  return PAID_STATUSES.includes(member.paymentStatus);
}

export function needsMembershipPayment(member: Member): boolean {
  if (isMembershipPaid(member)) {
    return false;
  }

  if (member.status === "pending" || member.status === "rejected") {
    return false;
  }

  return true;
}

export function canStartMembershipCheckout(member: Member): boolean {
  if (!needsMembershipPayment(member)) {
    return false;
  }

  return (
    member.status === "approved" ||
    member.status === "active" ||
    member.status === "expired"
  );
}
