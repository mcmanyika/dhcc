import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyAuthToken } from "@/lib/auth";
import { findRegistrationsForEmail } from "@/lib/event-registrations";

export async function GET(request: NextRequest) {
  const auth = await verifyAuthToken(request.headers.get("authorization"));
  if (!auth?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getAdminDb();
  const registrations = await findRegistrationsForEmail(db, auth.email);

  return NextResponse.json(registrations);
}
