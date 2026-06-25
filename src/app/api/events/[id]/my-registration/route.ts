import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyAuthToken } from "@/lib/auth";
import { findRegistrationForEvent } from "@/lib/event-registrations";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAuthToken(request.headers.get("authorization"));
  if (!auth?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: eventId } = await params;
  const db = await getAdminDb();
  const registration = await findRegistrationForEvent(db, eventId, auth.email);

  if (!registration) {
    return NextResponse.json({ registered: false });
  }

  return NextResponse.json({ registered: true, registration });
}
