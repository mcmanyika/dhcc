"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

async function confirmPayment(sessionId: string, token: string) {
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

  return data;
}

async function syncPayments(token: string) {
  const res = await fetch("/api/stripe/sync", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error ?? "Failed to sync payment");
  }

  return data;
}

export function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading, getIdToken } = useAuth();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<"confirming" | "success" | "error">(
    "confirming"
  );
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;

    getIdToken().then(async (token) => {
      if (!token || !user) {
        setStatus("error");
        setError("You must be signed in to confirm payment.");
        return;
      }

      try {
        if (sessionId) {
          await confirmPayment(sessionId, token);
        } else {
          await syncPayments(token);
        }

        setStatus("success");
        router.replace("/dashboard?payment=success");
      } catch (err) {
        try {
          await syncPayments(token);
          setStatus("success");
          router.replace("/dashboard?payment=success");
        } catch {
          setStatus("error");
          setError(
            err instanceof Error ? err.message : "Failed to confirm payment"
          );
        }
      }
    });
  }, [sessionId, authLoading, user, getIdToken, router]);

  if (status === "confirming" || authLoading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 sm:px-6">
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-teal-700 border-t-transparent" />
            <CardTitle>Confirming Payment</CardTitle>
            <CardDescription>
              Please wait while we activate your membership...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 sm:px-6">
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="text-red-700 dark:text-red-400">
              Confirmation Issue
            </CardTitle>
            <CardDescription className="text-base">{error}</CardDescription>
          </CardHeader>
          <div className="flex justify-center gap-4 pb-6">
            <Link href="/dashboard">
              <Button>Go to Dashboard</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-20 sm:px-6">
      <Card className="text-center">
        <CardHeader>
          <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-600" />
          <CardTitle className="text-2xl text-green-700 dark:text-green-400">
            Payment Successful!
          </CardTitle>
          <CardDescription className="text-base">
            Thank you for your membership payment. Your account has been
            activated.
          </CardDescription>
        </CardHeader>
        <div className="flex justify-center gap-4 pb-6">
          <Link href="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
