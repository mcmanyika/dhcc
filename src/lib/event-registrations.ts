import type { Firestore } from "firebase-admin/firestore";
import type { Event, EventRegistration, UserEventRegistration } from "@/types";

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isActiveRegistration(data: FirebaseFirestore.DocumentData) {
  return data.status !== "cancelled";
}

export async function findRegistrationForEvent(
  db: Firestore,
  eventId: string,
  email: string
): Promise<EventRegistration | null> {
  const emailLower = normalizeEmail(email);
  const regSnap = await db
    .collection("events")
    .doc(eventId)
    .collection("registrations")
    .get();

  const match = regSnap.docs.find((doc) => {
    const data = doc.data();
    return data.email?.toLowerCase() === emailLower && isActiveRegistration(data);
  });

  if (!match) return null;

  return {
    id: match.id,
    eventId,
    ...match.data(),
  } as EventRegistration;
}

export async function findRegistrationsForEmail(
  db: Firestore,
  email: string
): Promise<UserEventRegistration[]> {
  const emailLower = normalizeEmail(email);
  const eventsSnap = await db.collection("events").orderBy("date", "desc").get();
  const results: UserEventRegistration[] = [];

  for (const eventDoc of eventsSnap.docs) {
    const regSnap = await eventDoc.ref.collection("registrations").get();
    const match = regSnap.docs.find((doc) => {
      const data = doc.data();
      return data.email?.toLowerCase() === emailLower && isActiveRegistration(data);
    });

    if (match) {
      results.push({
        event: { id: eventDoc.id, ...eventDoc.data() } as Event,
        registration: {
          id: match.id,
          eventId: eventDoc.id,
          ...match.data(),
        } as EventRegistration,
      });
    }
  }

  return results;
}
