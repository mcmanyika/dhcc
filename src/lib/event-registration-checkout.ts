import type { Firestore } from "firebase-admin/firestore";
import {
  findRegistrationForEvent,
  normalizeEmail,
} from "@/lib/event-registrations";

export async function validateEventRegistration(
  db: Firestore,
  eventId: string,
  email: string
): Promise<
  | { ok: true; event: FirebaseFirestore.DocumentData; eventId: string }
  | { ok: false; error: string; status: number }
> {
  const eventDoc = await db.collection("events").doc(eventId).get();

  if (!eventDoc.exists) {
    return { ok: false, error: "Event not found", status: 404 };
  }

  const event = eventDoc.data()!;
  const emailLower = normalizeEmail(email);

  const existing = await findRegistrationForEvent(db, eventId, emailLower);
  if (existing) {
    return { ok: false, error: "You are already registered for this event", status: 400 };
  }

  const registrationsSnapshot = await db
    .collection("events")
    .doc(eventId)
    .collection("registrations")
    .where("status", "!=", "cancelled")
    .get();

  if (registrationsSnapshot.size >= (event.capacity as number)) {
    return { ok: false, error: "Event is at full capacity", status: 400 };
  }

  return { ok: true, event, eventId };
}
