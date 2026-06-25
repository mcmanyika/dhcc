"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Calendar, CreditCard, MapPin } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { useAuth } from "@/components/providers/AuthProvider";
import { useMemberPrefill } from "@/hooks/useMemberPrefill";
import {
  confirmEventRegistration,
  submitEventRegistration,
} from "@/lib/event-registration-client";
import type { Event } from "@/types";

export default function EventDetailContent() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const paymentSuccess = searchParams.get("payment") === "success";
  const paymentCancelled = searchParams.get("payment") === "cancelled";
  const sessionId = searchParams.get("session_id");
  const { getIdToken } = useAuth();
  const { prefill, ready, isLoggedIn } = useMemberPrefill();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingRegistration, setCheckingRegistration] = useState(true);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [prefilled, setPrefilled] = useState(false);

  const isPaid = (event?.price ?? 0) > 0;

  useEffect(() => {
    fetch(`/api/events/${id}`)
      .then((res) => res.json())
      .then(setEvent)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!ready || prefilled) return;
    setForm({
      name: prefill.name,
      email: prefill.email,
      phone: prefill.phone,
    });
    setPrefilled(true);
  }, [ready, prefill, prefilled]);

  useEffect(() => {
    if (!isLoggedIn) {
      setCheckingRegistration(false);
      return;
    }

    getIdToken().then(async (token) => {
      if (!token) {
        setCheckingRegistration(false);
        return;
      }

      const res = await fetch(`/api/events/${id}/my-registration`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.registered) {
          setRegistered(true);
        }
      }
      setCheckingRegistration(false);
    });
  }, [id, isLoggedIn, getIdToken]);

  useEffect(() => {
    if (!paymentSuccess || !sessionId || registered) return;

    setConfirmingPayment(true);
    setError("");

    confirmEventRegistration(id, sessionId)
      .then(() => {
        setRegistered(true);
        window.history.replaceState({}, "", `/events/${id}`);
      })
      .catch((err) => {
        setError(
          err instanceof Error ? err.message : "Failed to confirm registration"
        );
      })
      .finally(() => setConfirmingPayment(false));
  }, [paymentSuccess, sessionId, id, registered]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setRegistering(true);

    try {
      const result = await submitEventRegistration(
        id,
        isPaid,
        form,
        getIdToken
      );
      if (result.type === "registered") {
        setRegistered(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setRegistering(false);
    }
  };

  if (loading || checkingRegistration || confirmingPayment) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-700 border-t-transparent" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <h1 className="text-2xl font-bold">Event Not Found</h1>
        <Link href="/events" className="mt-4 inline-block text-teal-700">
          Back to Events
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-5">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl">{event.title}</CardTitle>
          <CardDescription className="text-base">{event.description}</CardDescription>
          <div className="mt-4 space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500 dark:text-slate-400" />
              {formatDateTime(event.date, event.time)}
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-500 dark:text-slate-400" />
              {event.location}
            </div>
            <p className="font-semibold text-teal-700">
              {isPaid ? formatCurrency(event.price) : "Free"}
            </p>
          </div>
        </CardHeader>
      </Card>

      {paymentCancelled && !registered && (
        <div className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          Payment was cancelled. You can try again when you&apos;re ready.
        </div>
      )}

      {registered ? (
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="text-teal-700">You&apos;re Registered!</CardTitle>
            <CardDescription>
              {isLoggedIn
                ? `You're registered for "${event.title}". We'll see you there!`
                : `We've received your registration for "${event.title}". A confirmation will be sent to ${form.email}.`}
            </CardDescription>
          </CardHeader>
          <div className="flex flex-col gap-3 px-6 pb-6 sm:flex-row sm:justify-center">
            <Link href="/events">
              <Button variant="outline">View All Events</Button>
            </Link>
            <Link href={`/events/${id}/feedback`}>
              <Button variant="outline">Leave Feedback After Event</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Register for This Event</CardTitle>
            {isPaid && (
              <CardDescription>
                Complete payment securely via Stripe to reserve your spot.
              </CardDescription>
            )}
          </CardHeader>
          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}
            <Input
              id="name"
              label="Full Name"
              required
              readOnly={isLoggedIn}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={isLoggedIn ? "bg-gray-50" : undefined}
            />
            <Input
              id="email"
              label="Email"
              type="email"
              required
              readOnly={isLoggedIn}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={isLoggedIn ? "bg-gray-50" : undefined}
            />
            <Input
              id="phone"
              label="Phone"
              type="tel"
              readOnly={isLoggedIn}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className={isLoggedIn ? "bg-gray-50" : undefined}
            />
            <Button type="submit" loading={registering} className="w-full">
              {isPaid ? (
                <span className="inline-flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Pay {formatCurrency(event.price)} & Register
                </span>
              ) : (
                "Register"
              )}
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
