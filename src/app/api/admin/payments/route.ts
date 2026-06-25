import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyAdminToken } from "@/lib/admin-auth";
import type { AdminPaymentRecord } from "@/types";

export async function GET(request: NextRequest) {
  const admin = await verifyAdminToken(
    request.headers.get("authorization")
  );
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = await getAdminDb();
    const [paymentsSnap, membersSnap] = await Promise.all([
      db.collection("payments").get(),
      db.collection("members").get(),
    ]);

    const memberMap = new Map(
      membersSnap.docs.map((doc) => {
        const data = doc.data();
        return [
          doc.id,
          {
            name: `${data.firstName ?? ""} ${data.lastName ?? ""}`.trim(),
            email: data.email as string | undefined,
            businessName: data.businessName as string | undefined,
          },
        ];
      })
    );

    const seenSessions = new Set<string>();
    const payments: AdminPaymentRecord[] = [];

    for (const doc of paymentsSnap.docs) {
      const data = doc.data();
      const sessionId = data.stripeSessionId as string | undefined;
      if (sessionId && seenSessions.has(sessionId)) {
        continue;
      }
      if (sessionId) {
        seenSessions.add(sessionId);
      }

      const member = memberMap.get(data.memberId);
      payments.push({
        id: doc.id,
        memberId: data.memberId,
        stripeSessionId: data.stripeSessionId ?? doc.id,
        amount: data.amount ?? 0,
        currency: data.currency ?? "usd",
        paymentType: data.paymentType ?? "payment",
        status: data.status ?? "completed",
        createdAt: data.createdAt ?? "",
        memberName: member?.name,
        memberEmail: member?.email,
        businessName: member?.businessName,
      });
    }

    payments.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0) / 100;

    return NextResponse.json({ payments, totalRevenue, count: payments.length });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load payments";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
