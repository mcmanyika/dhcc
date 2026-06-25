"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import type { PaymentRecord } from "@/types";

export function useMyPayments() {
  const { user, loading: authLoading, getIdToken } = useAuth();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = useCallback(async () => {
    const token = await getIdToken();
    if (!token) {
      setPayments([]);
      setLoading(false);
      return;
    }

    const res = await fetch("/api/payments/me", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      setPayments(await res.json());
    } else {
      setPayments([]);
    }
    setLoading(false);
  }, [getIdToken]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setPayments([]);
      setLoading(false);
      return;
    }
    fetchPayments();
  }, [user, authLoading, fetchPayments]);

  return { payments, loading: authLoading || loading, refresh: fetchPayments };
}
