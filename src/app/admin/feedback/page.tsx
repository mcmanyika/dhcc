"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatsCard } from "@/components/ui/StatsCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import type { EventFeedback } from "@/types";

export default function AdminFeedbackPage() {
  const { getIdToken } = useAuth();
  const [feedback, setFeedback] = useState<EventFeedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const token = await getIdToken();
      if (!token) return;
      const res = await fetch("/api/feedback", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setFeedback(await res.json());
      setLoading(false);
    }
    load();
  }, [getIdToken]);

  const avgRating =
    feedback.length > 0
      ? (
          feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length
        ).toFixed(1)
      : "0";

  const wouldAttendAgain = feedback.filter((f) => f.wouldAttendAgain).length;
  const attendAgainPct =
    feedback.length > 0
      ? Math.round((wouldAttendAgain / feedback.length) * 100)
      : 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Feedback Analytics</h1>
      <p className="mt-1 text-gray-500">
        Review event feedback and identify improvement areas.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatsCard
          title="Total Responses"
          value={feedback.length}
          icon={Star}
        />
        <StatsCard
          title="Average Rating"
          value={avgRating}
          icon={Star}
          description="Out of 5"
        />
        <StatsCard
          title="Would Attend Again"
          value={`${attendAgainPct}%`}
          icon={Star}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-700 border-t-transparent" />
        </div>
      ) : feedback.length === 0 ? (
        <Card className="mt-6 text-center">
          <CardHeader>
            <CardTitle>No Feedback Yet</CardTitle>
            <CardDescription>
              Feedback will appear here after event attendees submit their
              responses.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="mt-6">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Rating</TableHeader>
                <TableHeader>Liked</TableHeader>
                <TableHeader>Improvements</TableHeader>
                <TableHeader>Topics</TableHeader>
                <TableHeader>Attend Again</TableHeader>
                <TableHeader>From</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {feedback.map((f) => (
                <TableRow key={f.id}>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      {f.rating}/5
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{f.liked}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {f.improvements}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {f.topicSuggestions || "—"}
                  </TableCell>
                  <TableCell>{f.wouldAttendAgain ? "Yes" : "No"}</TableCell>
                  <TableCell>
                    {f.name || "Anonymous"}
                    {f.email && (
                      <div className="text-xs text-gray-500">{f.email}</div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
