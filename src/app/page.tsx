import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-teal-800">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
