"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import type { EventInput } from "@/types";

interface EventFormProps {
  initial?: EventInput;
  onSubmit: (data: EventInput) => Promise<void>;
  submitLabel?: string;
}

const emptyEvent: EventInput = {
  title: "",
  description: "",
  date: "",
  time: "",
  location: "",
  capacity: 50,
  price: 0,
};

export function EventForm({
  initial,
  onSubmit,
  submitLabel = "Create Event",
}: EventFormProps) {
  const [form, setForm] = useState<EventInput>(initial ?? emptyEvent);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updateField = <K extends keyof EventInput>(key: K, value: EventInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save event");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}
      <Input
        id="title"
        label="Event Title"
        required
        value={form.title}
        onChange={(e) => updateField("title", e.target.value)}
      />
      <Textarea
        id="description"
        label="Description"
        required
        rows={4}
        value={form.description}
        onChange={(e) => updateField("description", e.target.value)}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id="date"
          label="Date"
          type="date"
          required
          value={form.date}
          onChange={(e) => updateField("date", e.target.value)}
        />
        <Input
          id="time"
          label="Time"
          type="time"
          required
          value={form.time}
          onChange={(e) => updateField("time", e.target.value)}
        />
      </div>
      <Input
        id="location"
        label="Location"
        required
        value={form.location}
        onChange={(e) => updateField("location", e.target.value)}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id="capacity"
          label="Capacity"
          type="number"
          min={1}
          required
          value={form.capacity}
          onChange={(e) => updateField("capacity", parseInt(e.target.value) || 0)}
        />
        <Input
          id="price"
          label="Price ($)"
          type="number"
          min={0}
          step="0.01"
          required
          value={form.price}
          onChange={(e) => updateField("price", parseFloat(e.target.value) || 0)}
        />
      </div>
      <Button type="submit" loading={loading}>
        {submitLabel}
      </Button>
    </form>
  );
}
