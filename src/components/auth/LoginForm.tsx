"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Leaf } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { getPostAuthPath } from "@/lib/member-access";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import type { Member } from "@/types";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, getIdToken } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);

      if (next) {
        router.push(next);
        return;
      }

      const token = await getIdToken();
      let member: Member | null = null;
      if (token) {
        const adminRes = await fetch("/api/auth/verify", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (adminRes.ok) {
          router.push("/admin");
          return;
        }

        const res = await fetch("/api/members/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          member = await res.json();
        }
      }

      router.push(getPostAuthPath(member));
    } catch {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-[calc(100vh-0px)] flex-col items-center justify-center bg-gradient-to-br from-teal-800 to-teal-700 px-4 py-12 dark:from-slate-950 dark:to-slate-900">
      <div className="absolute right-4 top-4">
        <ThemeToggle variant="on-dark" />
      </div>
      <div className="mb-8 flex items-center gap-3 text-white">
        <div className="rounded-xl bg-white/10 p-3">
          <Leaf className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">DHCC</h1>
          <p className="text-sm text-teal-100">Dallas Holistic Chamber of Commerce</p>
        </div>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>
            Sign in to continue your membership application or access your member
            dashboard.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}
          <Input
            id="email"
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            id="password"
            label="Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" loading={loading} className="w-full">
            Sign In
          </Button>
          <p className="text-center text-sm text-gray-600 dark:text-slate-400">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-teal-700 hover:underline dark:text-teal-400"
            >
              Create one
            </Link>
          </p>
          <p className="text-center text-sm text-gray-500 dark:text-slate-400">
            <Link href="/events" className="hover:text-teal-700 hover:underline dark:hover:text-teal-400">
              View events
            </Link>
            {" · "}
            <Link href="/admin" className="hover:text-teal-700 hover:underline dark:hover:text-teal-400">
              Admin portal
            </Link>
          </p>
        </form>
      </Card>
    </div>
  );
}
