import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyAuthToken } from "@/lib/auth";
import { isFirestoreAdmin } from "@/lib/admin-auth";
import { applyMembershipPayment } from "@/lib/complete-membership-payment";
import { retrieveCheckoutSession } from "@/lib/sync-member-payments";
import type { Member } from "@/types";

export async function POST(request: NextRequest) {
  const user = await verifyAuthToken(request.headers.get("authorization"));
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await request.json();
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
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

    const memberDoc = snapshot.docs[0];
    const memberId = memberDoc.id;

    const session = await retrieveCheckoutSession(sessionId);

    if (session.metadata?.memberId && session.metadata.memberId !== memberId) {
      return NextResponse.json({ error: "Invalid payment session" }, { status: 403 });
    }

    await applyMembershipPayment(db, memberId, session);

    const updated = await memberDoc.ref.get();
    const isAdmin = await isFirestoreAdmin(user.uid);
    const member: Member = {
      id: updated.id,
      ...updated.data(),
      isAdmin: isAdmin || updated.data()?.isAdmin === true,
    } as Member;

    return NextResponse.json({ member, confirmed: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to confirm payment";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
