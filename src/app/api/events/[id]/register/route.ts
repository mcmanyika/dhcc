import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyAdminToken } from "@/lib/admin-auth";
import { verifyAuthToken } from "@/lib/auth";
import { validateEventRegistration } from "@/lib/event-registration-checkout";
import { normalizeEmail } from "@/lib/event-registrations";
import type { EventRegistration } from "@/types";

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
  const snapshot = await db
    .collection("events")
    .doc(id)
    .collection("registrations")
    .orderBy("registeredAt", "desc")
    .get();

  const registrations: EventRegistration[] = snapshot.docs.map((doc) => ({
    id: doc.id,
    eventId: id,
    ...doc.data(),
  })) as EventRegistration[];

  return NextResponse.json(registrations);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;
  const body = await request.json();
  const { name, email, phone } = body;

  if (!name || !email) {
    return NextResponse.json(
      { error: "Name and email are required" },
      { status: 400 }
    );
  }

  const db = await getAdminDb();
  const emailLower = normalizeEmail(email);

  const validation = await validateEventRegistration(db, eventId, emailLower);
  if (!validation.ok) {
    if (validation.error === "You are already registered for this event") {
      return NextResponse.json(
        { error: validation.error, alreadyRegistered: true },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: validation.error },
      { status: validation.status }
    );
  }

  const event = validation.event;
  const price = (event.price as number) ?? 0;

  if (price > 0) {
    return NextResponse.json(
      {
        error: "This event requires online payment.",
        requiresPayment: true,
      },
      { status: 402 }
    );
  }

  const auth = await verifyAuthToken(request.headers.get("authorization"));

  const registration = {
    name,
    email: emailLower,
    phone: phone ?? "",
    ...(auth?.uid ? { userId: auth.uid } : {}),
    status: "registered" as const,
    registeredAt: new Date().toISOString(),
    paymentStatus: "free" as const,
  };

  const docRef = await db
    .collection("events")
    .doc(eventId)
    .collection("registrations")
    .add(registration);

  return NextResponse.json(
    { id: docRef.id, eventId, ...registration },
    { status: 201 }
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

  const { id: eventId } = await params;
  const { registrationId, status } = await request.json();

  if (!registrationId || !status) {
    return NextResponse.json(
      { error: "registrationId and status are required" },
      { status: 400 }
    );
  }

  const db = await getAdminDb();
  const docRef = db
    .collection("events")
    .doc(eventId)
    .collection("registrations")
    .doc(registrationId);

  if (!(await docRef.get()).exists) {
    return NextResponse.json(
      { error: "Registration not found" },
      { status: 404 }
    );
  }

  await docRef.update({ status });
  const updated = await docRef.get();
  return NextResponse.json({ id: updated.id, eventId, ...updated.data() });
}
