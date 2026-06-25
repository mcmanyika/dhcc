export function getEventScanUrl(eventId: string): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
  return `${base}/events/${eventId}/scan`;
}

export function isEventDay(eventDate: string): boolean {
  const today = new Date();
  const [year, month, day] = eventDate.split("-").map(Number);
  const eventDay = new Date(year, month - 1, day);
  return today.toDateString() === eventDay.toDateString();
}

export function isEventPast(eventDate: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [year, month, day] = eventDate.split("-").map(Number);
  const eventDay = new Date(year, month - 1, day);
  return eventDay < today;
}
