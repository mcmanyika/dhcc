import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { applyEventRegistrationPayment } from "@/lib/complete-event-payment";
import { retrieveCheckoutSession } from "@/lib/sync-member-payments";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;
  const { sessionId } = await request.json();

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  try {
    const session = await retrieveCheckoutSession(sessionId);

    if (
      session.metadata?.paymentKind !== "event" ||
      session.metadata?.eventId !== eventId
    ) {
      return NextResponse.json({ error: "Invalid payment session" }, { status: 403 });
    }

    const db = await getAdminDb();
    const result = await applyEventRegistrationPayment(db, session);

    if (!result) {
      return NextResponse.json(
        { error: "Not an event payment session" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      registered: true,
      registrationId: result.registrationId,
      created: result.created,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to confirm registration";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
