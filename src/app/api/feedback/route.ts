import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyAdminToken } from "@/lib/admin-auth";
import type { EventFeedback, FeedbackInput } from "@/types";

export async function GET(request: NextRequest) {
  const admin = await verifyAdminToken(
    request.headers.get("authorization")
  );
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");

  const db = await getAdminDb();
  let query = db.collection("feedback").orderBy("createdAt", "desc");

  if (eventId) {
    query = query.where("eventId", "==", eventId) as typeof query;
  }

  const snapshot = await query.get();
  const feedback: EventFeedback[] = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as EventFeedback[];

  return NextResponse.json(feedback);
}

export async function POST(request: NextRequest) {
  try {
    const body: FeedbackInput = await request.json();

    if (!body.eventId || !body.rating || !body.liked || !body.improvements) {
      return NextResponse.json(
        { error: "Required fields missing" },
        { status: 400 }
      );
    }

    if (body.rating < 1 || body.rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    const db = await getAdminDb();
    const eventDoc = await db.collection("events").doc(body.eventId).get();
    if (!eventDoc.exists) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const feedback = {
      ...body,
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection("feedback").add(feedback);
    return NextResponse.json({ id: docRef.id, ...feedback }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to submit feedback" },
      { status: 500 }
    );
  }
}
