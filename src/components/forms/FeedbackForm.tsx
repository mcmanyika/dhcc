"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import type { FeedbackInput } from "@/types";

interface FeedbackFormProps {
  eventId: string;
  eventTitle: string;
}

export function FeedbackForm({ eventId, eventTitle }: FeedbackFormProps) {
  const [form, setForm] = useState<FeedbackInput>({
    eventId,
    rating: 5,
    liked: "",
    improvements: "",
    topicSuggestions: "",
    wouldAttendAgain: true,
    name: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to submit feedback");
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="text-center">
        <CardHeader>
          <CardTitle className="text-teal-700">Thank You!</CardTitle>
          <CardDescription>
            Your feedback for &ldquo;{eventTitle}&rdquo; has been submitted. We
            appreciate your input!
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Overall Rating <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, rating: n }))}
              className={`flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-medium transition-colors ${
                form.rating >= n
                  ? "border-teal-700 bg-teal-700 text-white"
                  : "border-gray-300 text-gray-600 hover:border-teal-500"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <Textarea
        id="liked"
        label="What did you like?"
        required
        rows={3}
        value={form.liked}
        onChange={(e) => setForm((prev) => ({ ...prev, liked: e.target.value }))}
      />

      <Textarea
        id="improvements"
        label="What can be improved?"
        required
        rows={3}
        value={form.improvements}
        onChange={(e) =>
          setForm((prev) => ({ ...prev, improvements: e.target.value }))
        }
      />

      <Textarea
        id="topicSuggestions"
        label="Topic Suggestions"
        rows={2}
        value={form.topicSuggestions}
        onChange={(e) =>
          setForm((prev) => ({ ...prev, topicSuggestions: e.target.value }))
        }
        placeholder="What topics would you like to see at future events?"
      />

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={form.wouldAttendAgain}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, wouldAttendAgain: e.target.checked }))
          }
          className="h-4 w-4 rounded border-gray-300 text-teal-700 focus:ring-teal-500"
        />
        <span className="text-sm text-gray-600">
          I would attend a similar event again
        </span>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id="name"
          label="Name (optional)"
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
        />
        <Input
          id="email"
          label="Email (optional)"
          type="email"
          value={form.email}
          onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
        />
      </div>

      <Button type="submit" loading={loading}>
        Submit Feedback
      </Button>
    </form>
  );
}
