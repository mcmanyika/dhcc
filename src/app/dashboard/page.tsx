"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { MemberDashboardView } from "@/components/member/MemberDashboardView";
import { useMyPayments } from "@/hooks/useMyPayments";
import { useMyRegistrations } from "@/hooks/useMyRegistrations";
import { needsMembershipPayment } from "@/lib/membership-payment";
import type { Member } from "@/types";

export default function MemberDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentSuccess = searchParams.get("payment") === "success";
  const sessionId = searchParams.get("session_id");
  const { fetchMemberProfile, logout, getIdToken } = useAuth();
  const { registrations, loading: registrationsLoading } = useMyRegistrations();
  const { payments, loading: paymentsLoading, refresh: refreshPayments } =
    useMyPayments();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [syncingPayment, setSyncingPayment] = useState(false);
  const paymentSyncedRef = useRef(false);

  const loadMember = useCallback(async () => {
    const profile = await fetchMemberProfile();
    setMember(profile);
    setLoading(false);
    return profile;
  }, [fetchMemberProfile]);

  const syncPaymentStatus = useCallback(async () => {
    const token = await getIdToken();
    if (!token) return null;

    setSyncingPayment(true);

    try {
      if (sessionId) {
        const res = await fetch("/api/stripe/confirm", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sessionId }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error ?? "Failed to confirm payment");
        }
        if (data.member) {
          setMember(data.member);
        }
      } else {
        const res = await fetch("/api/stripe/sync", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error ?? "Failed to sync payment");
        }
        if (data.member) {
          setMember(data.member);
        }
      }

      await refreshPayments();
      const profile = await fetchMemberProfile();
      if (profile) setMember(profile);
      return profile;
    } finally {
      setSyncingPayment(false);
    }
  }, [sessionId, getIdToken, refreshPayments, fetchMemberProfile]);

  useEffect(() => {
    loadMember();
  }, [loadMember]);

  useEffect(() => {
    if (loading || !member || paymentSyncedRef.current) return;

    const shouldSync =
      !!sessionId ||
      (needsMembershipPayment(member) && !!member.stripeCustomerId);

    if (!shouldSync) return;

    paymentSyncedRef.current = true;
    syncPaymentStatus().then((profile) => {
      if (sessionId && profile && !needsMembershipPayment(profile)) {
        router.replace("/dashboard?payment=success");
      }
    });
  }, [loading, member, sessionId, syncPaymentStatus, router]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        loadMember();
        refreshPayments();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [loadMember, refreshPayments]);

  useEffect(() => {
    if (!paymentSuccess) return;

    loadMember();
    refreshPayments();

    const timer = setTimeout(() => {
      router.replace("/dashboard");
    }, 5000);

    return () => clearTimeout(timer);
  }, [paymentSuccess, router, loadMember, refreshPayments]);

  if (loading || !member) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-700 border-t-transparent" />
      </div>
    );
  }

  return (
    <MemberDashboardView
      member={member}
      payments={payments}
      paymentsLoading={paymentsLoading}
      registrations={registrations}
      registrationsLoading={registrationsLoading}
      syncingPayment={syncingPayment}
      paymentSuccess={paymentSuccess}
      editingProfile={editingProfile}
      onEditProfile={setEditingProfile}
      onMemberUpdated={setMember}
      onSyncPayment={syncPaymentStatus}
      onLogout={logout}
      needsPaymentRefresh={
        needsMembershipPayment(member) && !!member.stripeCustomerId
      }
    />
  );
}
