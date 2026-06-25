import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyAuthToken } from "@/lib/auth";
import { verifyAdminToken } from "@/lib/admin-auth";
import { getAdminUserIds, withAdminFlag } from "@/lib/admin-member-update";
import type { Member, MemberInput } from "@/types";

export async function GET(request: NextRequest) {
  const admin = await verifyAdminToken(
    request.headers.get("authorization")
  );
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search")?.toLowerCase();

  const db = await getAdminDb();
  const [snapshot, adminUserIds] = await Promise.all([
    db.collection("members").orderBy("createdAt", "desc").get(),
    getAdminUserIds(db),
  ]);

  let members: Member[] = snapshot.docs.map((doc) =>
    withAdminFlag(
      {
        id: doc.id,
        ...doc.data(),
      } as Member,
      adminUserIds
    )
  );

  if (status) {
    members = members.filter((m) => m.status === status);
  }

  if (search) {
    members = members.filter(
      (m) =>
        m.firstName.toLowerCase().includes(search) ||
        m.lastName.toLowerCase().includes(search) ||
        m.businessName.toLowerCase().includes(search) ||
        m.email.toLowerCase().includes(search)
    );
  }

  return NextResponse.json(members);
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await verifyAuthToken(request.headers.get("authorization"));
    if (!authUser) {
      return NextResponse.json(
        { error: "You must be signed in to apply for membership" },
        { status: 401 }
      );
    }

    const body: MemberInput = await request.json();

    if (!body.agreedToTerms) {
      return NextResponse.json(
        { error: "You must agree to the terms" },
        { status: 400 }
      );
    }

    const required = [
      "firstName",
      "lastName",
      "businessName",
      "email",
      "phone",
      "businessCategory",
      "membershipTier",
      "businessDescription",
    ] as const;

    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    const db = await getAdminDb();
    const existing = await db
      .collection("members")
      .where("userId", "==", authUser.uid)
      .limit(1)
      .get();

    if (!existing.empty) {
      const current = existing.docs[0].data();
      if (current.status === "pending") {
        return NextResponse.json(
          { error: "Your application is already under review" },
          { status: 400 }
        );
      }
      if (current.status === "approved" || current.status === "active") {
        return NextResponse.json(
          { error: "You are already an approved member" },
          { status: 400 }
        );
      }
    }

    const now = new Date().toISOString();
    const memberData = {
      ...body,
      email: authUser.email || body.email,
      userId: authUser.uid,
      status: "pending" as const,
      paymentStatus: "unpaid" as const,
      createdAt: now,
      updatedAt: now,
    };

    if (!existing.empty && existing.docs[0].data().status === "rejected") {
      await existing.docs[0].ref.update(memberData);
      return NextResponse.json(
        { id: existing.docs[0].id, ...memberData },
        { status: 200 }
      );
    }

    const docRef = await db.collection("members").add(memberData);
    return NextResponse.json({ id: docRef.id, ...memberData }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create application";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
