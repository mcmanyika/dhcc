"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, QrCode, Trash2, Users } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { EventForm } from "@/components/forms/EventForm";
import { EventQRCode } from "@/components/events/EventQRCode";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { Event, EventInput } from "@/types";

export default function AdminEventsPage() {
  const { getIdToken } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [qrEvent, setQrEvent] = useState<Event | null>(null);
  const [newEventQr, setNewEventQr] = useState<Event | null>(null);

  const fetchEvents = useCallback(async () => {
    const token = await getIdToken();
    if (!token) return;
    const res = await fetch("/api/events", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setEvents(await res.json());
    setLoading(false);
  }, [getIdToken]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const createEvent = async (data: EventInput) => {
    const token = await getIdToken();
    const res = await fetch("/api/events", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create event");
    const created: Event = await res.json();
    setShowCreate(false);
    setNewEventQr(created);
    fetchEvents();
  };

  const deleteEvent = async () => {
    if (!deleteId) return;
    const token = await getIdToken();
    await fetch(`/api/events/${deleteId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setDeleteId(null);
    fetchEvents();
  };

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">Events</h1>
          <p className="mt-1 text-gray-500">Create and manage chamber events.</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />
          Create Event
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-700 border-t-transparent" />
        </div>
      ) : events.length === 0 ? (
        <Card className="mt-4 text-center">
          <CardHeader>
            <CardTitle>No Events Yet</CardTitle>
            <CardDescription>Create your first event to get started.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Card key={event.id}>
              <CardHeader>
                <CardTitle>{event.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {event.description}
                </CardDescription>
                <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
                  {formatDateTime(event.date, event.time)}
                </p>
                <p className="text-sm text-gray-600 dark:text-slate-400">{event.location}</p>
                <p className="text-sm font-medium text-teal-700">
                  {event.price > 0 ? formatCurrency(event.price) : "Free"} ·
                  Cap: {event.capacity}
                </p>
              </CardHeader>
              <div className="flex flex-col gap-2 border-t border-gray-100 p-4">
                <div className="flex gap-2">
                  <Link href={`/admin/events/${event.id}`} className="flex-1">
                    <Button variant="outline" className="w-full" size="sm">
                      <Users className="h-3 w-3" />
                      Registrations
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQrEvent(event)}
                    title="View QR code"
                  >
                    <QrCode className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteId(event.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create Event"
        size="lg"
      >
        <EventForm onSubmit={createEvent} />
      </Modal>

      <Modal
        open={!!qrEvent}
        onClose={() => setQrEvent(null)}
        title={qrEvent ? `QR Code — ${qrEvent.title}` : "Event QR Code"}
      >
        {qrEvent && (
          <EventQRCode eventId={qrEvent.id} title="Scan to register or check in" />
        )}
      </Modal>

      <Modal
        open={!!newEventQr}
        onClose={() => setNewEventQr(null)}
        title="Event Created"
      >
        {newEventQr && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-slate-400">
              Share this QR code so attendees can register before the event and
              check in on the day.
            </p>
            <EventQRCode eventId={newEventQr.id} />
          </div>
        )}
      </Modal>

      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Event"
      >
        <p className="text-sm text-gray-600 dark:text-slate-400">
          Are you sure? All registrations for this event will also be deleted.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleteId(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={deleteEvent}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
