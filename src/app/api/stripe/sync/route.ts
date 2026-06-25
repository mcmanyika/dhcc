import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyAuthToken } from "@/lib/auth";
import { isFirestoreAdmin } from "@/lib/admin-auth";
import { syncMemberPaymentsFromStripe } from "@/lib/sync-member-payments";
import type { Member } from "@/types";

export async function POST(request: NextRequest) {
  const user = await verifyAuthToken(request.headers.get("authorization"));
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    const memberData = memberDoc.data();
    const stripeCustomerId = memberData.stripeCustomerId as string | undefined;

    if (!stripeCustomerId) {
      return NextResponse.json({
        synced: false,
        member: { id: memberDoc.id, ...memberData } as Member,
      });
    }

    const synced = await syncMemberPaymentsFromStripe(
      db,
      memberDoc.id,
      stripeCustomerId
    );

    const updated = await memberDoc.ref.get();
    const isAdmin = await isFirestoreAdmin(user.uid);
    const member: Member = {
      id: updated.id,
      ...updated.data(),
      isAdmin: isAdmin || updated.data()?.isAdmin === true,
    } as Member;

    return NextResponse.json({ synced, member });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to sync payments";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
