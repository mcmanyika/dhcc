import { Suspense } from "react";
import { MemberGuard } from "@/components/member/MemberGuard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MemberGuard>
      <Suspense
        fallback={
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-700 border-t-transparent" />
          </div>
        }
      >
        {children}
      </Suspense>
    </MemberGuard>
  );
}
