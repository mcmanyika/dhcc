"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { FeedbackForm } from "@/components/forms/FeedbackForm";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import type { Event } from "@/types";

export default function EventFeedbackPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/events/${id}`)
      .then((res) => res.json())
      .then(setEvent)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
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
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Event Feedback</CardTitle>
          <CardDescription>
            Share your experience at &ldquo;{event.title}&rdquo;. Your feedback
            helps us improve future events.
          </CardDescription>
        </CardHeader>
      </Card>
      <Card>
        <FeedbackForm eventId={id} eventTitle={event.title} />
      </Card>
    </div>
  );
}
