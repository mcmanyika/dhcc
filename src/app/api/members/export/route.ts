import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyAdminToken } from "@/lib/admin-auth";
import { membersToCsv } from "@/lib/csv";
import type { Member } from "@/types";

export async function GET(request: NextRequest) {
  const admin = await verifyAdminToken(
    request.headers.get("authorization")
  );
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getAdminDb();
  const snapshot = await db.collection("members").orderBy("createdAt", "desc").get();
  const members: Member[] = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Member[];

  const csv = membersToCsv(members);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="members-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
