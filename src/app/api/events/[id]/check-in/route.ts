import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { isEventDay } from "@/lib/event-qr";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;
  const body = await request.json();
  const { email, name, phone } = body;

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const db = await getAdminDb();
  const eventDoc = await db.collection("events").doc(eventId).get();

  if (!eventDoc.exists) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const event = eventDoc.data()!;
  const emailLower = email.trim().toLowerCase();

  if (!isEventDay(event.date)) {
    return NextResponse.json(
      { error: "Check-in is only available on the day of the event" },
      { status: 400 }
    );
  }

  const registrationsRef = db
    .collection("events")
    .doc(eventId)
    .collection("registrations");

  const snapshot = await registrationsRef.get();
  const existing = snapshot.docs.find(
    (doc) => doc.data().email?.toLowerCase() === emailLower
  );

  const now = new Date().toISOString();

  if (existing) {
    const data = existing.data();
    if (data.status === "attended") {
      return NextResponse.json({
        id: existing.id,
        eventId,
        ...data,
        alreadyCheckedIn: true,
      });
    }

    if (data.status === "cancelled") {
      return NextResponse.json(
        { error: "This registration was cancelled. Please contact the organizer." },
        { status: 400 }
      );
    }

    await existing.ref.update({
      status: "attended",
      checkedInAt: now,
    });

    const updated = await existing.ref.get();
    return NextResponse.json({
      id: updated.id,
      eventId,
      ...updated.data(),
      checkedIn: true,
    });
  }

  if (!name) {
    return NextResponse.json(
      {
        error: "not_registered",
        message: "No registration found. Please provide your name to check in as a walk-in.",
      },
      { status: 404 }
    );
  }

  const activeCount = snapshot.docs.filter((d) => d.data().status !== "cancelled").length;
  if (activeCount >= event.capacity) {
    return NextResponse.json({ error: "Event is at full capacity" }, { status: 400 });
  }

  const walkIn = {
    name,
    email: email.trim(),
    phone: phone ?? "",
    status: "attended" as const,
    registeredAt: now,
    checkedInAt: now,
    walkIn: true,
  };

  const docRef = await registrationsRef.add(walkIn);

  return NextResponse.json(
    { id: docRef.id, eventId, ...walkIn, checkedIn: true, walkIn: true },
    { status: 201 }
  );
}
