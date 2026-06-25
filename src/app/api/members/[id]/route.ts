import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyAdminToken } from "@/lib/admin-auth";
import {
  pickAdminMemberUpdates,
  syncMemberAdminRole,
  withAdminFlag,
  getAdminUserIds,
} from "@/lib/admin-member-update";
import type { Member } from "@/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdminToken(
    request.headers.get("authorization")
  );
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const db = await getAdminDb();
  const doc = await db.collection("members").doc(id).get();

  if (!doc.exists) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  const adminUserIds = await getAdminUserIds(db);
  return NextResponse.json(
    withAdminFlag({ id: doc.id, ...doc.data() } as Member, adminUserIds)
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdminToken(
    request.headers.get("authorization")
  );
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const updates = pickAdminMemberUpdates(body);

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );
  }

  const db = await getAdminDb();
  const docRef = db.collection("members").doc(id);
  const doc = await docRef.get();

  if (!doc.exists) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  const memberData = doc.data()!;
  const email =
    (typeof updates.email === "string" ? updates.email : undefined) ||
    (memberData.email as string);

  if (updates.isAdmin !== undefined) {
    if (updates.isAdmin === false && memberData.userId === admin.uid) {
      return NextResponse.json(
        { error: "You cannot remove your own admin access" },
        { status: 400 }
      );
    }

    const result = await syncMemberAdminRole(
      db,
      memberData.userId as string | undefined,
      email,
      updates.isAdmin
    );

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
  }

  await docRef.update({
    ...updates,
    updatedAt: new Date().toISOString(),
  });

  const updated = await docRef.get();
  const adminUserIds = await getAdminUserIds(db);
  return NextResponse.json(
    withAdminFlag({ id: updated.id, ...updated.data() } as Member, adminUserIds)
  );
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdminToken(
    request.headers.get("authorization")
  );
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const db = await getAdminDb();
  const docRef = db.collection("members").doc(id);
  const doc = await docRef.get();

  if (!doc.exists) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  const userId = doc.data()?.userId as string | undefined;
  if (userId && userId !== admin.uid) {
    await db.collection("admins").doc(userId).delete();
  }

  await docRef.delete();
  return NextResponse.json({ success: true });
}
