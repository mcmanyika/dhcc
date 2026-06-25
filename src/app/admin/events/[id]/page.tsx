"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, QrCode } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EventQRCode } from "@/components/events/EventQRCode";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { formatDate } from "@/lib/utils";
import type { Event, EventRegistration, AttendanceStatus } from "@/types";

export default function AdminEventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { getIdToken } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQr, setShowQr] = useState(false);

  const fetchData = useCallback(async () => {
    const token = await getIdToken();
    if (!token) return;

    const [eventRes, regsRes] = await Promise.all([
      fetch(`/api/events/${id}`),
      fetch(`/api/events/${id}/register`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    if (eventRes.ok) setEvent(await eventRes.json());
    if (regsRes.ok) setRegistrations(await regsRes.json());
    setLoading(false);
  }, [getIdToken, id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateStatus = async (
    registrationId: string,
    status: AttendanceStatus
  ) => {
    const token = await getIdToken();
    await fetch(`/api/events/${id}/register`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ registrationId, status }),
    });
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-700 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/admin/events"
        className="mb-4 inline-flex items-center gap-1 text-sm text-teal-700 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Events
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{event?.title}</h1>
      <p className="mt-1 text-gray-500">
        {event && formatDate(event.date)} · {registrations.length} registrations
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => setShowQr(true)}>
          <QrCode className="h-4 w-4" />
          Show QR Code
        </Button>
      </div>

      <div className="mt-6">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Name</TableHeader>
              <TableHeader>Email</TableHeader>
              <TableHeader>Phone</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Registered</TableHeader>
              <TableHeader>Checked In</TableHeader>
              <TableHeader>Actions</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {registrations.map((reg) => (
              <TableRow key={reg.id}>
                <TableCell className="font-medium">{reg.name}</TableCell>
                <TableCell>{reg.email}</TableCell>
                <TableCell>{reg.phone || "—"}</TableCell>
                <TableCell>
                  <StatusBadge status={reg.status} />
                </TableCell>
                <TableCell>
                  {new Date(reg.registeredAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {reg.checkedInAt
                    ? new Date(reg.checkedInAt).toLocaleString()
                    : "—"}
                </TableCell>
                <TableCell>
                  <Select
                    value={reg.status}
                    onChange={(e) =>
                      updateStatus(reg.id, e.target.value as AttendanceStatus)
                    }
                    options={[
                      { value: "registered", label: "Registered" },
                      { value: "attended", label: "Attended" },
                      { value: "cancelled", label: "Cancelled" },
                    ]}
                    className="min-w-[140px]"
                  />
                </TableCell>
              </TableRow>
            ))}
            {registrations.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-gray-500">
                  No registrations yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Modal
        open={showQr}
        onClose={() => setShowQr(false)}
        title="Event QR Code"
      >
        <EventQRCode eventId={id} title="Scan to register or check in" />
      </Modal>
    </div>
  );
}
