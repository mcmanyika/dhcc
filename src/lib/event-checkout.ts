import { getStripe } from "@/lib/stripe";

interface EventCheckoutInput {
  eventId: string;
  eventTitle: string;
  eventDescription?: string;
  price: number;
  name: string;
  email: string;
  phone?: string;
  userId?: string;
}

export async function createEventCheckoutSession(
  input: EventCheckoutInput
): Promise<string> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const amountCents = Math.round(input.price * 100);

  if (amountCents <= 0) {
    throw new Error("Event price must be greater than zero for checkout");
  }

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    customer_email: input.email,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: input.eventTitle,
            description:
              input.eventDescription?.slice(0, 200) ||
              "DHCC event registration",
          },
          unit_amount: amountCents,
        },
        quantity: 1,
      },
    ],
    success_url: `${appUrl}/events/${input.eventId}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/events/${input.eventId}?payment=cancelled`,
    metadata: {
      paymentKind: "event",
      eventId: input.eventId,
      registrantName: input.name,
      registrantEmail: input.email,
      registrantPhone: input.phone ?? "",
      userId: input.userId ?? "",
    },
  });

  if (!session.url) {
    throw new Error("Failed to create checkout session");
  }

  return session.url;
}
