"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Calendar, CheckCircle, MapPin, UserCheck } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { isEventDay, isEventPast } from "@/lib/event-qr";
import { useMemberPrefill } from "@/hooks/useMemberPrefill";
import { useAuth } from "@/components/providers/AuthProvider";
import type { Event } from "@/types";

type ScanMode = "register" | "checkin";

export default function EventScanPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const forcedMode = searchParams.get("mode") as ScanMode | null;
  const { prefill, ready, isLoggedIn } = useMemberPrefill();
  const { getIdToken } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingRegistration, setCheckingRegistration] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [needsName, setNeedsName] = useState(false);
  const [prefilled, setPrefilled] = useState(false);

  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [checkInForm, setCheckInForm] = useState({
    name: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    fetch(`/api/events/${id}`)
      .then((res) => res.json())
      .then(setEvent)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!ready || prefilled) return;
    const filled = {
      name: prefill.name,
      email: prefill.email,
      phone: prefill.phone,
    };
    setRegisterForm(filled);
    setCheckInForm(filled);
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
          setSuccess("registered");
        }
      }
      setCheckingRegistration(false);
    });
  }, [id, isLoggedIn, getIdToken]);

  if (loading || checkingRegistration) {
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

  const mode: ScanMode =
    forcedMode === "checkin" || forcedMode === "register"
      ? forcedMode
      : isEventDay(event.date)
        ? "checkin"
        : "register";

  const past = isEventPast(event.date);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const token = await getIdToken();
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(`/api/events/${id}/register`, {
        method: "POST",
        headers,
        body: JSON.stringify(registerForm),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Registration failed");
      }

      setSuccess("registered");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch(`/api/events/${id}/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checkInForm),
      });

      const data = await res.json();

      if (res.status === 404 && data.error === "not_registered") {
        setNeedsName(true);
        setError(data.message);
        setSubmitting(false);
        return;
      }

      if (!res.ok) {
        throw new Error(data.error ?? data.message ?? "Check-in failed");
      }

      if (data.alreadyCheckedIn) {
        setSuccess("already");
      } else {
        setSuccess(data.walkIn ? "walkin" : "checkedin");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Check-in failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:px-6">
      <Card className="mb-6">
        <CardHeader>
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
            DHCC Event {mode === "checkin" ? "· Check-In" : "· Registration"}
          </p>
          <CardTitle className="text-xl">{event.title}</CardTitle>
          <div className="mt-3 space-y-1.5 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500 dark:text-slate-400" />
              {formatDateTime(event.date, event.time)}
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-500 dark:text-slate-400" />
              {event.location}
            </div>
            <p className="font-medium text-teal-700">
              {event.price > 0 ? formatCurrency(event.price) : "Free"}
            </p>
          </div>
        </CardHeader>
      </Card>

      {past && mode === "register" ? (
        <Card className="text-center">
          <CardHeader>
            <CardTitle>This event has ended</CardTitle>
            <CardDescription>
              Registration is closed. Thank you for your interest.
            </CardDescription>
          </CardHeader>
          <Link href={`/events/${id}/feedback`}>
            <Button variant="outline">Leave Feedback</Button>
          </Link>
        </Card>
      ) : success ? (
        <Card className="text-center">
          <CardHeader>
            <CheckCircle className="mx-auto mb-3 h-14 w-14 text-green-600" />
            <CardTitle className="text-green-700">
              {success === "registered" && "You're Registered!"}
              {success === "checkedin" && "Checked In!"}
              {success === "walkin" && "Welcome — Checked In!"}
              {success === "already" && "Already Checked In"}
            </CardTitle>
            <CardDescription className="text-base">
              {success === "registered" &&
                `We'll see you at "${event.title}" on ${formatDateTime(event.date, event.time)}.`}
              {(success === "checkedin" || success === "walkin") &&
                `Your presence at "${event.title}" has been recorded. Enjoy the event!`}
              {success === "already" &&
                "You're already checked in for today. Welcome back!"}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : mode === "checkin" ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-gray-500 dark:text-slate-400" />
              <CardTitle>Check In</CardTitle>
            </div>
            <CardDescription>
              Enter the email you used to register. Walk-ins can add their name
              if not pre-registered.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleCheckIn} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
                {error}
              </div>
            )}
            <Input
              id="checkin-email"
              label="Email"
              type="email"
              required
              readOnly={isLoggedIn}
              value={checkInForm.email}
              onChange={(e) =>
                setCheckInForm({ ...checkInForm, email: e.target.value })
              }
              className={isLoggedIn ? "bg-gray-50" : undefined}
            />
            {(needsName || checkInForm.name) && (
              <>
                <Input
                  id="checkin-name"
                  label="Full Name"
                  required={needsName}
                  readOnly={isLoggedIn}
                  value={checkInForm.name}
                  onChange={(e) =>
                    setCheckInForm({ ...checkInForm, name: e.target.value })
                  }
                  className={isLoggedIn ? "bg-gray-50" : undefined}
                />
                <Input
                  id="checkin-phone"
                  label="Phone"
                  type="tel"
                  readOnly={isLoggedIn}
                  value={checkInForm.phone}
                  onChange={(e) =>
                    setCheckInForm({ ...checkInForm, phone: e.target.value })
                  }
                  className={isLoggedIn ? "bg-gray-50" : undefined}
                />
              </>
            )}
            <Button type="submit" loading={submitting} className="w-full">
              Check In
            </Button>
          </form>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Register Your Attendance</CardTitle>
            <CardDescription>
              Let us know you&apos;re coming to this event.
            </CardDescription>
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
              value={registerForm.name}
              onChange={(e) =>
                setRegisterForm({ ...registerForm, name: e.target.value })
              }
              className={isLoggedIn ? "bg-gray-50" : undefined}
            />
            <Input
              id="email"
              label="Email"
              type="email"
              required
              readOnly={isLoggedIn}
              value={registerForm.email}
              onChange={(e) =>
                setRegisterForm({ ...registerForm, email: e.target.value })
              }
              className={isLoggedIn ? "bg-gray-50" : undefined}
            />
            <Input
              id="phone"
              label="Phone"
              type="tel"
              readOnly={isLoggedIn}
              value={registerForm.phone}
              onChange={(e) =>
                setRegisterForm({ ...registerForm, phone: e.target.value })
              }
              className={isLoggedIn ? "bg-gray-50" : undefined}
            />
            <Button type="submit" loading={submitting} className="w-full">
              Register
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
