"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { hasMemberDashboardAccess } from "@/lib/member-access";
import type { Member } from "@/types";

export function MemberGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, fetchMemberProfile } = useAuth();
  const router = useRouter();
  const [member, setMember] = useState<Member | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/?next=/dashboard");
      return;
    }

    async function checkAccess() {
      const profile = await fetchMemberProfile();
      setMember(profile);

      if (!profile || !hasMemberDashboardAccess(profile.status)) {
        router.replace("/apply");
        return;
      }

      setChecking(false);
    }

    checkAccess();
  }, [user, loading, router, fetchMemberProfile]);

  if (loading || checking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-700 border-t-transparent" />
      </div>
    );
  }

  if (!member) return null;

  return <>{children}</>;
}
