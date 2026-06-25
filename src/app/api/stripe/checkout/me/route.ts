import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyAuthToken } from "@/lib/auth";
import {
  createMembershipCheckoutSession,
  type PaymentType,
} from "@/lib/stripe-checkout";
import { canStartMembershipCheckout } from "@/lib/membership-payment";
import type { Member } from "@/types";

export async function POST(request: NextRequest) {
  const user = await verifyAuthToken(request.headers.get("authorization"));
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const paymentType = (body.paymentType ?? "one_time") as PaymentType;

  if (!["one_time", "subscription"].includes(paymentType)) {
    return NextResponse.json(
      { error: "paymentType must be one_time or subscription" },
      { status: 400 }
    );
  }

  try {
    const db = await getAdminDb();
    const snapshot = await db
      .collection("members")
      .where("userId", "==", user.uid)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ error: "Member profile not found" }, { status: 404 });
    }

    const doc = snapshot.docs[0];
    const member = { id: doc.id, ...doc.data() } as Member;

    if (!canStartMembershipCheckout(member)) {
      return NextResponse.json(
        { error: "Membership payment is not available for your account" },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const url = await createMembershipCheckoutSession(doc, paymentType, {
      successUrl: `${appUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${appUrl}/dashboard`,
    });

    return NextResponse.json({ url });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to start checkout";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
