"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";

export interface UserPrefill {
  name: string;
  email: string;
  phone: string;
}

export function useMemberPrefill() {
  const { user, loading: authLoading, fetchMemberProfile } = useAuth();
  const [prefill, setPrefill] = useState<UserPrefill>({
    name: "",
    email: "",
    phone: "",
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setPrefill({ name: "", email: "", phone: "" });
      setReady(true);
      return;
    }

    let cancelled = false;

    fetchMemberProfile().then((member) => {
      if (cancelled) return;

      if (member) {
        setPrefill({
          name: `${member.firstName} ${member.lastName}`.trim(),
          email: member.email || user.email || "",
          phone: member.phone || "",
        });
      } else {
        setPrefill({
          name: user.displayName || "",
          email: user.email || "",
          phone: "",
        });
      }
      setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, fetchMemberProfile]);

  return { prefill, ready, isLoggedIn: !!user };
}
