export async function submitEventRegistration(
  eventId: string,
  isPaid: boolean,
  form: { name: string; email: string; phone: string },
  getIdToken: () => Promise<string | null>
): Promise<{ type: "registered" } | { type: "redirect" }> {
  const token = await getIdToken();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const endpoint = isPaid
    ? `/api/events/${eventId}/checkout`
    : `/api/events/${eventId}/register`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(form),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error ?? "Registration failed");
  }

  if (isPaid && data.url) {
    window.location.href = data.url;
    return { type: "redirect" };
  }

  return { type: "registered" };
}

export async function confirmEventRegistration(
  eventId: string,
  sessionId: string
): Promise<void> {
  const res = await fetch(`/api/events/${eventId}/confirm-registration`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? "Failed to confirm registration");
  }
}
