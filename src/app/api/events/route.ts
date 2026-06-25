import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyAdminToken } from "@/lib/admin-auth";
import type { Event, EventInput } from "@/types";

export async function GET(request: NextRequest) {
  const admin = await verifyAdminToken(
    request.headers.get("authorization")
  );

  const db = await getAdminDb();

  if (admin) {
    const snapshot = await db
      .collection("events")
      .orderBy("date", "desc")
      .get();
    const events: Event[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Event[];
    return NextResponse.json(events);
  }

  const snapshot = await db.collection("events").orderBy("date", "asc").get();
  const events: Event[] = snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }) as Event)
    .filter((e) => new Date(e.date) >= new Date(new Date().toDateString()));

  return NextResponse.json(events);
}

export async function POST(request: NextRequest) {
  const admin = await verifyAdminToken(
    request.headers.get("authorization")
  );
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: EventInput = await request.json();
  const now = new Date().toISOString();

  const db = await getAdminDb();
  const docRef = await db.collection("events").add({
    ...body,
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json(
    { id: docRef.id, ...body, createdAt: now, updatedAt: now },
    { status: 201 }
  );
}
