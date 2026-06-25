"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Clock, XCircle } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { MembershipForm } from "@/components/forms/MembershipForm";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { hasMemberDashboardAccess } from "@/lib/member-access";
import type { Member } from "@/types";

export function ApplyPageContent() {
  const { user, loading, fetchMemberProfile } = useAuth();
  const router = useRouter();
  const [member, setMember] = useState<Member | null | undefined>(undefined);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/?next=/apply");
      return;
    }

    fetchMemberProfile().then((profile) => {
      setMember(profile);
      if (profile && hasMemberDashboardAccess(profile.status)) {
        router.replace("/dashboard");
      }
    });
  }, [user, loading, router, fetchMemberProfile]);

  if (loading || member === undefined) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-700 border-t-transparent" />
      </div>
    );
  }

  if (member?.status === "pending") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <Card className="text-center">
          <CardHeader>
            <Clock className="mx-auto mb-4 h-12 w-12 text-amber-500" />
            <CardTitle>Application Under Review</CardTitle>
            <CardDescription className="text-base">
              Thank you, {member.firstName}! Your membership application for{" "}
              <strong>{member.businessName}</strong> is being reviewed. We&apos;ll
              notify you by email once a decision has been made.
            </CardDescription>
            <div className="mt-4 flex justify-center">
              <StatusBadge status={member.status} />
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (member?.status === "rejected") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <Card className="mb-8 text-center">
          <CardHeader>
            <XCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
            <CardTitle>Application Not Approved</CardTitle>
            <CardDescription className="text-base">
              Your previous application was not approved. You may submit a new
              application below.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <MembershipForm />
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Membership Application</CardTitle>
          <CardDescription>
            Complete your application to join the Dallas Holistic Chamber of
            Commerce. Signed in as <strong>{user?.email}</strong>.
          </CardDescription>
        </CardHeader>
      </Card>
      <Card>
        <MembershipForm
          defaultEmail={user?.email ?? ""}
          onSuccess={() => {
            fetchMemberProfile().then(setMember);
          }}
        />
      </Card>
      <p className="mt-4 text-center text-sm text-gray-500">
        New here?{" "}
        <Link href="/register" className="text-teal-700 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
