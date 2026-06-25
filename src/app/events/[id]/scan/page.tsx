import { Suspense } from "react";
import EventScanPage from "./EventScanPage";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-700 border-t-transparent" />
        </div>
      }
    >
      <EventScanPage />
    </Suspense>
  );
}
