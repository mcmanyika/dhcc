"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import type { UserEventRegistration } from "@/types";

export function useMyRegistrations() {
  const { user, loading: authLoading, getIdToken } = useAuth();
  const [registrations, setRegistrations] = useState<UserEventRegistration[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRegistrations = useCallback(async () => {
    const token = await getIdToken();
    if (!token) {
      setRegistrations([]);
      setLoading(false);
      return;
    }

    const res = await fetch("/api/events/my-registrations", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      setRegistrations(await res.json());
    } else {
      setRegistrations([]);
    }
    setLoading(false);
  }, [getIdToken]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setRegistrations([]);
      setLoading(false);
      return;
    }
    fetchRegistrations();
  }, [user, authLoading, fetchRegistrations]);

  const registeredEventIds = useMemo(
    () => new Set(registrations.map((item) => item.event.id)),
    [registrations]
  );

  const isRegistered = useCallback(
    (eventId: string) => registeredEventIds.has(eventId),
    [registeredEventIds]
  );

  return {
    registrations,
    loading: authLoading || loading,
    registeredEventIds,
    isRegistered,
    refresh: fetchRegistrations,
  };
}
