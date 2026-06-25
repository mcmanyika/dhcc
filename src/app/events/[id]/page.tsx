import { Suspense } from "react";
import EventDetailContent from "./EventDetailPage";

export default function EventDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-700 border-t-transparent" />
        </div>
      }
    >
      <EventDetailContent />
    </Suspense>
  );
}
