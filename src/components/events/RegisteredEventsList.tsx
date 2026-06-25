"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Calendar, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDateTime } from "@/lib/utils";
import type { UserEventRegistration } from "@/types";

const PAGE_SIZE = 2;

interface RegisteredEventsListProps {
  registrations: UserEventRegistration[];
  emptyMessage?: string;
}

export function RegisteredEventsList({
  registrations,
  emptyMessage = "You haven't registered for any events yet.",
}: RegisteredEventsListProps) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(registrations.length / PAGE_SIZE));

  const paginatedRegistrations = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return registrations.slice(start, start + PAGE_SIZE);
  }, [registrations, page]);

  useEffect(() => {
    setPage(1);
  }, [registrations.length]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  if (registrations.length === 0) {
    return <p className="text-sm text-gray-500 dark:text-slate-400">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {paginatedRegistrations.map(({ event, registration }) => (
          <div
            key={registration.id}
            className="group flex flex-col gap-2 rounded-lg border border-gray-100 border-l-4 border-l-teal-600 bg-gray-50/50 p-3 transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:border-l-teal-500 dark:bg-slate-900/40"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-gray-900 dark:text-slate-100">{event.title}</p>
                <StatusBadge status={registration.status} />
              </div>
              <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 shrink-0 text-gray-500 dark:text-slate-400" />
                  {formatDateTime(event.date, event.time)}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0 text-gray-500 dark:text-slate-400" />
                  {event.location}
                </div>
              </div>
            </div>
            <Link href={`/events/${event.id}`} className="shrink-0">
              <Button variant="outline" size="sm">
                View Event
              </Button>
            </Link>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-100 pt-4 dark:border-slate-700">
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
