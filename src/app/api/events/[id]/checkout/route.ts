import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyAuthToken } from "@/lib/auth";
import { validateEventRegistration } from "@/lib/event-registration-checkout";
import { createEventCheckoutSession } from "@/lib/event-checkout";
import { normalizeEmail } from "@/lib/event-registrations";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
    const validation = await validateEventRegistration(
      db,
      eventId,
      normalizeEmail(email)
    );

    if (!validation.ok) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status }
      );
    }

    const event = validation.event;
    const price = (event.price as number) ?? 0;

    if (price <= 0) {
      return NextResponse.json(
        { error: "This event is free. Use the register endpoint instead." },
        { status: 400 }
      );
    }

    const auth = await verifyAuthToken(request.headers.get("authorization"));

    const url = await createEventCheckoutSession({
      eventId,
      eventTitle: event.title as string,
      eventDescription: event.description as string | undefined,
      price,
      name,
      email: normalizeEmail(email),
      phone: phone ?? "",
      userId: auth?.uid,
    });

    return NextResponse.json({ url });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to start checkout";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
