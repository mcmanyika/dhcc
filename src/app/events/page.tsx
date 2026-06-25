"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, CheckCircle, MapPin, Users } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { RegisteredEventsList } from "@/components/events/RegisteredEventsList";
import { useMyRegistrations } from "@/hooks/useMyRegistrations";
import { useAuth } from "@/components/providers/AuthProvider";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { Event } from "@/types";

export default function EventsPage() {
  const { user } = useAuth();
  const { registrations, loading: registrationsLoading, isRegistered } =
    useMyRegistrations();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/events")
      .then((res) => res.json())
      .then(setEvents)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-5">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Events</h1>
        <p className="mt-2 text-gray-600 dark:text-slate-400">
          Discover workshops, networking events, and wellness seminars.
        </p>
      </div>

      {user && !registrationsLoading && registrations.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>My Registered Events</CardTitle>
            <CardDescription>
              Events you&apos;ve signed up for ({registrations.length})
            </CardDescription>
          </CardHeader>
          <div className="px-6 pb-6">
            <RegisteredEventsList registrations={registrations} />
          </div>
        </Card>
      )}

      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">Upcoming Events</h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-700 border-t-transparent" />
        </div>
      ) : events.length === 0 ? (
        <Card className="text-center">
          <CardHeader>
            <CardTitle>No Upcoming Events</CardTitle>
            <CardDescription>
              Check back soon for new events and workshops.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => {
            const registered = isRegistered(event.id);

            return (
              <Card key={event.id} className="flex flex-col">
                <CardHeader className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle>{event.title}</CardTitle>
                    {registered && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                        <CheckCircle className="h-3 w-3" />
                        Registered
                      </span>
                    )}
                  </div>
                  <CardDescription className="line-clamp-3">
                    {event.description}
                  </CardDescription>
                  <div className="mt-4 space-y-2 text-sm text-gray-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-teal-700" />
                      {formatDateTime(event.date, event.time)}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-teal-700" />
                      {event.location}
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-teal-700" />
                      Capacity: {event.capacity}
                    </div>
                    <p className="font-semibold text-teal-700">
                      {event.price > 0 ? formatCurrency(event.price) : "Free"}
                    </p>
                  </div>
                </CardHeader>
                <div className="border-t border-gray-100 p-4 dark:border-slate-700">
                  <Link href={`/events/${event.id}`}>
                    <Button
                      className="w-full"
                      variant={registered ? "outline" : "primary"}
                    >
                      {registered ? "View Registration" : "Register"}
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
