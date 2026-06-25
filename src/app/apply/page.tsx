import { Suspense } from "react";
import { ApplyPageContent } from "./ApplyPageContent";

export const metadata = {
  title: "Apply for Membership — DHCC",
};

export default function ApplyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-700 border-t-transparent" />
        </div>
      }
    >
      <ApplyPageContent />
    </Suspense>
  );
}
