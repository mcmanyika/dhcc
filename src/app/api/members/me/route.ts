import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyAuthToken } from "@/lib/auth";
import { isFirestoreAdmin } from "@/lib/admin-auth";
import type { Member } from "@/types";

export async function GET(request: NextRequest) {
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
      return NextResponse.json(null);
    }

    const doc = snapshot.docs[0];
    const isAdmin = await isFirestoreAdmin(user.uid);
    const member: Member = {
      id: doc.id,
      ...doc.data(),
      isAdmin: isAdmin || doc.data().isAdmin === true,
    } as Member;
    return NextResponse.json(member);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load profile";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

export async function PATCH(request: NextRequest) {
  const user = await verifyAuthToken(request.headers.get("authorization"));
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    firstName,
    lastName,
    businessName,
    phone,
    website,
    businessCategory,
    businessDescription,
    socialMedia,
  } = body;

  if (
    !firstName ||
    !lastName ||
    !businessName ||
    !phone ||
    !businessCategory ||
    !businessDescription
  ) {
    return NextResponse.json(
      { error: "Please fill in all required fields" },
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

    const docRef = snapshot.docs[0].ref;
    const updates = {
      firstName,
      lastName,
      businessName,
      phone,
      website: website ?? "",
      businessCategory,
      businessDescription,
      socialMedia: socialMedia ?? {},
      updatedAt: new Date().toISOString(),
    };

    await docRef.update(updates);
    const updated = await docRef.get();
    const isAdmin = await isFirestoreAdmin(user.uid);

    const member: Member = {
      id: updated.id,
      ...updated.data(),
      isAdmin: isAdmin || updated.data()?.isAdmin === true,
    } as Member;

    return NextResponse.json(member);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update profile";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
