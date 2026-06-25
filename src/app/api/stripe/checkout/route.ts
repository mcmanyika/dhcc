import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyAdminToken } from "@/lib/admin-auth";
import {
  createMembershipCheckoutSession,
  type PaymentType,
} from "@/lib/stripe-checkout";

export async function POST(request: NextRequest) {
  const admin = await verifyAdminToken(
    request.headers.get("authorization")
  );
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { memberId, paymentType } = await request.json();

  if (!memberId || !paymentType) {
    return NextResponse.json(
      { error: "memberId and paymentType are required" },
      { status: 400 }
    );
  }

  if (!["one_time", "subscription"].includes(paymentType)) {
    return NextResponse.json(
      { error: "paymentType must be one_time or subscription" },
      { status: 400 }
    );
  }

  try {
    const db = await getAdminDb();
    const memberDoc = await db.collection("members").doc(memberId).get();

    if (!memberDoc.exists) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const url = await createMembershipCheckoutSession(
      memberDoc,
      paymentType as PaymentType
    );

    return NextResponse.json({ url });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to start checkout";
    const status = message.includes("No Stripe price") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
