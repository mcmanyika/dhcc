import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyAuthToken } from "@/lib/auth";
import type { PaymentRecord } from "@/types";

export async function GET(request: NextRequest) {
  const user = await verifyAuthToken(request.headers.get("authorization"));
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = await getAdminDb();
    const memberSnap = await db
      .collection("members")
      .where("userId", "==", user.uid)
      .limit(1)
      .get();

    if (memberSnap.empty) {
      return NextResponse.json([]);
    }

    const memberId = memberSnap.docs[0].id;
    const paymentsSnap = await db
      .collection("payments")
      .where("memberId", "==", memberId)
      .get();

    const payments: PaymentRecord[] = paymentsSnap.docs
      .map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as PaymentRecord
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    return NextResponse.json(payments);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load payments";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
